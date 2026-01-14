import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import styles from './LoadingScreen.module.css'

gsap.registerPlugin(SplitText)

// 4 identical lines stacked in the tube — the offset stagger creates the cylinder illusion
const LINES = [
    'ABSOLUTE CINEMAS',
    'ABSOLUTE CINEMAS',
    'ABSOLUTE CINEMAS',
    'ABSOLUTE CINEMAS',
]

export default function LoadingScreen({ onComplete }) {
    const panelRef      = useRef(null)
    const tubeRef       = useRef(null)
    const loopTlRef     = useRef(null)
    const splitRefs     = useRef([])
    const exitStarted   = useRef(false)
    const onCompleteRef = useRef(onComplete)

    const [resourcesReady, setResourcesReady] = useState(false)
    const [minTimeDone,    setMinTimeDone]    = useState(false)

    useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

    // ── Barrel roll loop (plays immediately) ─────────────────────
    useEffect(() => {
        const lines = tubeRef.current?.querySelectorAll('[data-line]')
        if (!lines?.length) return

        splitRefs.current = Array.from(lines).map(
            line => new SplitText(line, { type: 'chars' })
        )

        const depth = -window.innerWidth / 8
        const transformOrigin = `50% 50% ${depth}px`

        gsap.set(lines, { perspective: 700, transformStyle: 'preserve-3d' })

        const tl = gsap.timeline({ repeat: -1 })
        splitRefs.current.forEach((split, i) => {
            tl.fromTo(
                split.chars,
                { rotationX: -90 },
                { rotationX: 90, stagger: 0.08, duration: 0.9, ease: 'none', transformOrigin },
                i * 0.45
            )
        })
        loopTlRef.current = tl

        return () => {
            tl.kill()
            splitRefs.current.forEach(s => s.revert())
        }
    }, [])

    // ── Minimum display time ─────────────────────────────────────
    // 1 cycle = 3.37 s  (4 lines × 0.45 s offset + 2.02 s tween duration)
    // 3 500 ms = 1 full roll + small buffer — long enough to feel intentional.
    useEffect(() => {
        const id = setTimeout(() => setMinTimeDone(true), 3500)
        return () => clearTimeout(id)
    }, [])

    // ── Resource preloading ──────────────────────────────────────
    useEffect(() => {
        let settled = false
        const done = () => { if (!settled) { settled = true; setResourcesReady(true) } }

        // Hard fallback — never block beyond 7 s
        const hard = setTimeout(done, 7000)

        // All page assets (fonts, css, images)
        if (document.readyState === 'complete') {
            done()
        } else {
            window.addEventListener('load', done, { once: true })
        }

        return () => clearTimeout(hard)
    }, [])

    // ── Exit sequence when both gates open ───────────────────────
    useEffect(() => {
        if (!resourcesReady || !minTimeDone || exitStarted.current) return
        exitStarted.current = true

        loopTlRef.current?.kill()

        const allChars = splitRefs.current.flatMap(s => s.chars)

        const tl = gsap.timeline({ onComplete: () => onCompleteRef.current?.() })

        // 1. Settle — chars rotate to face forward
        tl.to(allChars, { rotationX: 0, duration: 0.45, ease: 'power3.out', overwrite: true })

        // 2. Zoom — tube scales up slightly
        tl.to(tubeRef.current, { scale: 1.12, duration: 0.55, ease: 'power2.out' }, '-=0.1')

        // 3. Hold so the text reads
        tl.to({}, { duration: 0.6 })

        // 4. Exit — slide entire panel up
        tl.to(panelRef.current, { y: '-105%', duration: 1.1, ease: 'power3.inOut' })

        return () => tl.kill()
    }, [resourcesReady, minTimeDone])

    return (
        <div ref={panelRef} className={styles.panel}>
            <div className={styles.curve} />
            <div ref={tubeRef} className={styles.tube}>
                {LINES.map((text, i) => (
                    <h1 key={i} data-line="" className={styles.line}>{text}</h1>
                ))}
            </div>
        </div>
    )
}
