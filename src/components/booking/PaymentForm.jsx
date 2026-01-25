/**
 * PaymentForm – Step 3 of the booking flow.
 * Uses Stripe CardElement for real (test-mode) payment processing.
 * Falls back to instant confirmation for free bookings (€0).
 */

import { useState } from "react"
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createBookingIntent } from "@/api/payments"
import { useAuth } from "@/context/AuthContext"

const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Cascadia Code, monospace',
            '::placeholder': { color: 'rgba(255,255,255,0.35)' },
        },
        invalid: { color: '#ef4444' },
    },
}

export default function PaymentForm({ formData, totalPrice, pricingBreakdown, onBack, onSubmit, screeningId, selectedSeats, sessionId }) {
    const stripe = useStripe()
    const elements = useElements()
    const { accessToken } = useAuth()

    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState(null)
    const [paymentSuccess, setPaymentSuccess] = useState(false)

    const handlePay = async () => {
        setProcessing(true)
        setError(null)

        try {
            // Create PaymentIntent on the backend
            const intentData = {
                screening_id: screeningId,
                seats_booked: selectedSeats.length,
                seat_numbers: selectedSeats.sort().join(','),
                session_id: sessionId,
                customer_name: formData.name,
                customer_email: formData.email,
                customer_phone: formData.phone || "",
            }
            const result = await createBookingIntent(intentData, accessToken)

            // Free booking — no Stripe confirmation needed
            if (result.free_booking) {
                setPaymentSuccess(true)
                setTimeout(() => onSubmit(), 1000)
                return
            }

            if (!stripe || !elements) {
                setError("Stripe hasn't loaded yet. Please try again.")
                setProcessing(false)
                return
            }

            // Confirm payment with Stripe
            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
                result.client_secret,
                { payment_element: undefined, payment_method: { card: elements.getElement(CardElement) } }
            )

            if (stripeError) {
                setError(stripeError.message)
                setProcessing(false)
                return
            }

            if (paymentIntent.status === 'succeeded') {
                setPaymentSuccess(true)
                setTimeout(() => onSubmit(), 1500)
            }
        } catch (err) {
            setError(err.message || "Payment failed. Please try again.")
            setProcessing(false)
        }
    }

    if (paymentSuccess) {
        return (
            <Card className="max-w-md mx-auto">
                <CardContent className="pt-8 pb-8">
                    <div style={{ fontFamily: "monospace" }} className="space-y-5">
                        <div className="flex items-center gap-3 text-white text-lg font-bold tracking-wide">
                            <span>✅</span>
                            <span>PAYMENT CONFIRMED</span>
                        </div>
                        <div className="border border-white/20 rounded p-3 space-y-1 text-sm">
                            <div className="text-white font-bold tracking-widest">
                                Amount: €{totalPrice}
                            </div>
                            <div className="text-white/50">
                                {totalPrice === 0 ? "Free tickets applied — no charge." : "Payment processed via Stripe (test mode)."}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="max-w-md mx-auto">
            <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                {pricingBreakdown ? (
                    <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', lineHeight: '1.7' }}>
                        <div style={{ fontWeight: 700, marginBottom: '6px', color: 'rgba(255,255,255,0.9)' }}>
                            🎟 {pricingBreakdown.tier.charAt(0).toUpperCase() + pricingBreakdown.tier.slice(1)} Subscription Applied
                        </div>
                        {pricingBreakdown.freeCount > 0 && (
                            <div style={{ color: 'rgba(255,255,255,0.65)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{pricingBreakdown.freeCount} × Free ({pricingBreakdown.tier.charAt(0).toUpperCase() + pricingBreakdown.tier.slice(1)})</span>
                                <span>€0.00</span>
                            </div>
                        )}
                        {pricingBreakdown.paidCount > 0 && (
                            <div style={{ color: 'rgba(255,255,255,0.65)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{pricingBreakdown.paidCount} × Seat × €{pricingBreakdown.pricePerSeat} – {Math.round(pricingBreakdown.discountRate * 100)}%</span>
                                <span>€{(pricingBreakdown.paidCount * pricingBreakdown.pricePerSeat * (1 - pricingBreakdown.discountRate)).toFixed(2)}</span>
                            </div>
                        )}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', marginTop: '6px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                            <span>Total</span>
                            <span>€{totalPrice}</span>
                        </div>
                    </div>
                ) : (
                <div className="p-4 bg-muted rounded-lg flex justify-between">
                    <span className="font-medium">Total to pay:</span>
                    <span className="font-bold text-primary">€{totalPrice}</span>
                </div>
                )}

                {totalPrice > 0 ? (
                    <div style={{
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        background: 'rgba(255,255,255,0.04)',
                    }}>
                        <CardElement options={CARD_ELEMENT_OPTIONS} />
                    </div>
                ) : (
                    <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-white/60">No payment required — free tickets applied!</p>
                    </div>
                )}

                <p className="text-xs text-white/40 italic">
                    {totalPrice > 0
                        ? "Stripe test mode — use card 4242 4242 4242 4242, any future date, any CVC."
                        : "Your subscription covers these tickets."}
                </p>

                {error && (
                    <div className="p-3 bg-red-900/30 border border-red-500/30 rounded text-sm text-red-300">
                        {error}
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="w-1/3" onClick={onBack} disabled={processing}>Back</Button>
                    <Button className="flex-1" onClick={handlePay} disabled={processing || (!stripe && totalPrice > 0)}>
                        {processing ? "Processing…" : totalPrice > 0 ? "Pay & Finish" : "Confirm Booking"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
