/**
 * InboxDropdown – Dropdown panel in the nav bar that shows:
 *   • Upcoming confirmed tickets (future screenings)
 *   • Active seat reservations (with countdown timers)
 *   • Saved / watchlisted movies
 *
 * Closes when clicking outside of the dropdown area.
 */

import { useState, useEffect } from "react"
import { Inbox, X, Armchair, Bookmark, Film, Trash2, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useReservation } from "@/context/ReservationContext"
import { useAuth } from "@/context/AuthContext"
import { getUserBookings } from "@/api/bookings"
import { Link } from "react-router-dom"
import ReservationTimer from "./ReservationTimer"
import TicketModal from "@/components/booking/TicketModal"

export default function InboxDropdown() {
    const [inboxOpen, setInboxOpen] = useState(false)
    const [upcomingBookings, setUpcomingBookings] = useState([])
    const [ticketBooking, setTicketBooking] = useState(null)

    const { reservations, savedMovies, removeReservation, removeSavedMovie, getTimeRemaining, totalItems } = useReservation()
    const { isAuthenticated, accessToken } = useAuth()

    /* Fetch confirmed future bookings whenever the dropdown opens */
    useEffect(() => {
        if (!inboxOpen) return

        const loadGuestBookings = () => {
            try {
                const local = JSON.parse(localStorage.getItem('guestBookings') || '[]')
                const now = new Date()
                const validLocal = local.filter(b => {
                    const t = b.screening_details?.start_time
                    return t && new Date(t) > now && b.status !== "cancelled"
                })
                if (validLocal.length !== local.length) {
                    localStorage.setItem('guestBookings', JSON.stringify(validLocal))
                }
                return validLocal
            } catch {
                return []
            }
        }

        const guestB = loadGuestBookings()

        if (isAuthenticated && accessToken) {
            getUserBookings(accessToken)
                .then(data => {
                    const all = Array.isArray(data) ? data : (data.results || [])
                    const now = new Date()
                    const apiB = all.filter(b => {
                        const t = b.screening_details?.start_time
                        return t && new Date(t) > now && b.status !== "cancelled"
                    })
                    // Combine both so they don't lose local bookings upon login, though usually local is for guests
                    setUpcomingBookings([...guestB, ...apiB])
                })
                .catch(() => setUpcomingBookings(guestB))
        } else {
            setTimeout(() => setUpcomingBookings(guestB), 0)
        }
    }, [inboxOpen, isAuthenticated, accessToken])

    /* Close when clicking outside */
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (inboxOpen && !e.target.closest('.inbox-dropdown') && !e.target.closest('.inbox-trigger')) {
                setInboxOpen(false)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [inboxOpen])

    const totalCount = totalItems + upcomingBookings.length

    return (
        <div className="relative">
            {/* Trigger Button */}
            <Button
                variant="ghost"
                size="icon"
                className="inbox-trigger relative"
                onClick={() => setInboxOpen(!inboxOpen)}
                aria-label="Inbox"
            >
                <Inbox className="h-5 w-5" />
                {totalCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                        {totalCount}
                    </span>
                )}
            </Button>

            {/* Dropdown Panel */}
            {inboxOpen && (
                <div className="inbox-dropdown absolute right-0 top-full mt-2 w-80 sm:w-96 bg-background border rounded-lg shadow-xl z-50 max-h-[70vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="font-semibold text-lg">My Inbox</h3>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setInboxOpen(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="overflow-y-auto flex-1">

                        {/* ── Upcoming Tickets ── */}
                        {upcomingBookings.length > 0 && (
                            <div className="p-4 border-b">
                                <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                                    <Ticket className="h-4 w-4" style={{ color: "var(--tier-solid)" }} />
                                    Upcoming Tickets
                                </h4>
                                <div className="space-y-2">
                                    {upcomingBookings.map(booking => {
                                        const startTime = booking.screening_details?.start_time
                                        const dateStr = startTime
                                            ? new Date(startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                            : "—"
                                        const timeStr = startTime
                                            ? new Date(startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                                            : "—"
                                        const seats = booking.seat_numbers
                                            ? booking.seat_numbers.split(",").map(s => s.trim()).join(", ")
                                            : "—"

                                        return (
                                            <button
                                                key={booking.id}
                                                onClick={() => { setTicketBooking(booking); setInboxOpen(false) }}
                                                className="w-full text-left bg-muted/40 hover:bg-muted/70 rounded-lg p-3 transition-colors group"
                                                style={{ border: "1px solid var(--tier-color, rgba(255,255,255,0.06))" }}
                                            >
                                                <p className="font-medium text-sm truncate">
                                                    {booking.screening_details?.movie_title || "Movie"}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {dateStr} · {timeStr} · {booking.screening_details?.hall_name || "—"}
                                                </p>
                                                <div className="flex items-center justify-between mt-1.5">
                                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                                        {seats}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                                        View tickets →
                                                    </span>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── Reservations ── */}
                        {reservations.length > 0 && (
                            <div className="p-4 border-b">
                                <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                                    <Armchair className="h-4 w-4" />
                                    Reserved Seats
                                </h4>
                                <div className="space-y-3">
                                    {reservations.map((reservation) => (
                                        <div key={reservation.id} className="bg-muted/50 rounded-lg p-3 relative group">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{reservation.movieTitle}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {reservation.screeningDate} • {reservation.screeningTime}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{reservation.hallName}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                                            Seats: {reservation.seats.sort().join(", ")}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <ReservationTimer expiresAt={reservation.expiresAt} getTimeRemaining={getTimeRemaining} />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => removeReservation(reservation.id)}
                                                    >
                                                        <Trash2 className="h-3 w-3 text-destructive" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <Link
                                                to={`/booking/${reservation.movieId}`}
                                                className="absolute inset-0 rounded-lg"
                                                onClick={() => setInboxOpen(false)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Saved Movies ── */}
                        {savedMovies.length > 0 && (
                            <div className="p-4">
                                <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                                    <Bookmark className="h-4 w-4" />
                                    Saved Movies
                                </h4>
                                <div className="space-y-2">
                                    {savedMovies.map((movie) => (
                                        <div
                                            key={movie.id}
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group relative"
                                        >
                                            {movie.poster_url ? (
                                                <img src={movie.poster_url} alt={movie.title} className="w-10 h-14 object-cover rounded" />
                                            ) : (
                                                <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                                                    <Film className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{movie.title}</p>
                                                {movie.release_date && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(movie.release_date).getFullYear()}
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    removeSavedMovie(movie.id)
                                                }}
                                            >
                                                <Trash2 className="h-3 w-3 text-destructive" />
                                            </Button>
                                            <Link
                                                to={`/movies/${movie.id}`}
                                                className="absolute inset-0 rounded-lg"
                                                onClick={() => setInboxOpen(false)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Empty state ── */}
                        {upcomingBookings.length === 0 && reservations.length === 0 && savedMovies.length === 0 && (
                            <div className="p-8 text-center">
                                <Inbox className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                                <p className="text-muted-foreground">Your inbox is empty</p>
                                <p className="text-sm text-muted-foreground/70 mt-1">
                                    Upcoming tickets, reserved seats and saved movies will appear here
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Ticket modal */}
            <TicketModal
                booking={ticketBooking}
                open={!!ticketBooking}
                onClose={() => setTicketBooking(null)}
            />
        </div>
    )
}
