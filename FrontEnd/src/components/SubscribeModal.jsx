/**
 * SubscribeModal – payment sequence for switching CinemaPass tiers.
 *
 * Paid tiers: redirects to Stripe Checkout for real (test-mode) payment.
 * Free tier: direct downgrade via backend API (no payment).
 */

import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createSubscriptionCheckout } from '@/api/payments'
import { useAuth } from '@/context/AuthContext'

const TIER_COLOR = {
    pro:   { solid: '#60a5fa', faint: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)' },
    ultra: { solid: '#c084fc', faint: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.35)' },
    free:  { solid: 'rgba(255,255,255,0.6)', faint: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.15)' },
}

export default function SubscribeModal({ tier, isAnnual, open, onClose, onConfirm }) {
    const { accessToken } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const tierKey   = tier?.name?.toLowerCase() ?? 'free'
    const isPaid    = tier?.priceMonthly != null
    const price     = isPaid ? (isAnnual ? tier.priceAnnual : tier.priceMonthly) : 0
    const period    = isAnnual ? 'year' : 'month'
    const colors    = TIER_COLOR[tierKey] ?? TIER_COLOR.free

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (open) { setLoading(false); setError(null) }
    }, [open])

    const handleSubscribe = async () => {
        setLoading(true)
        setError(null)
        try {
            const result = await createSubscriptionCheckout({
                tier: tierKey,
                billing_period: isAnnual ? 'annual' : 'monthly',
                frontend_url: window.location.origin,
            }, accessToken)
            window.location.href = result.checkout_url
        } catch (err) {
            setError(err.message || "Failed to start checkout.")
            setLoading(false)
        }
    }

    const handleDowngrade = async () => {
        setLoading(true)
        try {
            await onConfirm(tierKey)
            setTimeout(onClose, 500)
        } catch {
            setLoading(false)
        }
    }

    if (!tier) return null

    return (
        <Dialog open={open} onOpenChange={loading ? undefined : onClose}>
            <DialogContent
                className="max-w-sm p-0 overflow-hidden"
                style={{ background: '#0d0d0f', border: `1px solid ${colors.border}` }}
            >
                {/* ── Header band ── */}
                <div style={{
                    padding: '1.4rem 1.6rem 1rem',
                    borderBottom: `1px solid ${colors.border}`,
                    background: colors.faint,
                }}>
                    <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: colors.solid, marginBottom: '0.3rem' }}>
                        {tier.badge}
                    </p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                        {tier.name} Plan
                    </p>
                    <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.2rem' }}>
                        {isPaid ? `€${price} / ${period}` : 'Free forever'}
                    </p>
                </div>

                {/* ── Content ── */}
                <div style={{ padding: '1.4rem 1.6rem 1.6rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {isPaid ? (
                        <>
                            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                                You'll be redirected to Stripe to complete payment securely.
                                This is test mode — use card <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)' }}>4242 4242 4242 4242</span>.
                            </p>

                            {error && (
                                <div style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.82rem', color: '#fca5a5' }}>
                                    {error}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.6rem' }}>
                                <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
                                <button
                                    onClick={handleSubscribe}
                                    disabled={loading}
                                    style={{
                                        flex: 2, padding: '0.6rem 1rem', borderRadius: '8px',
                                        background: loading ? 'rgba(255,255,255,0.2)' : colors.solid,
                                        border: 'none',
                                        color: '#050505', fontWeight: 700, fontSize: '0.78rem',
                                        letterSpacing: '0.06em', textTransform: 'uppercase',
                                        cursor: loading ? 'wait' : 'pointer',
                                        opacity: loading ? 0.6 : 1,
                                    }}
                                >
                                    {loading ? 'Redirecting…' : `Subscribe — €${price}/${isAnnual ? 'yr' : 'mo'}`}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                                You'll lose your free weekly tickets and discounts at the end of the current billing period.
                            </p>
                            <div style={{ display: 'flex', gap: '0.6rem' }}>
                                <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Keep current plan</Button>
                                <Button variant="ghost" className="flex-1" onClick={handleDowngrade} disabled={loading}>
                                    {loading ? 'Updating…' : 'Downgrade'}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
