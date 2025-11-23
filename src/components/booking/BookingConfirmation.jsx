/**
 * BookingConfirmation – Step 4 of the booking flow.
 * Shows a green checkmark, booked seats, total paid, and links to go home or start a new booking.
 */

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check } from "lucide-react"

export default function BookingConfirmation({ screening, bookingSummary, onReturnHome, onNewBooking }) {
    return (
        <Card className="max-w-lg mx-auto border-green-500/20 shadow-xl shadow-green-500/5">
            <CardContent className="py-12 text-center">
                {/* Success icon */}
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
                    <Check className="h-10 w-10 text-white" />
                </div>

                <h2 className="text-3xl font-black mb-2">Enjoy the Show!</h2>
                <p className="text-muted-foreground mb-8">A confirmation was sent to {bookingSummary.email}</p>

                {/* Ticket stub */}
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

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button className="flex-1" onClick={onReturnHome}>Return Home</Button>
                    <Button variant="outline" className="flex-1" onClick={onNewBooking}>New Booking</Button>
                </div>
            </CardContent>
        </Card>
    )
}
