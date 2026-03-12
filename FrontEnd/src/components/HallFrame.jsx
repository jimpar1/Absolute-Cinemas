/**
 * HallFrame — mosaic gallery per hall, hall-to-hall slide transitions.
 * Left/right arrows navigate between halls. Click any photo → lightbox.
 */
/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-element-interactions */

import { useEffect, useLayoutEffect, useRef, useState, forwardRef } from 'react'
import gsap from 'gsap'
import styles from './HallFrame.module.css'

// ── HallSlot ──────────────────────────────────────────────────────────

const HallSlot = forwardRef(function HallSlot({ group, onPhotoClick }, ref) {
    const photos = group?.photos || []
    return (
        <div ref={ref} className={styles.hallSlot}>
            {photos.length > 0 ? photos.map((url, i) => (
                <div
                    key={i}
                    className={styles.photoItem}
                    style={{ flex: i === 0 ? 3 : 2 }}
                    onClick={() => onPhotoClick?.(i)}
                >
                    <img src={url} className={styles.photoImg} alt="" loading={i === 0 ? 'eager' : 'lazy'} />
                </div>
            )) : <div className={styles.emptySlot} />}
        </div>
    )
})

// ── HallFrame ─────────────────────────────────────────────────────────

export default function HallFrame({ hallGroups = [] }) {
    const [hallIdx,   setHallIdx]   = useState(0)
    const [slotAHall, setSlotAHall] = useState(0)
    const [slotBHall, setSlotBHall] = useState(0)
    const [lightbox,  setLightbox]  = useState(null)

    const slotARef   = useRef(null)
    const slotBRef   = useRef(null)
    const overlayRef = useRef(null)

    const isCurrentA     = useRef(true)
    const animatingRef   = useRef(false)
    const timerRef       = useRef(null)
    const hallIdxRef     = useRef(0)
    const hoveredRef     = useRef(false)
    const hallGroupsRef  = useRef(hallGroups)
    const initializedRef = useRef(false)
    const pendingRef     = useRef(null) // { targetHallIdx, direction }
    const slotAHallRef   = useRef(0)
    const slotBHallRef   = useRef(0)
    const queuedNavRef   = useRef(null) // { targetHallIdx, direction } — next nav after current animation
    const animTargetRef  = useRef(0)    // hall index currently being animated TO

    const startTimerRef      = useRef(null)
    const closeLightboxFnRef = useRef(null)
    const lightboxNavFnRef   = useRef(null)
    const lightboxRef        = useRef(null)
    lightboxRef.current = lightbox
    slotAHallRef.current = slotAHall
    slotBHallRef.current = slotBHall

    useEffect(() => { hallGroupsRef.current = hallGroups }, [hallGroups])

    // ── Fire animation BEFORE browser paints (prevents staging flash) ─
    // useLayoutEffect runs synchronously after DOM mutations, before paint.
    // pendingRef is set by go() after staging state update causes a re-render.
    useLayoutEffect(() => {
        if (!pendingRef.current) return
        const { targetHallIdx, direction } = pendingRef.current
        pendingRef.current = null
        // eslint-disable-next-line react-hooks/immutability
        _executeAnimation(targetHallIdx, direction)
    })

    // ── Timer ──────────────────────────────────────────────────────────

    function killTimer() {
        if (timerRef.current) timerRef.current.kill()
    }

    function startTimer() {
        killTimer()
        if (hoveredRef.current) return
        timerRef.current = gsap.delayedCall(5, doAdvance)
    }
    startTimerRef.current = startTimer

    function doAdvance() {
        const groups = hallGroupsRef.current
        if (!groups.length) return
        go((hallIdxRef.current + 1) % groups.length, 'next')
    }

    // ── Hall navigation ────────────────────────────────────────────────

    function preloadHall(hallIdx) {
        const photos = hallGroupsRef.current[hallIdx]?.photos || []
        return Promise.all(
            photos.map(url => {
                const img = new Image()
                img.src = url
                return img.decode().catch(() => {})
            })
        )
    }

    function go(targetHallIdx, direction) {
        if (animatingRef.current) return
        animatingRef.current = true
        animTargetRef.current = targetHallIdx
        killTimer()

        // Preload staging images first (cap 400 ms), then update state
        const preload = preloadHall(targetHallIdx)
        const timeout = new Promise(r => setTimeout(r, 400))
        Promise.race([preload, timeout]).then(() => {
            const stagingHall = isCurrentA.current ? slotBHallRef.current : slotAHallRef.current
            if (stagingHall === targetHallIdx) {
                // Staging already shows the target hall — React would skip the re-render,
                // so useLayoutEffect would never fire. Execute the animation directly.
                _executeAnimation(targetHallIdx, direction)
            } else {
                if (isCurrentA.current) setSlotBHall(targetHallIdx)
                else                    setSlotAHall(targetHallIdx)
                // useLayoutEffect will pick this up after the re-render
                pendingRef.current = { targetHallIdx, direction }
            }
        })
    }

    function _executeAnimation(targetHallIdx, direction) {
        const currentEl = isCurrentA.current ? slotARef.current : slotBRef.current
        const stagingEl = isCurrentA.current ? slotBRef.current : slotARef.current
        const sign      = direction === 'next' ? 1 : -1

        // Position staging off-screen; ensure it renders on top during slide-in
        gsap.set(stagingEl, { xPercent: sign * 100, zIndex: 2 })
        gsap.set(currentEl, { zIndex: 1 })

        if (overlayRef.current) {
            gsap.to(overlayRef.current, { autoAlpha: 0, duration: 0.2 })
        }

        gsap.timeline({
            onComplete() {
                isCurrentA.current = !isCurrentA.current
                // ⚠️ Do NOT reset xPercent on currentEl — it was animated
                //    to -sign*100 (off-screen) and must stay there.
                setHallIdx(targetHallIdx)
                hallIdxRef.current = targetHallIdx
                animatingRef.current = false

                const next = queuedNavRef.current
                if (next) {
                    // A queued click arrived during this animation — execute it immediately
                    // without fading the overlay back in (it stays hidden for the next slide).
                    queuedNavRef.current = null
                    go(next.targetHallIdx, next.direction)
                } else {
                    if (overlayRef.current) {
                        gsap.to(overlayRef.current, { autoAlpha: 1, duration: 0.3 })
                    }
                    startTimerRef.current()
                }
            },
        })
            .to(currentEl, { xPercent: -sign * 100, duration: 0.55, ease: 'power3.out' }, 0)
            .to(stagingEl, { xPercent: 0,           duration: 0.55, ease: 'power3.out' }, 0)
    }

    function handleNav(dir) {
        // Arrow click = intentional navigation; lift hover-pause so timer restarts after transition
        hoveredRef.current = false
        const groups = hallGroupsRef.current

        if (animatingRef.current) {
            // Queue the next navigation relative to where we're currently heading
            const baseIdx = queuedNavRef.current?.targetHallIdx ?? animTargetRef.current
            const nextIdx = dir === 'next'
                ? (baseIdx + 1) % groups.length
                : (baseIdx - 1 + groups.length) % groups.length
            queuedNavRef.current = { targetHallIdx: nextIdx, direction: dir }
            return
        }

        const hIdx = hallIdxRef.current
        if (dir === 'next') go((hIdx + 1) % groups.length, 'next')
        else                go((hIdx - 1 + groups.length) % groups.length, 'prev')
    }

    // ── Lightbox ───────────────────────────────────────────────────────

    function openLightbox(photoHallIdx, photoIdx) {
        if (animatingRef.current) return
        killTimer()
        document.body.style.overflow = 'hidden'
        setLightbox({ hallIdx: photoHallIdx, photoIdx })
    }

    function closeLightbox() {
        const lb = lightboxRef.current
        if (!lb) return
        document.body.style.overflow = ''
        setLightbox(null)
        startTimerRef.current()
    }
    closeLightboxFnRef.current = closeLightbox

    function lightboxNav(dir) {
        setLightbox(prev => {
            if (!prev) return prev
            const groups = hallGroupsRef.current
            const { hallIdx: hIdx, photoIdx: pIdx } = prev
            const photos = groups[hIdx]?.photos || []
            if (dir === 'next') {
                if (pIdx < photos.length - 1) return { ...prev, photoIdx: pIdx + 1 }
                return { hallIdx: (hIdx + 1) % groups.length, photoIdx: 0 }
            } else {
                if (pIdx > 0) return { ...prev, photoIdx: pIdx - 1 }
                const prevHall   = (hIdx - 1 + groups.length) % groups.length
                const prevPhotos = groups[prevHall]?.photos || []
                return { hallIdx: prevHall, photoIdx: Math.max(0, prevPhotos.length - 1) }
            }
        })
    }
    lightboxNavFnRef.current = lightboxNav

    useEffect(() => {
        if (!lightbox) return
        const onKey = e => {
            if (e.key === 'Escape')     closeLightboxFnRef.current()
            if (e.key === 'ArrowLeft')  lightboxNavFnRef.current('prev')
            if (e.key === 'ArrowRight') lightboxNavFnRef.current('next')
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [!!lightbox]) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Lifecycle ──────────────────────────────────────────────────────

    useEffect(() => {
        if (!hallGroups.length || initializedRef.current) return
        initializedRef.current = true
        gsap.set(slotARef.current, { xPercent: 0,   zIndex: 2 }) // A visible
        gsap.set(slotBRef.current, { xPercent: 100, zIndex: 1 }) // B staged off-screen right
        startTimerRef.current()
    }, [hallGroups])

    useEffect(() => {
        const slotAEl = slotARef.current
        const slotBEl = slotBRef.current
        const overlayEl = overlayRef.current

        return () => {
            killTimer()
            document.body.style.overflow = ''
            gsap.killTweensOf([slotAEl, slotBEl, overlayEl])
        }
    }, [])

    // ── Derived ────────────────────────────────────────────────────────

    const currentGroup = hallGroups[hallIdx] || hallGroups[0]
    const groupA = hallGroups[slotAHall] || hallGroups[0]
    const groupB = hallGroups[slotBHall] || hallGroups[0]

    const lbGroup  = lightbox ? (hallGroups[lightbox.hallIdx] || null) : null
    const lbPhotos = lbGroup?.photos || []
    const lbUrl    = lbPhotos[lightbox?.photoIdx] || ''

    let flatCurrent = 0, flatTotal = 0
    if (lightbox) {
        for (let i = 0; i < hallGroups.length; i++) {
            const n = hallGroups[i]?.photos?.length || 0
            if (i < lightbox.hallIdx)        flatCurrent += n
            else if (i === lightbox.hallIdx) flatCurrent += lightbox.photoIdx + 1
            flatTotal += n
        }
    }

    if (!hallGroups.length) {
        return (
            <div className={styles.gallery}>
                <div className={styles.empty}>Loading Cinemas…</div>
            </div>
        )
    }

    // ── Render ─────────────────────────────────────────────────────────

    return (
        <>
            <div
                className={styles.gallery}
                onMouseEnter={() => { hoveredRef.current = true;  killTimer() }}
                onMouseLeave={() => { hoveredRef.current = false; startTimerRef.current() }}
            >
                <HallSlot ref={slotARef} group={groupA} onPhotoClick={i => openLightbox(slotAHall, i)} />
                <HallSlot ref={slotBRef} group={groupB} onPhotoClick={i => openLightbox(slotBHall, i)} />

                <div ref={overlayRef} className={styles.overlay}>
                    <span className={styles.hallBadge}>{currentGroup?.badge}</span>
                    <h3 className={styles.hallName}>{currentGroup?.name}</h3>
                    <p className={styles.hallSeats}>{currentGroup?.seats}</p>
                    <p className={styles.hallTech}>{currentGroup?.tech}</p>
                </div>

                {hallGroups.length > 1 && (
                    <>
                        <button
                            className={`${styles.navBtn} ${styles.navBtnLeft}`}
                            onClick={() => handleNav('prev')}
                            aria-label="Previous hall"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 18l-6-6 6-6"/>
                            </svg>
                        </button>
                        <button
                            className={`${styles.navBtn} ${styles.navBtnRight}`}
                            onClick={() => handleNav('next')}
                            aria-label="Next hall"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 18l6-6-6-6"/>
                            </svg>
                        </button>
                    </>
                )}

                {hallGroups.length > 1 && (
                    <div className={styles.hallDots} aria-hidden="true">
                        {hallGroups.map((_, i) => (
                            <div
                                key={i}
                                className={`${styles.hallDot} ${i === hallIdx ? styles.hallDotActive : ''}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {lightbox && (
                <div className={styles.lbOverlay} onClick={closeLightboxFnRef.current}>
                    <button className={styles.lbClose} onClick={e => { e.stopPropagation(); closeLightboxFnRef.current() }} aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                    <button className={`${styles.lbArrow} ${styles.lbArrowLeft}`} onClick={e => { e.stopPropagation(); lightboxNavFnRef.current('prev') }} aria-label="Previous">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 18l-6-6 6-6"/>
                        </svg>
                    </button>
                    <img src={lbUrl} className={styles.lbImg} alt={lbGroup?.name || ''} onClick={e => e.stopPropagation()} />
                    <button className={`${styles.lbArrow} ${styles.lbArrowRight}`} onClick={e => { e.stopPropagation(); lightboxNavFnRef.current('next') }} aria-label="Next">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6"/>
                        </svg>
                    </button>
                    <div className={styles.lbCaption} onClick={e => e.stopPropagation()}>
                        {lbGroup?.badge && <span className={styles.hallBadge}>{lbGroup.badge}</span>}
                        <span className={styles.lbName}>{lbGroup?.name}</span>
                        <span className={styles.lbCounter}>{flatCurrent} / {flatTotal}</span>
                    </div>
                </div>
            )}
        </>
    )
}
