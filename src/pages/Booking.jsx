/*
Αυτή η σελίδα επιτρέπει στους χρήστες να κάνουν κράτηση εισιτηρίων για μια προβολή.
*/

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Ticket, CreditCard, User, Check } from "lucide-react"
import { useReservation } from "@/context/ReservationContext"
import { getScreening } from "@/api/movies"

// ============================================
// LOCAL VARIABLES - Replace with backend API later
// ============================================
const MOCK_HALL_LAYOUT = {
    // Hall configuration
    hallName: "Hall 1",
    rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],

    // Section configuration
    sections: {
        left: {
            enabled: true,      // Is this section available?
            seatsPerRow: 3,     // Number of seats per row in this section
            startSeat: 1,       // Starting seat number
        },
        middle: {
            enabled: true,
            seatsPerRow: 6,
            startSeat: 4,
        },
        right: {
            enabled: true,
            seatsPerRow: 3,
            startSeat: 10,
        }
    },

    // Occupied/booked seats (would come from backend)
    occupiedSeats: ['A1', 'A2', 'B5', 'B6', 'C7', 'D10', 'E5', 'E6', 'F12', 'G4', 'H1', 'H11'],

    // Price per seat - will be fetched from API
    pricePerSeat: 0
}

const DEFAULT_PRICE = 14

export default function Booking() {
    const { id } = useParams() // this id is a screening id
    const { toast } = useToast()
    const { addReservation, clearMovieReservations, reservations } = useReservation()

    const [screening, setScreening] = useState(null)
    const [screeningLoading, setScreeningLoading] = useState(true)
    const [moviePrice, setMoviePrice] = useState(null)
    const [step, setStep] = useState(1) // 1: Seats, 2: Details, 3: Payment, 4: Confirmation
    const [selectedSeats, setSelectedSeats] = useState([])
    const [loading, setLoading] = useState(true)
    const [hallLayout, setHallLayout] = useState(null)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        cardNumber: "",
        expiry: "",
        cvv: ""
    })

    // Fetch screening to get correct movie, hall, time and price
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
                })

                const parsedPrice = Number(data?.price_per_seat ?? data?.price ?? data?.ticket_price ?? data?.movie?.price)
                setMoviePrice(Number.isFinite(parsedPrice) ? parsedPrice : DEFAULT_PRICE)
            } catch (error) {
                console.error("Error fetching screening:", error)
                setScreening({
                    id,
                    movieTitle: "Sample Movie",
                    date: "Dec 20, 2025",
                    time: "19:30",
                    hall: "Hall 1",
                    movieId: null,
                })
                setMoviePrice(DEFAULT_PRICE)
            } finally {
                setScreeningLoading(false)
            }
        }

        fetchScreening()
    }, [id])

    // Initialize selectedSeats from existing reservation if any
    useEffect(() => {
        if (!screening) return
        const existingReservation = reservations.find(
            r => r.movieId === screening.id && r.screeningDate === screening.date && r.screeningTime === screening.time
        )
        setSelectedSeats(existingReservation?.seats || [])
    }, [reservations, screening])


    // Simulate loading from backend
    useEffect(() => {
        if (moviePrice === null) return

        const fetchHallLayout = async () => {
            setLoading(true)
            await new Promise(resolve => setTimeout(resolve, 500))

            setHallLayout({
                ...MOCK_HALL_LAYOUT,
                pricePerSeat: Number.isFinite(moviePrice) ? moviePrice : DEFAULT_PRICE
            })
            setLoading(false)
        }

        fetchHallLayout()
    }, [moviePrice])

    const toggleSeat = (seat) => {
        if (!hallLayout || hallLayout.occupiedSeats.includes(seat)) return
        if (!screening) return

        setSelectedSeats(prev => {
            const newSeats = prev.includes(seat)
                ? prev.filter(s => s !== seat)
                : [...prev, seat]

            // Update reservation in context (this starts/updates the timer)
            if (newSeats.length > 0) {
                addReservation(
                    screening.id,
                    screening.movieTitle,
                    newSeats,
                    screening.date,
                    screening.time,
                    hallLayout?.hallName || screening.hall
                )
            }

            return newSeats
        })
    }

    const handleInputChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const handleSubmit = () => {
        if (!screening) return
        clearMovieReservations(screening.id, screening.date, screening.time)

        toast({
            title: "Booking Confirmed! 🎉",
            description: `Your tickets for seats ${selectedSeats.join(', ')} have been booked.`,
        })
        setStep(4)
    }

    const pricePerSeat = hallLayout?.pricePerSeat ?? moviePrice ?? DEFAULT_PRICE
    const totalPrice = selectedSeats.length * pricePerSeat

    // Render a single section of seats
    const renderSection = (sectionKey, section, row) => {
        if (!section.enabled) return null

        return (
            <div key={sectionKey} className="flex gap-1 sm:gap-1.5">
                {Array.from({ length: section.seatsPerRow }, (_, i) => {
                    const seatNumber = section.startSeat + i
                    const seat = `${row}${seatNumber}`
                    const isOccupied = hallLayout.occupiedSeats.includes(seat)
                    const isSelected = selectedSeats.includes(seat)

                    return (
                        <button
                            key={seat}
                            onClick={() => toggleSeat(seat)}
                            disabled={isOccupied}
                            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-t-lg text-xs font-medium transition-all duration-200 ${
                                isOccupied 
                                    ? 'bg-gradient-to-b from-red-400 to-red-600 text-red-100 cursor-not-allowed' 
                                    : isSelected 
                                        ? 'bg-gradient-to-b from-green-400 to-green-600 text-white hover:scale-110' 
                                        : 'bg-gradient-to-b from-white to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 hover:scale-110'
                            }`}
                            title={seat}
                        >
                            {seatNumber}
                        </button>
                    )
                })}
            </div>
        )
    }

    // Render loading skeleton for seats
    const renderSeatsSkeleton = () => (
        <div className="flex flex-col items-center gap-2 mb-6">
            {Array.from({ length: 8 }, (_, rowIndex) => {
                const totalRows = 8
                const middleIndex = (totalRows - 1) / 2
                const distanceFromMiddle = Math.abs(rowIndex - middleIndex)
                const curveOffset = Math.pow(distanceFromMiddle, 1.8) * 8
                const scale = 0.82 + (rowIndex / totalRows) * 0.18

                return (
                    <div
                        key={rowIndex}
                        className="flex items-center gap-2 sm:gap-4"
                        style={{
                            paddingLeft: `${curveOffset}px`,
                            paddingRight: `${curveOffset}px`,
                            transform: `scale(${scale})`,
                        }}
                    >
                        <Skeleton className="w-6 h-6" />
                        <div className="flex gap-1">
                            {Array.from({ length: 3 }, (_, i) => (
                                <Skeleton key={`left-${i}`} className="w-6 h-6 sm:w-8 sm:h-8 rounded-t-lg" />
                            ))}
                        </div>
                        <div className="w-4" />
                        <div className="flex gap-1">
                            {Array.from({ length: 6 }, (_, i) => (
                                <Skeleton key={`mid-${i}`} className="w-6 h-6 sm:w-8 sm:h-8 rounded-t-lg" />
                            ))}
                        </div>
                        <div className="w-4" />
                        <div className="flex gap-1">
                            {Array.from({ length: 3 }, (_, i) => (
                                <Skeleton key={`right-${i}`} className="w-6 h-6 sm:w-8 sm:h-8 rounded-t-lg" />
                            ))}
                        </div>
                        <Skeleton className="w-6 h-6" />
                    </div>
                )
            })}
        </div>
    )

    if (screeningLoading || !screening) {
        return (
            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
                <Skeleton className="h-8 w-48 mb-3" />
                <Skeleton className="h-4 w-64" />
            </div>
        )
    }

    return (
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            {/* Back Button */}
            <Link to="/movies" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="h-4 w-4" />
                Back to Movies
            </Link>

            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <Ticket className="h-7 w-7 md:h-8 md:w-8" />
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Book Tickets</h1>
                    <p className="text-sm md:text-base text-muted-foreground">
                        {screening.movieTitle} • {screening.date} at {screening.time} • {hallLayout?.hallName || screening.hall}
                    </p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
                {['Select Seats', 'Your Details', 'Payment', 'Confirmation'].map((label, index) => (
                    <div key={label} className="flex items-center">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                            step > index + 1 ? 'bg-green-500 text-white' :
                            step === index + 1 ? 'bg-primary text-primary-foreground' : 
                            'bg-muted text-muted-foreground'
                        }`}>
                            {step > index + 1 ? <Check className="h-4 w-4" /> : index + 1}
                        </div>
                        <span className={`hidden sm:block ml-2 text-sm ${step === index + 1 ? 'font-medium' : 'text-muted-foreground'}`}>
                            {label}
                        </span>
                        {index < 3 && <div className="w-8 sm:w-16 h-0.5 bg-muted mx-2" />}
                    </div>
                ))}
            </div>

            {/* Step 1: Seat Selection */}
            {step === 1 && (
                <Card className="overflow-visible">
                    <CardHeader>
                        <CardTitle>Select Your Seats</CardTitle>
                        <CardDescription>Click on available seats to select them</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-visible">
                        {/* 3D Theater Container */}
                        <div
                            className="relative overflow-visible"
                            style={{
                                perspective: '800px',
                                perspectiveOrigin: '50% 20%',
                            }}
                        >
                            {/* Screen Image */}
                            <div className="mb-6 sm:mb-6 md:mb-8 relative flex flex-col items-center">
                                <div className="w-full flex justify-center px-4">
                                    <img
                                        src="/screen.webp"
                                        alt="Cinema Screen"
                                        className="w-[38%] max-w-md h-auto object-contain"
                                        style={{
                                            transform: 'rotateX(8deg)',
                                            filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.4))',
                                        }}
                                    />
                                </div>
                                <p className="text-center text-xs text-muted-foreground mt-2 sm:mt-3 tracking-widest uppercase">Screen</p>
                            </div>

                            {/* Seat Grid with 3D Sections - Curved Layout */}
                            {loading ? (
                                renderSeatsSkeleton()
                            ) : hallLayout ? (
                                <div className="w-full overflow-x-auto pb-4">
                                    <div
                                        className="flex flex-col items-center gap-1.5 sm:gap-2 mb-6 min-w-max mx-auto"
                                        style={{
                                            transform: 'rotateX(20deg)',
                                            transformStyle: 'preserve-3d',
                                        }}
                                    >
                                    {hallLayout.rows.map((row, rowIndex) => {
                                        // Calculate curve offset - middle rows curve inward more
                                        const totalRows = hallLayout.rows.length
                                        const middleIndex = (totalRows - 1) / 2
                                        const distanceFromMiddle = Math.abs(rowIndex - middleIndex)
                                        const curveOffset = Math.pow(distanceFromMiddle, 1.8) * 8

                                        // Calculate scale - front rows slightly smaller for perspective
                                        const scale = 0.82 + (rowIndex / totalRows) * 0.18

                                        // Calculate z-depth for 3D effect
                                        const zDepth = rowIndex * 3

                                        // Calculate opacity - back rows slightly dimmer
                                        const opacity = 0.80 + (rowIndex / totalRows) * 0.20

                                        return (
                                            <div
                                                key={row}
                                                className="flex items-center gap-2 sm:gap-4 transition-all"
                                                style={{
                                                    paddingLeft: `${curveOffset}px`,
                                                    paddingRight: `${curveOffset}px`,
                                                    transform: `scale(${scale}) translateZ(${zDepth}px)`,
                                                    opacity: opacity,
                                                }}
                                            >
                                                {/* Row Label Left */}
                                                <span className="w-6 text-sm text-muted-foreground text-center font-medium">{row}</span>

                                                {/* Left Section */}
                                                {hallLayout.sections.left.enabled && (
                                                    <>
                                                        {renderSection('left', hallLayout.sections.left, row)}
                                                        <div className="w-3 sm:w-5" /> {/* Aisle */}
                                                    </>
                                                )}

                                                {/* Middle Section */}
                                                {hallLayout.sections.middle.enabled && (
                                                    renderSection('middle', hallLayout.sections.middle, row)
                                                )}

                                                {/* Right Section */}
                                                {hallLayout.sections.right.enabled && (
                                                    <>
                                                        <div className="w-3 sm:w-5" /> {/* Aisle */}
                                                        {renderSection('right', hallLayout.sections.right, row)}
                                                    </>
                                                )}

                                                {/* Row Label Right */}
                                                <span className="w-6 text-sm text-muted-foreground text-center font-medium">{row}</span>
                                            </div>
                                        )
                                    })}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground">Failed to load seat layout</p>
                            )}
                        </div>

                        {/* Legend */}
                        <div className="flex justify-center gap-4 sm:gap-6 mb-6 flex-wrap">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-gradient-to-b from-white to-gray-100 shadow-sm border border-gray-200" />
                                <span className="text-sm">Available</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-gradient-to-b from-green-400 to-green-600 shadow-sm" />
                                <span className="text-sm">Selected</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-gradient-to-b from-red-400 to-red-600 shadow-sm" />
                                <span className="text-sm">Booked</span>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                            <div>
                                <p className="text-sm text-muted-foreground">Selected Seats</p>
                                <p className="font-medium">{selectedSeats.length > 0 ? selectedSeats.sort().join(', ') : 'None'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Total</p>
                                <p className="text-xl font-bold">${totalPrice}</p>
                            </div>
                        </div>

                        <Button
                            className="w-full mt-4"
                            disabled={selectedSeats.length === 0}
                            onClick={() => setStep(2)}
                        >
                            Continue
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Step 2: User Details */}
            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Your Details
                        </CardTitle>
                        <CardDescription>Enter your information for the booking</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                            <Button
                                className="flex-1"
                                disabled={!formData.name || !formData.email}
                                onClick={() => setStep(3)}
                            >
                                Continue to Payment
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Payment Details
                        </CardTitle>
                        <CardDescription>Enter your card information (Demo only - no real payment)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg mb-4">
                            <div className="flex justify-between mb-2">
                                <span className="text-muted-foreground">Seats</span>
                                <span>{selectedSeats.sort().join(', ')}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>${totalPrice}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cardNumber">Card Number</Label>
                            <Input
                                id="cardNumber"
                                name="cardNumber"
                                placeholder="1234 5678 9012 3456"
                                value={formData.cardNumber}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="expiry">Expiry Date</Label>
                                <Input
                                    id="expiry"
                                    name="expiry"
                                    placeholder="MM/YY"
                                    value={formData.expiry}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cvv">CVV</Label>
                                <Input
                                    id="cvv"
                                    name="cvv"
                                    placeholder="123"
                                    value={formData.cvv}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                            <Button
                                className="flex-1"
                                onClick={handleSubmit}
                            >
                                Complete Booking
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
                        <p className="text-muted-foreground mb-6">
                            Your tickets have been booked successfully. A confirmation email has been sent to {formData.email}.
                        </p>

                        <div className="p-4 bg-muted/50 rounded-lg max-w-sm mx-auto mb-6">
                            <p className="font-medium mb-2">{screening.movieTitle}</p>
                            <p className="text-sm text-muted-foreground">{screening.date} at {screening.time}</p>
                            <p className="text-sm text-muted-foreground">{hallLayout?.hallName || screening.hall}</p>
                            <p className="text-sm font-medium mt-2">Seats: {selectedSeats.sort().join(', ')}</p>
                            <p className="text-sm font-bold mt-2">Total: ${totalPrice}</p>
                        </div>

                        <div className="flex gap-3 justify-center">
                            <Link to="/">
                                <Button variant="outline">Back to Home</Button>
                            </Link>
                            <Link to="/movies">
                                <Button>Browse More Movies</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

