const BASE = `${import.meta.env.VITE_API_URL || ""}/api`

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
