/**
 * Payments API calls.
 * Endpoints for Stripe PaymentIntent (bookings) and Checkout Sessions (subscriptions).
 */

const API_URL = import.meta.env.VITE_API_URL || "";

/** Fetch the Stripe publishable key from the backend. */
export async function getStripeConfig() {
    const res = await fetch(`${API_URL}/api/payments/config/`);
    return res.json();
}

/**
 * Create a PaymentIntent for a ticket booking.
 * Returns { client_secret, payment_intent_id, amount, currency, free_booking }.
 */
export async function createBookingIntent(data, accessToken) {
    const headers = { "Content-Type": "application/json" };
    if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
    }
    const res = await fetch(`${API_URL}/api/payments/create-booking-intent/`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
        throw new Error(result.error || result.detail || "Failed to create payment intent");
    }
    return result;
}

/**
 * Create a Stripe Checkout Session for a subscription tier purchase.
 * Returns { checkout_url, session_id }.
 */
export async function createSubscriptionCheckout(data, accessToken) {
    const res = await fetch(`${API_URL}/api/payments/create-subscription-checkout/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
        throw new Error(result.error || result.detail || "Failed to create checkout session");
    }
    return result;
}
