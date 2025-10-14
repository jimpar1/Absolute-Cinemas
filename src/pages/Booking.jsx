import { useParams, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { createBooking } from "../api/bookings"
import { getScreening } from "../api/screenings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock, Ticket, User, Mail, Phone, CreditCard } from "lucide-react"

export default function Booking() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { toast } = useToast()
    const [screening, setScreening] = useState(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [form, setForm] = useState({
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        seats_booked: 1,
        screening: id,
        status: "confirmed",
    })

    useEffect(() => {
        getScreening(id)
            .then(setScreening)
            .catch(err => {
                console.error("Failed to fetch screening details:", err)
                setScreening(null)
            })
            .finally(() => setLoading(false))
    }, [id])

    function submit(e) {
        e.preventDefault()
        if (!screening || !screening.price) {
            toast({
                variant: "destructive",
                title: "Booking Error",
                description: "Screening details are not available. Please try again.",
            })
            return
        }

        setSubmitting(true)
        const bookingData = {
            ...form,
            total_price: form.seats_booked * screening.price,
        }

        createBooking(bookingData)
            .then(res => {
                toast({
                    title: "Booking Confirmed!",
                    description: `Successfully booked ${form.seats_booked} seat${form.seats_booked > 1 ? 's' : ''}.`,
                })
                console.log(res)
                setTimeout(() => navigate("/screenings"), 1500)
            })
            .catch(err => {
                console.error(err)
                toast({
                    variant: "destructive",
                    title: "Booking Failed",
                    description: "Unable to complete booking. Please try again later.",
                })
            })
            .finally(() => setSubmitting(false))
    }

    if (loading) {
        return (
            <div className="container py-8 max-w-4xl">
                <Skeleton className="h-10 w-64 mb-8" />
                <div className="grid md:grid-cols-2 gap-6">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        )
    }

    if (!screening) {
        return (
            <div className="container py-16 text-center">
                <h2 className="text-2xl font-bold mb-4">Screening not found</h2>
                <Button onClick={() => navigate("/screenings")}>Back to Screenings</Button>
            </div>
        )
    }

    const totalPrice = form.seats_booked * (screening.price || 0)

    return (
        <>
            <div className="container py-8 max-w-4xl">
                <div className="flex items-center gap-3 mb-8">
                    <Ticket className="h-8 w-8" />
                    <h1 className="text-4xl font-bold">Book Screening</h1>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Screening Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Screening Details</CardTitle>
                            <CardDescription>Review your selected screening</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Movie</p>
                                <p className="font-semibold text-lg">{screening.movie_title || `Movie ID: ${screening.movie}`}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Date</p>
                                    <p className="font-medium">
                                        {new Date(screening.start_time).toLocaleDateString('en-US', { 
                                            weekday: 'long', 
                                            month: 'long', 
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Time</p>
                                    <p className="font-medium">
                                        {new Date(screening.start_time).toLocaleTimeString('en-US', { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Price per ticket</p>
                                <p className="font-semibold text-xl">${screening.price}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Booking Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Information</CardTitle>
                            <CardDescription>Enter your details to complete booking</CardDescription>
                        </CardHeader>
                        <form onSubmit={submit}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Full Name
                                    </label>
                                    <Input
                                        id="name"
                                        placeholder="John Doe"
                                        required
                                        value={form.customer_name}
                                        onChange={e => setForm({ ...form, customer_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        Email
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        required
                                        value={form.customer_email}
                                        onChange={e => setForm({ ...form, customer_email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        Phone
                                    </label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+1 (555) 000-0000"
                                        required
                                        value={form.customer_phone}
                                        onChange={e => setForm({ ...form, customer_phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="seats" className="text-sm font-medium flex items-center gap-2">
                                        <Ticket className="h-4 w-4" />
                                        Number of Seats
                                    </label>
                                    <Input
                                        id="seats"
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={form.seats_booked}
                                        onChange={e => setForm({ ...form, seats_booked: parseInt(e.target.value) || 1 })}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-4">
                                <div className="w-full flex items-center justify-between p-4 bg-muted rounded-lg">
                                    <span className="font-semibold">Total Price</span>
                                    <span className="text-2xl font-bold">${totalPrice.toFixed(2)}</span>
                                </div>
                                <Button 
                                    type="submit" 
                                    className="w-full gap-2" 
                                    size="lg"
                                    disabled={submitting}
                                >
                                    <CreditCard className="h-5 w-5" />
                                    {submitting ? "Processing..." : "Confirm Booking"}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        </>
    )
}
