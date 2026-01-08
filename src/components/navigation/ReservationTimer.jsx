/**
 * ReservationTimer – Displays a live countdown (mm:ss) for a seat reservation.
 * Shows "Expired" in red once the time runs out.
 */

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

export default function ReservationTimer({ expiresAt, getTimeRemaining }) {
    const [timeLeft, setTimeLeft] = useState(getTimeRemaining(expiresAt))

    /* Tick every second */
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(getTimeRemaining(expiresAt))
        }, 1000)
        return () => clearInterval(interval)
    }, [expiresAt, getTimeRemaining])

    if (timeLeft.expired) return <span className="text-red-500 text-xs">Expired</span>

    return (
        <span className="text-xs text-orange-400 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
        </span>
    )
}
