/**
 * PaymentForm – Step 3 of the booking flow.
 * Auto-fills a fake card, then runs a theatrical terminal animation before confirming.
 */

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const STEPS = [
    "Contacting Bank of Real Money™",
    "Card verified (we totally checked)",
    `Charging your imagination`,
    "Approval from your bank's intern",
]

export default function PaymentForm({ formData, onChange, totalPrice, pricingBreakdown, onBack, onSubmit }) {
    const [processing, setProcessing] = useState(false)
    const [stepsDone, setStepsDone] = useState(0)

    useEffect(() => {
        const rand4 = () => String(Math.floor(1000 + Math.random() * 9000))
        const cardNumber = `4${rand4().slice(1)} ${rand4()} ${rand4()} ${rand4()}`
        const expYear = new Date().getFullYear() + 2 + Math.floor(Math.random() * 3)
        const expMonth = String(Math.floor(1 + Math.random() * 12)).padStart(2, "0")
        const cvv = String(Math.floor(100 + Math.random() * 900))
        onChange(prev => ({ ...prev, cardNumber, expiry: `${expMonth}/${String(expYear).slice(2)}`, cvv }))
    }, [])

    const handlePay = () => {
        setProcessing(true)
        const delays = [700, 1400, 2100, 2800]
        delays.forEach((ms, i) => setTimeout(() => setStepsDone(i + 1), ms))
        setTimeout(() => onSubmit(), 3500)
    }

    if (processing) {
        return (
            <Card className="max-w-md mx-auto">
                <CardContent className="pt-8 pb-8">
                    <div style={{ fontFamily: "monospace" }} className="space-y-5">
                        <div className="flex items-center gap-3 text-white text-lg font-bold tracking-wide">
                            <span>💳</span>
                            <span>PROCESSING PAYMENT</span>
                        </div>

                        <div className="border border-white/10 rounded p-4 space-y-3">
                            {STEPS.map((label, i) => {
                                const visible = stepsDone >= i
                                const done = stepsDone > i
                                const text = i === 2
                                    ? `Charging €${totalPrice} + €0 hidden fees`
                                    : label
                                return (
                                    <div
                                        key={i}
                                        style={{
                                            opacity: visible ? 1 : 0,
                                            transition: "opacity 0.4s ease",
                                        }}
                                        className="flex items-center gap-3 text-sm text-white/80"
                                    >
                                        <span className="w-4 text-center">{done ? "✓" : "⏳"}</span>
                                        <span>{text}</span>
                                    </div>
                                )
                            })}
                        </div>

                        <div
                            style={{
                                opacity: stepsDone >= 4 ? 1 : 0,
                                transition: "opacity 0.5s ease",
                            }}
                            className="border border-white/20 rounded p-3 space-y-1 text-sm"
                        >
                            <div className="text-white font-bold tracking-widest">
                                Approval code: CINEMA-4242
                            </div>
                            <div className="text-white/50">
                                You were not charged anything.
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
                <Input
                    placeholder="Card Number"
                    value={formData.cardNumber}
                    onChange={(e) => onChange(prev => ({ ...prev, cardNumber: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        placeholder="MM/YY"
                        value={formData.expiry}
                        onChange={(e) => onChange(prev => ({ ...prev, expiry: e.target.value }))}
                    />
                    <Input
                        placeholder="CVV"
                        value={formData.cvv}
                        onChange={(e) => onChange(prev => ({ ...prev, cvv: e.target.value }))}
                    />
                </div>
                <p className="text-xs text-white/40 italic">
                    We filled these in. It's not real anyway.
                </p>
                <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="w-1/3" onClick={onBack}>Back</Button>
                    <Button className="flex-1" onClick={handlePay}>Pay & Finish</Button>
                </div>
            </CardContent>
        </Card>
    )
}
