const BASE = 'http://127.0.0.1:8000/api'

export async function getSubscription(token) {
    const res = await fetch(`${BASE}/me/subscription/`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    return res.json()
}

export async function subscribeTier(token, tier) {
    const res = await fetch(`${BASE}/me/subscription/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tier })
    })
    return res.json()
}
