/**
 * PaymentForm – Step 3 of the booking flow.
 * Collects card number, expiry, and CVV. Shows the total to pay.
 */

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function PaymentForm({ formData, onChange, totalPrice, onBack, onSubmit }) {
    return (
        <Card className="max-w-md mx-auto">
            <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg flex justify-between">
                    <span className="font-medium">Total to pay:</span>
                    <span className="font-bold text-primary">${totalPrice}</span>
                </div>
                <Input placeholder="Card Number" value={formData.cardNumber} onChange={(e) => onChange({ ...formData, cardNumber: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="MM/YY" value={formData.expiry} onChange={(e) => onChange({ ...formData, expiry: e.target.value })} />
                    <Input placeholder="CVV" value={formData.cvv} onChange={(e) => onChange({ ...formData, cvv: e.target.value })} />
                </div>
                <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="w-1/3" onClick={onBack}>Back</Button>
                    <Button className="flex-1" onClick={onSubmit}>Pay & Finish</Button>
                </div>
            </CardContent>
        </Card>
    )
}
