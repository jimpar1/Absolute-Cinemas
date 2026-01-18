/**
 * HallFrame — shows all photos of the current hall side-by-side.
 * Two absolute layers (A/B) crossfade via GSAP clip-path wipe every 15 s.
 * Broken images → gray placeholder. Variable photo count per hall.
 */

import { useEffect, useRef, useState, useCallback, forwardRef } from 'react'
import gsap from 'gsap'
import styles from './HallFrame.module.css'

const INTERVAL = 15000
const DURATION = 0.95

// ── HallLayer ─────────────────────────────────────────────────────
// Renders one hall's photos as a flex row.
// Tracks per-slot load failures and shows a gray placeholder instead.

const HallLayer = forwardRef(function HallLayer({ group }, ref) {
    const [failed, setFailed] = useState(new Set())

    // Reset failures whenever the hall changes (photos array changes)
    const photosKey = (group?.photos || []).join('|')
    useEffect(() => { setFailed(new Set()) }, [photosKey])

    if (!group) return null
    const { name, badge, seats, tech, photos } = group

    // Fallback: if hall has no photos, render a single placeholder slot
    const slots = photos.length > 0 ? photos : [null]

    const handleError = (i) => setFailed(prev => new Set([...prev, i]))

    return (
        <div ref={ref} className={styles.layer}>
            {slots.map((url, i) => {
                const isFailed = !url || failed.has(i)
                // Flex sizing: first slot is main (wider), rest share equally
                const flexVal = i === 0 ? 3 : 2

                return (
                    <div key={i} className={styles.slot} style={{ flex: flexVal }}>
                        {isFailed ? (
                            <div className={styles.placeholder}>
                                <svg className={styles.placeholderIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                </svg>
                                <span className={styles.placeholderText}>Image not found</span>
                            </div>
                        ) : (
                            <img
                                src={url}
                                alt={i === 0 ? name : ''}
                                className={styles.slotImg}
                                loading={i === 0 ? 'eager' : 'lazy'}
                                onError={() => handleError(i)}
                            />
                        )}

                        {/* Info overlay always on first slot, even over a placeholder */}
                        {i === 0 && (
                            <div className={styles.slotOverlay}>
                                <span className={styles.hallBadge}>{badge}</span>
                                <h3 className={styles.hallName}>{name}</h3>
                                <p className={styles.hallSeats}>{seats}</p>
                                <p className={styles.hallTech}>{tech}</p>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
})

// ── HallFrame ─────────────────────────────────────────────────────

export default function HallFrame({ hallGroups = [] }) {
    const [idxA, setIdxA] = useState(0)
    const [idxB, setIdxB] = useState(0)

    const layerARef     = useRef(null)
    const layerBRef     = useRef(null)
    const activeRef     = useRef('A')   // which layer is currently visible
    const hallIdxRef    = useRef(0)
    const transitioning = useRef(false)

    // Initialize: A visible, B hidden
    useEffect(() => {
        if (layerARef.current) gsap.set(layerARef.current, { clipPath: 'inset(0 0% 0 0)', opacity: 1 })
        if (layerBRef.current) gsap.set(layerBRef.current, { clipPath: 'inset(0 100% 0 0)', opacity: 1 })
    }, [])

    const crossfade = useCallback((outEl, inEl, onDone) => {
        gsap.to(outEl, { clipPath: 'inset(0 0 0 100%)', duration: DURATION, ease: 'power2.inOut' })
        gsap.fromTo(
            inEl,
            { clipPath: 'inset(0 100% 0 0)' },
            { clipPath: 'inset(0 0% 0 0)', duration: DURATION, ease: 'power2.inOut', delay: 0.08, onComplete: onDone }
        )
    }, [])

    const doTransition = useCallback(() => {
        if (transitioning.current || hallGroups.length < 2) return
        transitioning.current = true

        const next = (hallIdxRef.current + 1) % hallGroups.length

        if (activeRef.current === 'A') {
            setIdxB(next)
            requestAnimationFrame(() => requestAnimationFrame(() => {
                crossfade(layerARef.current, layerBRef.current, () => {
                    hallIdxRef.current = next
                    activeRef.current  = 'B'
                    transitioning.current = false
                })
            }))
        } else {
            setIdxA(next)
            requestAnimationFrame(() => requestAnimationFrame(() => {
                crossfade(layerBRef.current, layerARef.current, () => {
                    hallIdxRef.current = next
                    activeRef.current  = 'A'
                    transitioning.current = false
                })
            }))
        }
    }, [hallGroups, crossfade])

    useEffect(() => {
        if (hallGroups.length < 2) return
        const id = setInterval(doTransition, INTERVAL)
        return () => clearInterval(id)
    }, [doTransition, hallGroups.length])

    if (!hallGroups.length) {
        return (
            <div className={styles.gallery}>
                <div className={styles.empty}>Loading Cinemas…</div>
            </div>
        )
    }

    return (
        <div className={styles.gallery}>
            <HallLayer ref={layerARef} group={hallGroups[idxA] || hallGroups[0]} />
            <HallLayer ref={layerBRef} group={hallGroups[idxB] || hallGroups[0]} />

            {hallGroups.length > 1 && (
                <div className={styles.hallDots} aria-hidden="true">
                    {hallGroups.map((_, i) => (
                        <div key={i} className={`${styles.hallDot} ${i === hallIdxRef.current ? styles.hallDotActive : ''}`} />
                    ))}
                </div>
            )}
        </div>
    )
}
