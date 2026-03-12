/**
 * Booking page – Multi-step ticket booking flow for a specific screening.
 *
 * Steps:
 *   1. SeatSelection    → pick seats on the 3D cinema grid
 *   2. ContactForm      → enter name, email, phone
 *   3. PaymentForm      → enter card details and pay
 *   4. BookingConfirmation → success screen with ticket summary
 *
 * Manages seat locking/unlocking via the bookings API and receives
 * realtime seat state via WebSocket so users stay in sync.
 */

import { useState, useEffect, useCallback } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Ticket } from "lucide-react"
import { useReservation } from "@/context/ReservationContext"
import { useAuth } from "@/context/AuthContext"
import { getScreening } from "@/api/screenings"
import { getScreeningBookings, createBooking, lockSeats, unlockSeats, getLockedSeats } from "@/api/bookings"

import StripeProvider from "@/components/StripeProvider"
import StepProgress from "@/components/booking/StepProgress"
import SeatSelection from "@/components/booking/SeatSelection"
import ContactForm from "@/components/booking/ContactForm"
import PaymentForm from "@/components/booking/PaymentForm"
import BookingConfirmation from "@/components/booking/BookingConfirmation"

export default function Booking() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { toast } = useToast()
    const { addReservation, clearMovieReservations, reservations } = useReservation()
    const { user, isAuthenticated, accessToken, subscription } = useAuth()

    const [screening, setScreening] = useState(null)
    const [screeningLoading, setScreeningLoading] = useState(true)
    const [moviePrice, setMoviePrice] = useState(null)
    const [step, setStep] = useState(1)
    const [selectedSeats, setSelectedSeats] = useState([])
    const [hallLayout, setHallLayout] = useState(null)
    const [bookingSummary, setBookingSummary] = useState(null)

    /* Unique session ID so the server can track which locks belong to this tab */
    const [sessionId] = useState(() => {
        let sid = sessionStorage.getItem(`booking_session_${id}`)
        if (!sid) {
            sid = crypto.randomUUID()
            sessionStorage.setItem(`booking_session_${id}`, sid)
        }
        return sid
    })

    /* ─── Fetch occupied seats (booked + locked by other sessions) ─── */
    const fetchOccupiedData = useCallback(async (currentPrice, currentLayout) => {
        if (!currentLayout) return
        try {
            const bookedSeats = await getScreeningBookings(id)
            const lockedSeatsObj = await getLockedSeats(id)

            const lockedByOthers = Object.entries(lockedSeatsObj)
                .filter(([, sid]) => sid !== sessionId)
                .map(([seat]) => seat)

            const myLockedSeats = Object.entries(lockedSeatsObj)
                .filter(([, sid]) => sid === sessionId)
                .map(([seat]) => seat)

            setSelectedSeats(prev => {
                const uniqueSeats = Array.from(new Set([...prev, ...myLockedSeats]))
                return uniqueSeats.filter(s => !bookedSeats.includes(s))
            })

            setHallLayout({
                ...currentLayout,
                pricePerSeat: Number.isFinite(currentPrice) ? currentPrice : 0,
                occupiedSeats: [...bookedSeats, ...lockedByOthers]
            })
        } catch (error) {
            console.error("Error fetching bookings/locks:", error)
            setHallLayout({
                ...currentLayout,
                pricePerSeat: Number.isFinite(currentPrice) ? currentPrice : 0,
                occupiedSeats: []
            })
        }
    }, [id, sessionId])

    const applyRealtimeSeatState = useCallback((payload) => {
        if (!payload || typeof payload !== 'object') return

        const bookedSeats = Array.isArray(payload.booked_seats) ? payload.booked_seats : []
        const lockMap = payload.locked_seats && typeof payload.locked_seats === 'object'
            ? payload.locked_seats
            : {}

        const lockedByOthers = Object.entries(lockMap)
            .filter(([, sid]) => sid !== sessionId)
            .map(([seat]) => seat)

        const myLockedSeats = Object.entries(lockMap)
            .filter(([, sid]) => sid === sessionId)
            .map(([seat]) => seat)

        setSelectedSeats(prev => {
            const uniqueSeats = Array.from(new Set([...prev, ...myLockedSeats]))
            return uniqueSeats.filter(s => !bookedSeats.includes(s))
        })

        setHallLayout(prev => {
            const base = prev || screening?.layout
            if (!base) return prev
            return {
                ...base,
                pricePerSeat: Number.isFinite(moviePrice) ? moviePrice : 0,
                occupiedSeats: [...bookedSeats, ...lockedByOthers],
            }
        })
    }, [sessionId, screening, moviePrice])

    const [formData, setFormData] = useState({
        name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || "" : "",
        email: user?.email || "",
        phone: user?.profile?.phone || user?.phone || "",
        cardNumber: "", expiry: "", cvv: ""
    })

    /* ─── Fetch screening info on mount ─── */
    useEffect(() => {
        const fetchScreening = async () => {
            setScreeningLoading(true)
            try {
                const data = await getScreening(id)
                const screeningDate = data?.start_time ? new Date(data.start_time) : null
                const formattedDate = screeningDate
                    ? screeningDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : "TBD"
                const formattedTime = screeningDate
                    ? screeningDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : "--:--"

                setScreening({
                    id: data?.id || id,
                    movieTitle: data?.movie_title || data?.movie?.title || "Sample Movie",
                    date: formattedDate,
                    time: formattedTime,
                    hall: data?.hall_name || data?.hall || "Hall 1",
                    hallImage: data?.hall_image_url || null,
                    movieId: data?.movie || data?.movie_id || null,
                    layout: data?.hall_layout || null,
                })

                const parsedPrice = Number(data?.price_per_seat ?? data?.price ?? data?.ticket_price ?? data?.movie?.price)
                setMoviePrice(Number.isFinite(parsedPrice) ? parsedPrice : 0)
            } catch (error) {
                console.error("Error fetching screening:", error)
                setScreening({ id, movieTitle: "Unknown", date: "—", time: "—", hall: "—", movieId: null, layout: null })
                setMoviePrice(0)
            } finally {
                setScreeningLoading(false)
            }
        }
        fetchScreening()
    }, [id])

    /* ─── Restore persisted seat selection from context ─── */
    useEffect(() => {
        if (!screening || step >= 4) return
        const existingReservation = reservations.find(
            r => r.movieId === screening.id && r.screeningDate === screening.date && r.screeningTime === screening.time
        )
        if (existingReservation && existingReservation.seats.length > 0 && selectedSeats.length === 0) {
            setSelectedSeats(existingReservation.seats)
        }
    }, [reservations, screening, step, selectedSeats.length])

    /* ─── Sync occupied data + register beacon for unlock on page leave ─── */
    useEffect(() => {
        if (moviePrice === null || !screening) return
        fetchOccupiedData(moviePrice, screening.layout)

        const handleBeforeUnload = () => {
            const data = JSON.stringify({ session_id: sessionId })
            const apiUrl = import.meta.env.VITE_API_URL || ""
            navigator.sendBeacon(`${apiUrl}/api/screenings/${id}/unlock_seats/`, new Blob([data], { type: 'application/json' }))
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [moviePrice, id, sessionId, fetchOccupiedData, screening])

    /* WebSocket-first realtime updates with fallback polling. */
    useEffect(() => {
        if (moviePrice === null || !screening || step !== 1) return

        let socket = null
        let reconnectTimer = null
        let isClosed = false

        const fallbackRefresh = () => fetchOccupiedData(moviePrice, screening.layout)

        const connectSocket = () => {
            const apiBase = import.meta.env.VITE_API_URL || window.location.origin
            const parsed = new URL(apiBase, window.location.origin)
            const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:'
            const wsUrl = `${wsProtocol}//${parsed.host}/ws/screenings/${id}/seats/`

            socket = new WebSocket(wsUrl)

            socket.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data)
                    applyRealtimeSeatState(payload)
                } catch (error) {
                    console.error('Invalid websocket payload:', error)
                }
            }

            socket.onclose = () => {
                if (isClosed) return
                reconnectTimer = window.setTimeout(connectSocket, 2000)
            }

            socket.onerror = () => {
                // Keep fallback refresh running; close triggers reconnect.
            }
        }

        connectSocket()

        const fallbackIntervalId = window.setInterval(fallbackRefresh, 15000)

        const handleFocus = () => fallbackRefresh()
        window.addEventListener('focus', handleFocus)
        document.addEventListener('visibilitychange', handleFocus)

        return () => {
            isClosed = true
            if (reconnectTimer) window.clearTimeout(reconnectTimer)
            if (socket && socket.readyState <= 1) socket.close()
            window.clearInterval(fallbackIntervalId)
            window.removeEventListener('focus', handleFocus)
            document.removeEventListener('visibilitychange', handleFocus)
        }
    }, [moviePrice, screening, step, fetchOccupiedData, id, applyRealtimeSeatState])

    const pricePerSeat = hallLayout?.pricePerSeat ?? moviePrice ?? 0

    const computeClientPrice = (sub, seatsCount, pricePerSeat) => {
        const cfg = { free: [0, 0], pro: [2, 0.3], ultra: [4, 0.5] }[sub?.tier ?? 'free'] ?? [0, 0]
        const [weeklyFree, discount] = cfg
        const remaining = Math.max(0, weeklyFree - (sub?.free_tickets_used ?? 0))
        const freeCount = Math.min(remaining, seatsCount)
        const paidCount = seatsCount - freeCount
        const total = paidCount * pricePerSeat * (1 - discount)
        return { freeCount, paidCount, discountRate: discount, total: Math.round(total * 100) / 100 }
    }

    const seatsCount = selectedSeats.length
    const pricing = computeClientPrice(subscription, seatsCount, pricePerSeat)
    const effectivePrice = isAuthenticated ? pricing.total : seatsCount * pricePerSeat
    const totalPrice = effectivePrice

    /* ─── Toggle a single seat (lock / unlock on server) ─── */
    const toggleSeat = async (seat) => {
        if (!hallLayout || hallLayout.occupiedSeats.includes(seat)) return
        if (!screening) return

        const isCurrentlySelected = selectedSeats.includes(seat)

        if (!isCurrentlySelected) {
            try {
                await lockSeats(id, [seat], sessionId)
                setSelectedSeats(prev => {
                    const newSeats = [...prev, seat]
                    addReservation(screening.id, screening.movieTitle, newSeats, screening.date, screening.time, hallLayout?.hallName || screening.hall)
                    return newSeats
                })
            } catch (error) {
                console.error("Lock failed:", error)
                toast({ title: "Seat Unavailable", description: "This seat was just taken or locked by someone else.", variant: "destructive" })
                fetchOccupiedData(pricePerSeat, screening.layout)
            }
        } else {
            try {
                await unlockSeats(id, [seat], sessionId)
                setSelectedSeats(prev => {
                    const newSeats = prev.filter(s => s !== seat)
                    if (newSeats.length > 0) {
                        addReservation(screening.id, screening.movieTitle, newSeats, screening.date, screening.time, hallLayout?.hallName || screening.hall)
                    } else {
                        clearMovieReservations(screening.id, screening.date, screening.time)
                    }
                    return newSeats
                })
            } catch (error) {
                console.error("Unlock failed", error)
            }
        }
    }

    /* ─── Submit final booking ─── */
    const handleSubmit = async () => {
        try {
            if (totalPrice === 0) {
                // Free booking — create directly (no Stripe involved)
                const bookingData = {
                    screening: id,
                    customer_name: formData.name,
                    customer_email: formData.email,
                    customer_phone: formData.phone || "",
                    seats_booked: selectedSeats.length,
                    seat_numbers: selectedSeats.sort().join(','),
                    session_id: sessionId,
                    total_price: totalPrice,
                    status: 'confirmed'
                }
                await createBooking(bookingData, accessToken)
            }
            // For paid bookings the backend webhook already created the booking
            // after Stripe confirmed the payment in PaymentForm.
            setBookingSummary({ seats: [...selectedSeats].sort(), total: effectivePrice, email: formData.email })
            clearMovieReservations(screening.id, screening.date, screening.time)
            toast({ title: "Booking Confirmed!", description: `Seats ${selectedSeats.join(', ')} booked.` })
            setStep(4)
        } catch (error) {
            console.error("Error creating booking:", error)
            toast({ title: "Error", description: `Failed to save booking: ${error.message}`, variant: "destructive" })
        }
    }

    /* ─── Loading state ─── */
    if (screeningLoading || !screening) return <div className="p-10 text-center"><Skeleton className="h-10 w-64 mx-auto" /></div>

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-6 md:py-8">
            <Link to="/movies" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="h-4 w-4" /> Back to Movies
            </Link>

            <div className="flex items-center gap-3 mb-8">
                <Ticket className="h-8 w-8" />
                <div>
                    <h1 className="text-2xl font-bold">Book Tickets</h1>
                    <p className="text-muted-foreground">{screening.movieTitle} • {screening.date}</p>
                </div>
            </div>

            <StepProgress currentStep={step} />

            {step === 1 && (
                <>
                {isAuthenticated && subscription && subscription.tier !== 'free' && (
                    <div style={{ marginBottom: '12px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
                        🎟 {Math.max(0, (subscription.weekly_free_total ?? 0) - (subscription.free_tickets_used ?? 0))} free ticket(s) remaining this week
                    </div>
                )}
                <SeatSelection
                    hallLayout={hallLayout}
                    hallImage={screening.hallImage}
                    selectedSeats={selectedSeats}
                    totalPrice={totalPrice}
                    onToggleSeat={toggleSeat}
                    onConfirm={() => {
                        if (isAuthenticated) {
                            setStep(3); // Skip ContactForm if signed in
                        } else {
                            setStep(2); // Ask for Contact info if guest
                        }
                    }}
                />
                </>
            )}

            {step === 2 && (
                <ContactForm
                    formData={formData}
                    onChange={setFormData}
                    onBack={() => setStep(1)}
                    onNext={() => setStep(3)}
                />
            )}

            {step === 3 && (
                <StripeProvider>
                <PaymentForm
                    formData={formData}
                    totalPrice={totalPrice}
                    pricingBreakdown={isAuthenticated && subscription && subscription.tier !== 'free' ? { ...pricing, tier: subscription.tier, pricePerSeat } : null}
                    screeningId={id}
                    selectedSeats={selectedSeats}
                    sessionId={sessionId}
                    onBack={() => {
                        if (isAuthenticated) {
                            setStep(1);
                        } else {
                            setStep(2);
                        }
                    }}
                    onSubmit={handleSubmit}
                />
                </StripeProvider>
            )}

            {step === 4 && bookingSummary && (
                <BookingConfirmation
                    screening={screening}
                    bookingSummary={bookingSummary}
                    onReturnHome={() => { clearMovieReservations(screening.id, screening.date, screening.time); navigate('/'); }}
                    onNewBooking={() => { clearMovieReservations(screening.id, screening.date, screening.time); setStep(1); setSelectedSeats([]); }}
                />
            )}
        </div>
    )
}