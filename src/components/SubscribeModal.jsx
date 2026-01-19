/**
 * SubscribeModal – payment sequence for switching CinemaPass tiers.
 *
 * Steps:
 *   1. Plan summary + auto-filled fake card form
 *   2. Terminal processing animation
 *   3. Auto-close on success
 */

import { useEffect, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const TIER_COLOR = {
    pro:   { solid: '#60a5fa', faint: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)' },
    ultra: { solid: '#c084fc', faint: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.35)' },
    free:  { solid: 'rgba(255,255,255,0.6)', faint: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.15)' },
}

function rand4() { return String(Math.floor(1000 + Math.random() * 9000)) }
function fakeCard() {
    const num = `4${rand4().slice(1)} ${rand4()} ${rand4()} ${rand4()}`
    const yr  = String(new Date().getFullYear() + 2 + Math.floor(Math.random() * 3)).slice(2)
    const mo  = String(Math.floor(1 + Math.random() * 12)).padStart(2, '0')
    const cvv = String(Math.floor(100 + Math.random() * 900))
    return { num, expiry: `${mo}/${yr}`, cvv }
}

export default function SubscribeModal({ tier, isAnnual, open, onClose, onConfirm }) {
    const [step, setStep]         = useState('form')   // 'form' | 'processing' | 'done'
    const [stepsDone, setStepsDone] = useState(0)
    const [card, setCard]         = useState({ num: '', expiry: '', cvv: '' })

    const tierKey   = tier?.name?.toLowerCase() ?? 'free'
    const isPaid    = tier?.priceMonthly != null
    const price     = isPaid ? (isAnnual ? tier.priceAnnual : tier.priceMonthly) : 0
    const period    = isAnnual ? 'year' : 'month'
    const colors    = TIER_COLOR[tierKey] ?? TIER_COLOR.free

    const STEPS = [
        'Contacting Bank of Real Money™',
        'Card verified (we totally checked)',
        `Charging €${price} + €0 hidden fees`,
        "Approval from your bank's intern",
    ]

    // Auto-fill card on open
    useEffect(() => {
        if (open) { setStep('form'); setStepsDone(0); setCard(fakeCard()) }
    }, [open])

    const handlePay = () => {
        setStep('processing')
        const delays = [700, 1400, 2100, 2800]
        delays.forEach((ms, i) => setTimeout(() => setStepsDone(i + 1), ms))
        setTimeout(async () => {
            setStep('done')
            await onConfirm(tierKey)
            setTimeout(onClose, 900)
        }, 3400)
    }

    if (!tier) return null

    return (
        <Dialog open={open} onOpenChange={step === 'form' ? onClose : undefined}>
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

                {/* ── Form step ── */}
                {step === 'form' && (
                    <div style={{ padding: '1.4rem 1.6rem 1.6rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {isPaid ? (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    <Input
                                        value={card.num}
                                        onChange={e => setCard(c => ({ ...c, num: e.target.value }))}
                                        placeholder="Card Number"
                                        style={{ fontFamily: 'monospace', fontSize: '0.85rem', background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.border}` }}
                                    />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                                        <Input
                                            value={card.expiry}
                                            onChange={e => setCard(c => ({ ...c, expiry: e.target.value }))}
                                            placeholder="MM/YY"
                                            style={{ fontFamily: 'monospace', fontSize: '0.85rem', background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.border}` }}
                                        />
                                        <Input
                                            value={card.cvv}
                                            onChange={e => setCard(c => ({ ...c, cvv: e.target.value }))}
                                            placeholder="CVV"
                                            style={{ fontFamily: 'monospace', fontSize: '0.85rem', background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.border}` }}
                                        />
                                    </div>
                                    <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.28)', fontStyle: 'italic' }}>
                                        We filled these in. It's not real anyway.
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.6rem' }}>
                                    <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                                    <button
                                        onClick={handlePay}
                                        style={{
                                            flex: 2, padding: '0.6rem 1rem', borderRadius: '8px',
                                            background: colors.solid, border: 'none',
                                            color: '#050505', fontWeight: 700, fontSize: '0.78rem',
                                            letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
                                        }}
                                    >
                                        Subscribe — €{price}/{isAnnual ? 'yr' : 'mo'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            /* Downgrade to free — no card needed */
                            <>
                                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                                    You'll lose your free weekly tickets and discounts at the end of the current billing period.
                                </p>
                                <div style={{ display: 'flex', gap: '0.6rem' }}>
                                    <Button variant="outline" className="flex-1" onClick={onClose}>Keep current plan</Button>
                                    <Button variant="ghost" className="flex-1" onClick={handlePay}>Downgrade</Button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ── Processing terminal ── */}
                {(step === 'processing' || step === 'done') && (
                    <div style={{ padding: '1.4rem 1.6rem 1.6rem', fontFamily: 'monospace' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem' }}>
                            <span>💳</span>
                            <span>{isPaid ? 'PROCESSING PAYMENT' : 'UPDATING PLAN'}</span>
                        </div>
                        <div style={{ border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', background: colors.faint }}>
                            {STEPS.map((label, i) => {
                                const visible = stepsDone >= i
                                const done    = stepsDone > i
                                return (
                                    <div
                                        key={i}
                                        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease', display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)' }}
                                    >
                                        <span style={{ width: '1rem', textAlign: 'center', color: done ? colors.solid : 'rgba(255,255,255,0.3)' }}>
                                            {done ? '✓' : '⏳'}
                                        </span>
                                        <span style={{ color: done ? colors.solid : 'rgba(255,255,255,0.6)' }}>{label}</span>
                                    </div>
                                )
                            })}
                        </div>
                        {step === 'done' && (
                            <div style={{
                                opacity: 1,
                                transition: 'opacity 0.5s ease',
                                border: `1px solid ${colors.border}`,
                                borderRadius: '8px',
                                padding: '0.75rem 1rem',
                                marginTop: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.25rem',
                                fontSize: '0.8rem',
                            }}>
                                <div style={{ color: '#fff', fontWeight: 700, letterSpacing: '0.1em', fontFamily: 'monospace' }}>
                                    Approval code: CINEMA-4242
                                </div>
                                <div style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>
                                    You were not charged anything.
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
