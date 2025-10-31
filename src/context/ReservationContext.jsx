/*
Context for managing seat reservations with timer and saved movies.
Reserved seats will expire after a set time if not booked.
*/

import { createContext, useContext, useState, useEffect, useCallback } from "react"

// eslint-disable-next-line react-refresh/only-export-components
export const ReservationContext = createContext()

// Reservation expires after 10 minutes (600000ms)
const RESERVATION_TIMEOUT = 10 * 60 * 1000

export function ReservationProvider({ children }) {
    // Reserved seats: { movieId, movieTitle, seats: [], screeningDate, screeningTime, hallName, expiresAt }
    const [reservations, setReservations] = useState(() => {
        const saved = localStorage.getItem('reservations')
        if (saved) {
            const parsed = JSON.parse(saved)
            // Filter out expired reservations
            const now = Date.now()
            return parsed.filter(r => r.expiresAt > now)
        }
        return []
    })

    // Saved movies (watchlist)
    const [savedMovies, setSavedMovies] = useState(() => {
        const saved = localStorage.getItem('watchlist')
        return saved ? JSON.parse(saved) : []
    })

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem('reservations', JSON.stringify(reservations))
    }, [reservations])

    useEffect(() => {
        localStorage.setItem('watchlist', JSON.stringify(savedMovies))
    }, [savedMovies])

    // Check for expired reservations every second
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now()
            setReservations(prev => {
                const filtered = prev.filter(r => r.expiresAt > now)
                if (filtered.length !== prev.length) {
                    return filtered
                }
                return prev
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    // Add a reservation
    const addReservation = useCallback((movieId, movieTitle, seats, screeningDate, screeningTime, hallName) => {
        const expiresAt = Date.now() + RESERVATION_TIMEOUT
        setReservations(prev => {
            // Check if reservation for same screening exists
            const existingIndex = prev.findIndex(
                r => r.movieId === movieId && r.screeningDate === screeningDate && r.screeningTime === screeningTime
            )

            if (existingIndex >= 0) {
                // Update existing reservation
                const updated = [...prev]
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    seats,
                    expiresAt
                }
                return updated
            }

            // Add new reservation
            return [...prev, {
                id: Date.now(),
                movieId,
                movieTitle,
                seats,
                screeningDate,
                screeningTime,
                hallName,
                expiresAt
            }]
        })
    }, [])

    // Remove a reservation
    const removeReservation = useCallback((reservationId) => {
        setReservations(prev => prev.filter(r => r.id !== reservationId))
    }, [])

    // Clear all reservations for a movie (after successful booking)
    const clearMovieReservations = useCallback((movieId, screeningDate, screeningTime) => {
        setReservations(prev => prev.filter(
            r => !(r.movieId === movieId && r.screeningDate === screeningDate && r.screeningTime === screeningTime)
        ))
    }, [])

    // Add movie to saved list
    const addSavedMovie = useCallback((movie) => {
        setSavedMovies(prev => {
            if (prev.some(m => m.id === movie.id)) return prev
            return [...prev, movie]
        })
    }, [])

    // Remove movie from saved list
    const removeSavedMovie = useCallback((movieId) => {
        setSavedMovies(prev => prev.filter(m => m.id !== movieId))
    }, [])

    // Check if movie is saved
    const isMovieSaved = useCallback((movieId) => {
        return savedMovies.some(m => m.id === movieId)
    }, [savedMovies])

    // Get time remaining for a reservation
    const getTimeRemaining = useCallback((expiresAt) => {
        const remaining = expiresAt - Date.now()
        if (remaining <= 0) return { minutes: 0, seconds: 0, expired: true }

        const minutes = Math.floor(remaining / 60000)
        const seconds = Math.floor((remaining % 60000) / 1000)
        return { minutes, seconds, expired: false }
    }, [])

    const value = {
        reservations,
        savedMovies,
        addReservation,
        removeReservation,
        clearMovieReservations,
        addSavedMovie,
        removeSavedMovie,
        isMovieSaved,
        getTimeRemaining,
        totalItems: reservations.length + savedMovies.length
    }

    return (
        <ReservationContext.Provider value={value}>
            {children}
        </ReservationContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useReservation() {
    const context = useContext(ReservationContext)
    if (!context) {
        throw new Error('useReservation must be used within a ReservationProvider')
    }
    return context
}

