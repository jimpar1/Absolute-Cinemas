/**
 * TicketModal – shows the cinema-ticket UI for an existing confirmed booking.
 * Reuses the BookingConfirmation ticket styles without the post-booking GSAP fanfare.
 */

import { useMemo } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import styles from "./BookingConfirmation.module.css"

/* ── Barcode helpers (mirrored from BookingConfirmation) ─────── */
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

/* ── Main component ──────────────────────────────────────────── */

/**
 * @param {{ booking: object|null, open: boolean, onClose: () => void }} props
 * booking shape: API booking object with screening_details nested
 */
export default function TicketModal({ booking, open, onClose }) {
    if (!booking) return null

    const startTime = booking.screening_details?.start_time
    const date = startTime
        ? new Date(startTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "—"
    const time = startTime
        ? new Date(startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
        : "—"

    const screening = {
        movieTitle: booking.screening_details?.movie_title || booking.movie_title || "Movie",
        date,
        time,
        hall: booking.screening_details?.hall_name || "—",
    }

    const seats = booking.seat_numbers
        ? booking.seat_numbers.split(",").map(s => s.trim()).filter(Boolean)
        : ["?"]

    const bookingRef = `AC-${String(booking.id).padStart(4, "0")}`

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-center text-lg font-bold tracking-wide">
                        Your Tickets
                    </DialogTitle>
                    <p className="text-center text-sm text-muted-foreground">
                        {screening.movieTitle} &nbsp;·&nbsp; {screening.date} &nbsp;·&nbsp; {screening.time}
                    </p>
                </DialogHeader>

                {/* Ticket cards */}
                <div className={styles.ticketList} style={{ marginTop: "0.5rem" }}>
                    {seats.map(seat => (
                        <div key={seat} className={styles.ticket}>
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
                            <div className={styles.divider} />
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

                {/* Total */}
                <div className={styles.totalRow} style={{ marginTop: "0.25rem" }}>
                    <span className={styles.totalLabel}>Total Paid</span>
                    <span className={styles.totalAmount}>€{booking.total_price}</span>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", justifyContent: "center", marginTop: "0.25rem" }}>
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print Tickets
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
