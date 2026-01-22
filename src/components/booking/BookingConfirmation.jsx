/**
 * BookingConfirmation – Step 4 of the booking flow.
 * Displays animated cinema tickets with a print option.
 */

import { useEffect, useRef, useMemo } from "react"
import { gsap } from "gsap"
import { Button } from "@/components/ui/button"
import { Printer, Home, Plus } from "lucide-react"
import styles from "./BookingConfirmation.module.css"

/**
 * Deterministic "barcode" bar widths from a string seed.
 * Same seat + ref always produces the same bars — no re-render flicker.
 */
function makeBars(seed) {
    let h = 0
    for (let i = 0; i < seed.length; i++) {
        h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
    }
    const bars = []
    for (let i = 0; i < 26; i++) {
        h = (Math.imul(1664525, h) + 1013904223) | 0
        const u = (h >>> 0) / 0xffffffff
        bars.push({ w: u < 0.25 ? 1 : u < 0.7 ? 2 : 3, tall: u > 0.2 })
    }
    return bars
}

function Barcode({ seed }) {
    const bars = useMemo(() => makeBars(seed), [seed])
    const totalW = bars.reduce((acc, b) => acc + b.w + 1, 0)
    let x = 0
    return (
        <svg width="64" height="44" viewBox={`0 0 ${totalW} 44`} preserveAspectRatio="none">
            {bars.map((bar, i) => {
                const el = (
                    <rect
                        key={i}
                        x={x}
                        y={bar.tall ? 0 : 7}
                        width={bar.w}
                        height={bar.tall ? 44 : 30}
                        fill="rgba(255,255,255,0.5)"
                        rx="0.3"
                    />
                )
                x += bar.w + 1
                return el
            })}
        </svg>
    )
}

export default function BookingConfirmation({ screening, bookingSummary, onReturnHome, onNewBooking }) {
    const containerRef = useRef(null)

    // Stable booking reference — one per component mount
    const bookingRef = useMemo(() => {
        const hex = (Date.now() & 0xffff).toString(16).toUpperCase().padStart(4, "0")
        return `AC-${hex}`
    }, [])

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

            // 1. Check ring bursts in
            tl.from(".bc-ring", {
                scale: 0,
                duration: 0.55,
                ease: "back.out(2.2)",
            })

            // 2. Title + subtitle slide up
            tl.from(".bc-title", { y: -24, opacity: 0, duration: 0.4 }, "-=0.15")
            tl.from(".bc-sub",   { y: -12, opacity: 0, duration: 0.35 }, "-=0.25")

            // 3. Tickets fly in from below with slight tilt, staggered
            tl.from(".bc-ticket", {
                y: 70,
                opacity: 0,
                rotation: -3,
                transformOrigin: "center bottom",
                stagger: 0.13,
                duration: 0.65,
                ease: "back.out(1.5)",
            }, "-=0.1")

            // 4. Total + actions
            tl.from(".bc-footer", {
                opacity: 0,
                y: 18,
                stagger: 0.08,
                duration: 0.4,
            }, "-=0.2")

            // 5. Subtle pulse on check ring after settle
            tl.to(".bc-ring", {
                boxShadow: "0 0 0 12px rgba(255,255,255,0.1), 0 0 0 24px rgba(255,255,255,0.04), 0 8px 40px rgba(255,255,255,0.18)",
                duration: 0.6,
                yoyo: true,
                repeat: 1,
                ease: "sine.inOut",
            }, "-=0.1")

        }, containerRef)

        return () => ctx.revert()
    }, [])

    return (
        <div ref={containerRef} className={styles.wrapper}>

            {/* ── Header ── */}
            <div className={styles.header}>
                <div className={`bc-ring ${styles.checkRing}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8"
                        strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>
                <h2 className={`bc-title ${styles.title}`}>Enjoy the Show!</h2>
                <p className={`bc-sub ${styles.sub}`}>
                    Confirmation sent to {bookingSummary.email}
                </p>
            </div>

            {/* ── Tickets ── */}
            <div className={styles.ticketList}>
                {bookingSummary.seats.map((seat) => (
                    <div key={seat} className={`bc-ticket ${styles.ticket}`}>

                        {/* Left body */}
                        <div className={styles.ticketBody}>
                            <div className={styles.cinemaBrand}>Absolute Cinemas</div>
                            <div className={styles.movieTitle}>{screening.movieTitle}</div>
                            <div className={styles.detailsBlock}>
                                <div className={styles.detailRow}>
                                    <span>{screening.date}</span>
                                    <span className={styles.detailDot} />
                                    <span>{screening.time}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>{screening.hall}</span>
                                </div>
                            </div>
                            <div className={styles.refCode}>
                                {bookingRef}-{seat.replace(/\s+/g, "")}
                            </div>
                        </div>

                        {/* Perforated divider */}
                        <div className={styles.divider} />

                        {/* Right stub */}
                        <div className={styles.ticketStub}>
                            <div className={styles.stubLabel}>Seat</div>
                            <div className={styles.stubSeat}>{seat}</div>
                            <div className={styles.barcodeWrap}>
                                <Barcode seed={seat + bookingRef} />
                            </div>
                            <div className={styles.stubType}>Standard</div>
                        </div>

                    </div>
                ))}
            </div>

            {/* ── Total ── */}
            <div className={`bc-footer ${styles.totalRow}`}>
                <span className={styles.totalLabel}>Total Paid</span>
                <span className={styles.totalAmount}>€{bookingSummary.total}</span>
            </div>

            {/* ── Actions ── */}
            <div className={`bc-footer ${styles.actions}`}>
                <Button variant="outline" onClick={() => window.print()}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Tickets
                </Button>
                <Button onClick={onReturnHome}>
                    <Home className="h-4 w-4 mr-2" />
                    Return Home
                </Button>
                <Button variant="outline" onClick={onNewBooking}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Booking
                </Button>
            </div>

        </div>
    )
}
