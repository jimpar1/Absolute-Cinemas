/**
 * StripeProvider – fetches the publishable key from the backend
 * and wraps children with Stripe Elements context.
 */

import { useState, useEffect } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { getStripeConfig } from "@/api/payments"

let stripePromiseCache = null

export default function StripeProvider({ children }) {
    const [stripePromise, setStripePromise] = useState(stripePromiseCache)

    useEffect(() => {
        if (stripePromiseCache) return
        getStripeConfig()
            .then(({ publishable_key }) => {
                if (publishable_key) {
                    stripePromiseCache = loadStripe(publishable_key)
                    setStripePromise(stripePromiseCache)
                }
            })
            .catch(err => console.error("Failed to load Stripe config:", err))
    }, [])

    if (!stripePromise) return children

    return (
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
    )
}
