/**
 * ContactForm – Step 2 of the booking flow.
 * Collects the customer's name, email, and phone number.
 */

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ContactForm({ formData, onChange, onBack, onNext }) {
    return (
        <Card className="max-w-md mx-auto">
            <CardHeader><CardTitle>Contact Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input name="name" value={formData.name} onChange={(e) => onChange({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label>Email</Label>
                    <Input name="email" type="email" value={formData.email} onChange={(e) => onChange({ ...formData, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input name="phone" type="tel" value={formData.phone} onChange={(e) => onChange({ ...formData, phone: e.target.value })} placeholder="6912345678" />
                </div>
                <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="w-1/3" onClick={onBack}>Back</Button>
                    <Button className="flex-1" disabled={!formData.name || !formData.email || !formData.phone} onClick={onNext}>Next</Button>
                </div>
            </CardContent>
        </Card>
    )
}
