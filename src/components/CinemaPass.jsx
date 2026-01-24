/**
 * CinemaPass — subscription pricing cards section.
 * Self-contained: owns its own state, refs, and GSAP animations.
 * Used on both the Home page and the Movies page.
 */

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAuth } from '@/context/AuthContext'
import styles from './CinemaPass.module.css'

gsap.registerPlugin(ScrollTrigger)

const PASS_TIERS = [
    {
        name: 'Free',
        badge: 'THE STUDENT CLASSIC',
        priceMonthly: null,
        priceAnnual: null,
        noteMonthly: "it's free. what did you expect?",
        noteAnnual: "still free. it's a school project.",
        features: [
            <><strong>0 free tickets</strong>, <strong>0% off</strong>, but hey, it's <strong>free</strong></>,
            <>Watch <strong>fictional movies</strong> at a cinema that doesn't exist</>,
            <>Reserve <strong>fake seats</strong>, in halls we made up</>,
        ],
        cta: "You're Already In, Congrats",
    },
    {
        name: 'Pro',
        badge: 'MOST POPULAR, WE THINK',
        priceMonthly: 9,
        priceAnnual: 79,
        noteMonthly: '/month',
        noteAnnual: '/year · save €29',
        features: [
            <><strong>2 free tickets</strong> per week, <strong>no catches</strong></>,
            <><strong>30% off</strong> all remaining seats</>,
            <>Our dev gets a coffee, you get <strong>discounts</strong></>,
        ],
        cta: 'Support a Struggling Student Dev',
        highlight: true,
    },
    {
        name: 'Ultra',
        badge: 'FOR THE UNHINGED',
        priceMonthly: 29,
        priceAnnual: 249,
        noteMonthly: '/month',
        noteAnnual: '/year · save €99',
        features: [
            <><strong>4 free tickets</strong> per week, you <strong>live here</strong> now</>,
            <><strong>50% off</strong> all paid seats</>,
            <>Your name in the credits, <strong>not really</strong>, but spiritually</>,
        ],
        cta: 'I Have Money to Burn',
    },
]

export default function CinemaPass() {
    const [isAnnual, setIsAnnual] = useState(false)
    const [activatingTier, setActivatingTier] = useState(null)

    const { isAuthenticated, subscription, subscribeTier } = useAuth()
    const navigate = useNavigate()

    const sectionRef   = useRef(null)
    const tierRefs     = useRef([])
    const priceNumRefs = useRef([])

    // ─── Card reveal + feature slide-in ──────────────────────────
    useEffect(() => {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (prefersReduced || !sectionRef.current) return

        const ctx = gsap.context(() => {
            const cards = tierRefs.current.filter(Boolean)
            if (!cards.length) return

            const trigger = {
                trigger: sectionRef.current,
                start: 'top 80%',
                toggleActions: 'play none none reset',
            }

            gsap.fromTo(cards,
                { clipPath: 'inset(100% 0 0 0 round 12px)', opacity: 0 },
                { clipPath: 'inset(0% 0 0 0 round 12px)', opacity: 1, duration: 0.85, stagger: 0.18, ease: 'power3.out', scrollTrigger: trigger }
            )

            cards.forEach((card, i) => {
                const items = card.querySelectorAll('li')
                if (!items.length) return
                gsap.from(items, {
                    x: -24, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out',
                    scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none reset' },
                    delay: i * 0.18,
                })
            })
        })

        return () => ctx.revert()
    }, [])

    // ─── Billing toggle ───────────────────────────────────────────
    const handleBillingToggle = (annual) => {
        setIsAnnual(annual)
        priceNumRefs.current.forEach(el => {
            if (!el) return
            gsap.fromTo(el,
                { scale: 0.7, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.38, ease: 'back.out(1.7)' }
            )
        })
    }

    // ─── 3-D hover tilt on cards ─────────────────────────────────
    const handleMouseMove = (e, el) => {
        if (!el) return
        const rect = el.getBoundingClientRect()
        const rx = ((e.clientY - rect.top  - rect.height / 2) / (rect.height / 2)) * -6
        const ry = ((e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2)) *  6
        gsap.to(el, { rotateX: rx, rotateY: ry, duration: 0.35, ease: 'power2.out', overwrite: 'auto' })
    }

    const handleMouseLeave = (el) => {
        if (!el) return
        gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' })
    }

    return (
        <section ref={sectionRef} className={styles.section}>
            <div className={styles.inner}>
                <p className={styles.label}>The Cinema Pass™</p>
                <h2 className={styles.title}>
                    A subscription for a cinema that doesn't technically exist.
                </h2>

                <div className={styles.billingToggle}>
                    <button
                        className={`${styles.billingBtn} ${!isAnnual ? styles.billingBtnActive : ''}`}
                        onClick={() => handleBillingToggle(false)}
                    >Monthly</button>
                    <button
                        className={`${styles.billingBtn} ${isAnnual ? styles.billingBtnActive : ''}`}
                        onClick={() => handleBillingToggle(true)}
                    >
                        Annually
                        <span className={styles.billingBadge}>save ~30%</span>
                    </button>
                </div>

                <div className={styles.tiers}>
                    {PASS_TIERS.map((tier, i) => {
                        const tierKey  = tier.name.toLowerCase()
                        const isPro    = tierKey === 'pro'
                        const isUltra  = tierKey === 'ultra'
                        const isCurrent    = subscription?.tier === tierKey
                        const isActivating = activatingTier === tierKey

                        const cardClass = [
                            styles.card,
                            isPro   ? styles.cardPro   : '',
                            isUltra ? styles.cardUltra : '',
                        ].join(' ')

                        const badgeClass = [
                            styles.tierBadge,
                            isPro   ? styles.tierBadgePro   : '',
                            isUltra ? styles.tierBadgeUltra : '',
                        ].join(' ')

                        const glowClass = [
                            styles.glow,
                            isPro   ? styles.glowPro   : '',
                            isUltra ? styles.glowUltra : '',
                        ].join(' ')

                        const shimmerClass = [
                            styles.shimmer,
                            isPro   ? styles.shimmerPro   : '',
                            isUltra ? styles.shimmerUltra : '',
                        ].join(' ')

                        let btn
                        if (!isAuthenticated) {
                            const btnClass = [styles.btn, isPro ? styles.btnPro : '', isUltra ? styles.btnUltra : ''].join(' ')
                            btn = <button className={btnClass} onClick={() => navigate('/auth')}>Sign In to Subscribe</button>
                        } else if (isCurrent) {
                            const labelClass = [
                                styles.currentPlanLabel,
                                isPro   ? styles.currentPlanLabelPro   :
                                isUltra ? styles.currentPlanLabelUltra : styles.currentPlanLabelFree,
                            ].join(' ')
                            btn = (
                                <>
                                    <span className={labelClass}>Your Plan</span>
                                    <button className={styles.btn} disabled style={{ opacity: 0.4, cursor: 'default' }}>
                                        Active
                                    </button>
                                </>
                            )
                        } else {
                            const btnClass = [styles.btn, isPro ? styles.btnPro : '', isUltra ? styles.btnUltra : ''].join(' ')
                            btn = (
                                <button
                                    className={btnClass}
                                    disabled={isActivating}
                                    onClick={async () => {
                                        setActivatingTier(tierKey)
                                        try { await subscribeTier(tierKey) } catch { /* noop */ }
                                        setTimeout(() => setActivatingTier(null), 1000)
                                    }}
                                >
                                    {isActivating ? 'Activating...' : tier.cta}
                                </button>
                            )
                        }

                        return (
                            <div
                                key={i}
                                ref={el => { tierRefs.current[i] = el }}
                                className={cardClass}
                                onMouseMove={e => handleMouseMove(e, e.currentTarget)}
                                onMouseLeave={e => handleMouseLeave(e.currentTarget)}
                            >
                                <p className={badgeClass}>{tier.badge}</p>
                                <p className={styles.planName}>{tier.name}</p>
                                <div className={styles.divider} />

                                <p className={styles.price}>
                                    {tier.priceMonthly && (
                                        <span className={styles.currency}>€</span>
                                    )}
                                    <span
                                        ref={el => { priceNumRefs.current[i] = el }}
                                        className={styles.priceNum}
                                    >
                                        {tier.priceMonthly
                                            ? (isAnnual ? tier.priceAnnual : tier.priceMonthly)
                                            : 'Free'}
                                    </span>
                                    <span className={styles.priceNote}>
                                        {isAnnual ? tier.noteAnnual : tier.noteMonthly}
                                    </span>
                                </p>

                                <ul className={styles.features}>
                                    {tier.features.map((f, j) => <li key={j}>{f}</li>)}
                                </ul>

                                {btn}

                                {(isPro || isUltra) && <div className={glowClass} aria-hidden="true" />}
                                {(isPro || isUltra) && <div className={shimmerClass} aria-hidden="true" />}
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
