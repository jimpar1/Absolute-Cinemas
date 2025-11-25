/**
 * InboxDropdown – Dropdown panel in the nav bar that shows:
 *   • Active seat reservations (with countdown timers)
 *   • Saved / watchlisted movies
 *
 * Closes when clicking outside of the dropdown area.
 */

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Inbox, X, Armchair, Bookmark, Film, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useReservation } from "@/context/ReservationContext"
import ReservationTimer from "./ReservationTimer"

export default function InboxDropdown() {
    const [inboxOpen, setInboxOpen] = useState(false)
    const { reservations, savedMovies, removeReservation, removeSavedMovie, getTimeRemaining, totalItems } = useReservation()

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
                {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                        {totalItems}
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
                        {reservations.length === 0 && savedMovies.length === 0 && (
                            <div className="p-8 text-center">
                                <Inbox className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                                <p className="text-muted-foreground">Your inbox is empty</p>
                                <p className="text-sm text-muted-foreground/70 mt-1">
                                    Reserved seats and saved movies will appear here
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
