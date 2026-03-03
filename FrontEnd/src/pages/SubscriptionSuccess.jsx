/**
 * SubscriptionSuccess – landing page after a successful Stripe Checkout for a subscription.
 * Reads the session_id from URL params and confirms the tier activation.
 */

import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"

export default function SubscriptionSuccess() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { refreshSubscription } = useAuth()
    const [refreshed, setRefreshed] = useState(false)

    const sessionId = searchParams.get("session_id")

    useEffect(() => {
        if (!refreshed && refreshSubscription) {
            refreshSubscription()
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setRefreshed(true)
        }
    }, [refreshed, refreshSubscription])

    return (
        <div className="w-full max-w-lg mx-auto px-4 py-20">
            <Card>
                <CardContent className="pt-8 pb-8 text-center space-y-6">
                    <div className="text-5xl">🎉</div>
                    <h1 className="text-2xl font-bold">Subscription Activated!</h1>
                    <p className="text-muted-foreground">
                        Your CinemaPass has been upgraded. Enjoy your free weekly tickets and discounts!
                    </p>
                    {sessionId && (
                        <p className="text-xs text-white/30 font-mono">
                            Session: {sessionId.slice(0, 20)}…
                        </p>
                    )}
                    <div className="flex gap-3 justify-center pt-2">
                        <Button variant="outline" onClick={() => navigate("/profile")}>
                            View Profile
                        </Button>
                        <Button onClick={() => navigate("/movies")}>
                            Browse Movies
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
