/*
Αυτή η σελίδα επιτρέπει στους χρήστες να κάνουν κράτηση εισιτηρίων για μια προβολή.
*/

import { useState, useEffect, useCallback } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Ticket, Check } from "lucide-react"
import { useReservation } from "@/context/ReservationContext"
import { getScreening, getScreeningBookings, createBooking, lockSeats, unlockSeats, getLockedSeats } from "@/api/movies"


export default function Booking() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { toast } = useToast()
    const { addReservation, clearMovieReservations, reservations } = useReservation()

    const [screening, setScreening] = useState(null)
    const [screeningLoading, setScreeningLoading] = useState(true)
    const [moviePrice, setMoviePrice] = useState(null)
    const [step, setStep] = useState(1)
    const [selectedSeats, setSelectedSeats] = useState([])
    const [hallLayout, setHallLayout] = useState(null)
    const [bookingSummary, setBookingSummary] = useState(null) // Snaphot για το Step 4

    const [sessionId] = useState(() => {
        let sid = sessionStorage.getItem(`booking_session_${id}`)
        if (!sid) {
            sid = crypto.randomUUID()
            sessionStorage.setItem(`booking_session_${id}`, sid)
        }
        return sid
    })

    const fetchOccupiedData = useCallback(async (currentPrice, currentLayout) => {
        if (!currentLayout) return
        try {
            const bookedSeats = await getScreeningBookings(id)
            const lockedSeatsObj = await getLockedSeats(id)

            const lockedByOthers = Object.entries(lockedSeatsObj)
                .filter(([, sid]) => sid !== sessionId)
                .map(([seat]) => seat)

            // Restore my own valid locks
            const myLockedSeats = Object.entries(lockedSeatsObj)
                .filter(([, sid]) => sid === sessionId)
                .map(([seat]) => seat)

            setSelectedSeats(prev => {
                const uniqueSeats = Array.from(new Set([...prev, ...myLockedSeats]))
                return uniqueSeats.filter(s => !bookedSeats.includes(s)) // Ensure we don't select already booked ones
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

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        cardNumber: "",
        expiry: "",
        cvv: ""
    })

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
                    movieId: data?.movie || data?.movie_id || null,
                    layout: data?.hall_layout || null,
                })

                const parsedPrice = Number(data?.price_per_seat ?? data?.price ?? data?.ticket_price ?? data?.movie?.price)
                setMoviePrice(Number.isFinite(parsedPrice) ? parsedPrice : 0)
            } catch (error) {
                console.error("Error fetching screening:", error)
                setScreening({
                    id, movieTitle: "Unknown", date: "—", time: "—", hall: "—", movieId: null, layout: null
                })
                setMoviePrice(0)
            } finally {
                setScreeningLoading(false)
            }
        }
        fetchScreening()
    }, [id])

    useEffect(() => {
        if (!screening || step >= 4) return
        const existingReservation = reservations.find(
            r => r.movieId === screening.id && r.screeningDate === screening.date && r.screeningTime === screening.time
        )
        if (existingReservation && existingReservation.seats.length > 0 && selectedSeats.length === 0) {
            // We shouldn't blindly trust persisted context state without a valid lock on the server, 
            // but the fetchOccupiedData will re-sync our actual valid locks anyway.
            setSelectedSeats(existingReservation.seats)
        }
    }, [reservations, screening, step, selectedSeats.length])

    useEffect(() => {
        if (moviePrice === null || !screening) return
        fetchOccupiedData(moviePrice, screening.layout)

        // Setup unlock on exit
        const handleBeforeUnload = () => {
            const data = JSON.stringify({ session_id: sessionId })
            navigator.sendBeacon(`http://127.0.0.1:8000/api/screenings/${id}/unlock_seats/`, new Blob([data], { type: 'application/json' }))
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [moviePrice, id, sessionId, fetchOccupiedData, screening])

    const pricePerSeat = hallLayout?.pricePerSeat ?? moviePrice ?? 0
    const totalPrice = selectedSeats.length * pricePerSeat

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

    const handleSubmit = async () => {
        try {
            // Create one booking with all seats
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

            console.log("Sending booking data:", bookingData)
            const response = await createBooking(bookingData)
            console.log("Booking response:", response)

            setBookingSummary({
                seats: [...selectedSeats].sort(),
                total: totalPrice,
                email: formData.email
            });
            toast({ title: "Booking Confirmed!", description: `Seats ${selectedSeats.join(', ')} booked.` })
            setStep(4)
        } catch (error) {
            console.error("Error creating booking:", error)
            toast({ title: "Error", description: `Failed to save booking: ${error.message}`, variant: "destructive" })
        }
    }

    const renderSection = (sectionKey, section, row, rowIndex) => {
        if (!section.enabled) return null
        return (
            <div key={sectionKey} className="flex gap-1 sm:gap-1.5">
                {Array.from({ length: section.seatsPerRow }, (_, i) => {
                    const seatIndexInTier = (rowIndex * section.seatsPerRow) + i;
                    if (section.maxSeats && seatIndexInTier >= section.maxSeats) {
                        return <div key={`empty-${row}-${i}`} className="w-6 h-6 sm:w-8 sm:h-8" />;
                    }

                    const seatNumber = section.startSeat + i
                    const seat = `${row}${seatNumber}`
                    const isOccupied = hallLayout.occupiedSeats.includes(seat)
                    const isSelected = selectedSeats.includes(seat)
                    return (
                        <button
                            key={seat}
                            onClick={() => toggleSeat(seat)}
                            disabled={isOccupied}
                            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-t-lg text-xs font-medium transition-all duration-200 ${isOccupied ? 'bg-linear-to-b from-red-400 to-red-600 text-red-100 cursor-not-allowed' :
                                isSelected ? 'bg-linear-to-b from-green-400 to-green-600 text-white hover:scale-110' :
                                    'bg-linear-to-b from-white to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 hover:scale-110'
                                }`}
                        >
                            {seatNumber}
                        </button>
                    )
                })}
            </div>
        )
    }

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

            {/* Step Progress */}
            <div className="flex items-center justify-center mb-12">
                {['Seats', 'Details', 'Payment', 'Done'].map((label, index) => (
                    <div key={label} className="flex items-center">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs ${step > index + 1 ? 'bg-green-500 text-white' : step === index + 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {step > index + 1 ? <Check className="h-4 w-4" /> : index + 1}
                        </div>
                        {index < 3 && <div className="w-8 sm:w-16 h-0.5 bg-muted mx-2" />}
                    </div>
                ))}
            </div>

            {/* Step 1: 3D Seat Selection */}
            {step === 1 && (
                <Card className="overflow-visible border-none shadow-none bg-transparent">
                    <CardContent className="overflow-visible">
                        <div className="relative" style={{ perspective: '1000px', perspectiveOrigin: '50% 20%' }}>
                            {/* The Screen */}
                            <div className="mb-12 flex flex-col items-center">
                                <img src="/screen.webp" alt="Screen" className="w-[45%] max-w-md h-auto" style={{ transform: 'rotateX(10deg)', filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.5))' }} />
                                <p className="text-[10px] tracking-[0.3em] text-muted-foreground mt-4 uppercase">Cinema Screen</p>
                            </div>

                            {/* The 3D Curved Grid */}
                            <div className="w-full overflow-x-auto pb-10 flex flex-col items-center">
                                {hallLayout && (hallLayout.tiers ? hallLayout.tiers : [{ name: 'Main', rows: hallLayout.rows || [], sections: hallLayout.sections }]).map((tier) => (
                                    <div key={tier.name} className="flex flex-col items-center gap-2 min-w-max mb-6" style={{ transform: 'rotateX(25deg)', transformStyle: 'preserve-3d' }}>
                                        {tier.name !== 'Main' && (
                                            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-4 mt-8">— {tier.name} —</div>
                                        )}
                                        {tier.rows && tier.rows.map((row, rowIndex) => {
                                            const middleIndex = (tier.rows.length - 1) / 2
                                            const curve = Math.pow(Math.abs(rowIndex - middleIndex), 1.8) * 8
                                            const scale = 0.85 + (rowIndex / tier.rows.length) * 0.15
                                            return (
                                                <div key={row} className="flex items-center gap-3" style={{ paddingLeft: `${curve}px`, paddingRight: `${curve}px`, transform: `scale(${scale}) translateZ(${rowIndex * 5}px)` }}>
                                                    <span className="w-6 text-[10px] font-bold text-muted-foreground text-right">{row}</span>
                                                    {renderSection('left', tier.sections.left, row, rowIndex)}
                                                    <div className="w-4" />
                                                    {renderSection('middle', tier.sections.middle, row, rowIndex)}
                                                    <div className="w-4" />
                                                    {renderSection('right', tier.sections.right, row, rowIndex)}
                                                    <span className="w-6 text-[10px] font-bold text-muted-foreground">{row}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-center p-6 bg-card border rounded-xl mt-6 gap-4">
                            <div className="text-center md:text-left">
                                <p className="text-sm text-muted-foreground">Seats Selected</p>
                                <p className="text-lg font-bold">{selectedSeats.length > 0 ? selectedSeats.sort().join(', ') : 'Select seats...'}</p>
                            </div>
                            <div className="text-center md:text-right">
                                <p className="text-sm text-muted-foreground">Total Price</p>
                                <p className="text-2xl font-black text-primary">${totalPrice}</p>
                            </div>
                        </div>
                        <Button className="w-full h-12 mt-6 text-lg font-bold" disabled={selectedSeats.length === 0} onClick={() => setStep(2)}>Confirm Seats</Button>
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
                <Card className="max-w-md mx-auto">
                    <CardHeader><CardTitle>Contact Info</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input name="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input name="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="6912345678" />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button variant="outline" className="w-1/3" onClick={() => setStep(1)}>Back</Button>
                            <Button className="flex-1" disabled={!formData.name || !formData.email || !formData.phone} onClick={() => setStep(3)}>Next</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
                <Card className="max-w-md mx-auto">
                    <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg flex justify-between">
                            <span className="font-medium">Total to pay:</span>
                            <span className="font-bold text-primary">${totalPrice}</span>
                        </div>
                        <Input placeholder="Card Number" value={formData.cardNumber} onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })} />
                        <div className="grid grid-cols-2 gap-4">
                            <Input placeholder="MM/YY" value={formData.expiry} onChange={(e) => setFormData({ ...formData, expiry: e.target.value })} />
                            <Input placeholder="CVV" value={formData.cvv} onChange={(e) => setFormData({ ...formData, cvv: e.target.value })} />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button variant="outline" className="w-1/3" onClick={() => setStep(2)}>Back</Button>
                            <Button className="flex-1" onClick={handleSubmit}>Pay & Finish</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 4: Confirmation (Snapshot Fix Applied) */}
            {step === 4 && bookingSummary && (
                <Card className="max-w-lg mx-auto border-green-500/20 shadow-xl shadow-green-500/5">
                    <CardContent className="py-12 text-center">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
                            <Check className="h-10 w-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-black mb-2">Enjoy the Show!</h2>
                        <p className="text-muted-foreground mb-8">A confirmation was sent to {bookingSummary.email}</p>

                        <div className="bg-muted/40 p-6 rounded-2xl border border-dashed border-muted-foreground/30 mb-8">
                            <div className="space-y-1 mb-4">
                                <h3 className="text-xl font-bold">{screening.movieTitle}</h3>
                                <p className="text-sm text-muted-foreground">{screening.date} • {screening.time}</p>
                            </div>
                            <div className="flex justify-between py-2 border-t border-muted">
                                <span className="text-sm">Seats booked:</span>
                                <span className="text-sm font-bold">{bookingSummary.seats.join(', ')}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-sm">Amount Paid:</span>
                                <span className="text-lg font-black text-green-600">${bookingSummary.total}</span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button className="flex-1" onClick={() => { clearMovieReservations(screening.id, screening.date, screening.time); navigate('/'); }}>Return Home</Button>
                            <Button variant="outline" className="flex-1" onClick={() => { clearMovieReservations(screening.id, screening.date, screening.time); setStep(1); setSelectedSeats([]); }}>New Booking</Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}