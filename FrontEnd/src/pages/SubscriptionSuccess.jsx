/**
 * SubscriptionSuccess – landing page after a successful Stripe Checkout for a subscription.
 * Calls the backend to confirm the session and activate the subscription.
 */

import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { confirmSubscription } from "@/api/payments"

export default function SubscriptionSuccess() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { refreshSubscription, accessToken } = useAuth()
    const [status, setStatus] = useState("confirming") // confirming | success | error
    const [error, setError] = useState(null)

    const sessionId = searchParams.get("session_id")

    useEffect(() => {
        if (!sessionId || !accessToken || status !== "confirming") return

        confirmSubscription(sessionId, accessToken)
            .then(() => {
                setStatus("success")
                if (refreshSubscription) refreshSubscription()
            })
            .catch(err => {
                console.error("Subscription confirm failed:", err)
                setError(err.message)
                setStatus("error")
            })
    }, [sessionId, accessToken, status, refreshSubscription])

    return (
        <div className="w-full max-w-lg mx-auto px-4 py-20">
            <Card>
                <CardContent className="pt-8 pb-8 text-center space-y-6">
                    {status === "confirming" && (
                        <>
                            <div className="text-5xl">⏳</div>
                            <h1 className="text-2xl font-bold">Activating Subscription...</h1>
                            <p className="text-muted-foreground">Confirming your payment with Stripe.</p>
                        </>
                    )}
                    {status === "success" && (
                        <>
                            <div className="text-5xl">🎉</div>
                            <h1 className="text-2xl font-bold">Subscription Activated!</h1>
                            <p className="text-muted-foreground">
                                Your CinemaPass has been upgraded. Enjoy your free weekly tickets and discounts!
                            </p>
                        </>
                    )}
                    {status === "error" && (
                        <>
                            <div className="text-5xl">⚠️</div>
                            <h1 className="text-2xl font-bold">Something went wrong</h1>
                            <p className="text-muted-foreground">
                                {error || "Could not activate your subscription. Please contact support."}
                            </p>
                        </>
                    )}
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
