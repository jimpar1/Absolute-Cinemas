/**
 * SubscriptionCancel – landing page when user cancels Stripe Checkout for a subscription.
 */

import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SubscriptionCancel() {
    const navigate = useNavigate()

    return (
        <div className="w-full max-w-lg mx-auto px-4 py-20">
            <Card>
                <CardContent className="pt-8 pb-8 text-center space-y-6">
                    <div className="text-5xl">🚫</div>
                    <h1 className="text-2xl font-bold">Checkout Cancelled</h1>
                    <p className="text-muted-foreground">
                        Your subscription was not changed. You can try again anytime from the CinemaPass section.
                    </p>
                    <div className="flex gap-3 justify-center pt-2">
                        <Button variant="outline" onClick={() => navigate("/")}>
                            Back to Home
                        </Button>
                        <Button onClick={() => navigate("/profile")}>
                            View Profile
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
