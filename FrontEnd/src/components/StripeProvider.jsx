/**
 * StripeProvider – fetches the publishable key from the backend
 * and wraps children with Stripe Elements context.
 * Exposes stripe readiness via StripeStatusContext.
 */

import { useState, useEffect, createContext, useContext } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { getStripeConfig } from "@/api/payments"

let stripePromiseCache = null

const StripeStatusContext = createContext({ ready: false, loading: true, error: null })
// eslint-disable-next-line react-refresh/only-export-components
export const useStripeStatus = () => useContext(StripeStatusContext)

export default function StripeProvider({ children }) {
    const [stripePromise, setStripePromise] = useState(stripePromiseCache)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(!stripePromiseCache)

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (stripePromiseCache) { setLoading(false); return }
        getStripeConfig()
            .then(({ publishable_key }) => {
                if (publishable_key) {
                    stripePromiseCache = loadStripe(publishable_key)
                    setStripePromise(stripePromiseCache)
                } else {
                    setError("Stripe is not configured on the server.")
                }
            })
            .catch(() => {
                setError("Could not connect to payment server.")
            })
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <StripeStatusContext.Provider value={{ ready: false, loading: true, error: null }}>
                <div className="max-w-md mx-auto p-8 text-center">
                    <div className="animate-pulse text-white/50 text-sm">Loading payment system…</div>
                </div>
            </StripeStatusContext.Provider>
        )
    }

    if (error || !stripePromise) {
        return (
            <StripeStatusContext.Provider value={{ ready: false, loading: false, error: error || "Stripe unavailable" }}>
                {children}
            </StripeStatusContext.Provider>
        )
    }

    return (
        <StripeStatusContext.Provider value={{ ready: true, loading: false, error: null }}>
            <Elements stripe={stripePromise} options={{
                appearance: {
                    theme: 'night',
                    variables: {
                        colorPrimary: '#ffffff',
                        colorBackground: '#0d0d0f',
                        colorText: '#ffffff',
                        colorDanger: '#ef4444',
                        fontFamily: 'Cascadia Code, monospace',
                        borderRadius: '8px',
                    },
                },
            }}>
                {children}
            </Elements>
        </StripeStatusContext.Provider>
    )
}
