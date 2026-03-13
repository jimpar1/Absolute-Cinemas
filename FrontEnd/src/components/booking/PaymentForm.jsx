/**
 * PaymentForm – Step 3 of the booking flow.
 * Shows a pre-filled test card (4242 4242 4242 4242) and processes
 * payments through Stripe test mode. Card is read-only — no user input needed.
 * Falls back to a free-only form when Stripe is unavailable.
 */

import { useState } from "react"
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createBookingIntent } from "@/api/payments"
import { useAuth } from "@/context/AuthContext"
import { useStripeStatus } from "@/components/StripeProvider"

function PricingDisplay({ pricingBreakdown, totalPrice }) {
    if (pricingBreakdown) {
        return (
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
        )
    }
    return (
        <div className="p-4 bg-muted rounded-lg flex justify-between">
            <span className="font-medium">Total to pay:</span>
            <span className="font-bold text-primary">€{totalPrice}</span>
        </div>
    )
}

function SuccessDisplay({ totalPrice }) {
    return (
        <Card className="max-w-md mx-auto">
            <CardContent className="pt-8 pb-8">
                <div style={{ fontFamily: "monospace" }} className="space-y-5">
                    <div className="flex items-center gap-3 text-white text-lg font-bold tracking-wide">
                        <span>✅</span>
                        <span>{totalPrice === 0 ? "BOOKING CONFIRMED" : "PAYMENT CONFIRMED"}</span>
                    </div>
                    <div className="border border-white/20 rounded p-3 space-y-1 text-sm">
                        <div className="text-white font-bold tracking-widest">Amount: €{totalPrice}</div>
                        <div className="text-white/50">
                            {totalPrice === 0 ? "Free tickets applied — no charge." : "Payment processed via Stripe (test mode)."}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

/** Realistic Stripe Card input field */
function StripeCardInput() {
    return (
        <div style={{
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '8px',
            padding: '14px 16px',
            background: 'rgba(255,255,255,0.04)',
        }}>
            <CardElement
                options={{
                    style: {
                        base: {
                            fontSize: '16px',
                            color: '#ffffff',
                            fontFamily: 'Syne, sans-serif',
                            '::placeholder': {
                                color: 'rgba(255, 255, 255, 0.3)',
                            },
                        },
                        invalid: {
                            color: '#ef4444',
                        },
                    },
                }}
            />
        </div>
    )
}

/**
 * StripeCardForm – uses actual Stripe CardElement for realistic user input.
 */
function StripeCardForm({ formData, totalPrice, pricingBreakdown, onBack, onSubmit, screeningId, selectedSeats, sessionId }) {
    const stripe = useStripe()
    const elements = useElements()
    const { accessToken } = useAuth()

    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState(null)
    const [paymentSuccess, setPaymentSuccess] = useState(false)

    const handlePay = async () => {
        if (!stripe || !elements) {
            setError("Stripe hasn't loaded yet. Please try again.")
            return
        }

        setProcessing(true)
        setError(null)

        try {
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

            if (result.free_booking) {
                setPaymentSuccess(true)
                setTimeout(() => onSubmit(), 1000)
                return
            }

            const cardElement = elements.getElement(CardElement)
            if (!cardElement) {
                throw new Error("Could not find payment element")
            }

            // Use the data from the CardElement instead of hardcoded pm_card_visa
            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
                result.client_secret,
                { payment_method: { card: cardElement } }
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

    if (paymentSuccess) return <SuccessDisplay totalPrice={totalPrice} />

    return (
        <Card className="max-w-md mx-auto">
            <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <PricingDisplay pricingBreakdown={pricingBreakdown} totalPrice={totalPrice} />

                {totalPrice > 0 ? (
                    <StripeCardInput />
                ) : (
                    <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-white/60">No payment required — free tickets applied!</p>
                    </div>
                )}

                <p className="text-xs text-white/40 italic">
                    {totalPrice > 0
                        ? "Enter your card details above to complete your booking."
                        : "Your subscription covers these tickets."}
                </p>

                {error && (
                    <div className="p-3 bg-red-900/30 border border-red-500/30 rounded text-sm text-red-300">{error}</div>
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

/**
 * FallbackForm – shown when Stripe is not available.
 * Allows free bookings; blocks paid ones with an explanation.
 */
function FallbackForm({ formData, totalPrice, pricingBreakdown, onBack, onSubmit, screeningId, selectedSeats, sessionId, stripeError }) {
    const { accessToken } = useAuth()
    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState(null)
    const [paymentSuccess, setPaymentSuccess] = useState(false)

    const handleFreePay = async () => {
        setProcessing(true)
        setError(null)
        try {
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
            if (result.free_booking) {
                setPaymentSuccess(true)
                setTimeout(() => onSubmit(), 1000)
            } else {
                setError("Card payments require Stripe to be configured on the server.")
                setProcessing(false)
            }
        } catch (err) {
            setError(err.message || "Booking failed. Please try again.")
            setProcessing(false)
        }
    }

    if (paymentSuccess) return <SuccessDisplay totalPrice={0} />

    return (
        <Card className="max-w-md mx-auto">
            <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <PricingDisplay pricingBreakdown={pricingBreakdown} totalPrice={totalPrice} />

                <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-900/15 text-sm text-yellow-200 space-y-1">
                    <p className="font-semibold">⚠️ Card payments unavailable</p>
                    <p className="text-yellow-200/60 text-xs">{stripeError || "Stripe is not configured."}</p>
                    {totalPrice === 0 && (
                        <p className="text-yellow-200/60 text-xs">Your tickets are free — you can still proceed!</p>
                    )}
                </div>

                {error && (
                    <div className="p-3 bg-red-900/30 border border-red-500/30 rounded text-sm text-red-300">{error}</div>
                )}

                <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="w-1/3" onClick={onBack} disabled={processing}>Back</Button>
                    <Button className="flex-1" onClick={totalPrice === 0 ? handleFreePay : undefined} disabled={processing || totalPrice > 0}>
                        {processing ? "Processing…" : totalPrice > 0 ? "Payments Unavailable" : "Confirm Free Booking"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * PaymentForm – checks StripeStatus context and delegates to either
 * the Stripe-powered form or the fallback form.
 */
export default function PaymentForm(props) {
    const { ready, error } = useStripeStatus()

    if (ready) return <StripeCardForm {...props} />
    return <FallbackForm {...props} stripeError={error} />
}
