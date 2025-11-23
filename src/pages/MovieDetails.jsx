/**
 * MovieDetails page – Shows full movie information.
 * Composed from smaller components:
 *   - HeroGallery      → backdrop image slider
 *   - ScreeningsCalendar → weekly / monthly screening calendar + modal
 *   - TrailerSection    → embedded YouTube trailer
 *   - MovieSidebar      → actions, info card, cast slider
 */

import { useParams, Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { getMovie, getMovieScreenings } from "@/api/movies"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useReservation } from "@/context/ReservationContext"
import { getBackdropImages } from "@/utils/image"

import HeroGallery from "@/components/movie/HeroGallery"
import ScreeningsCalendar from "@/components/movie/ScreeningsCalendar"
import TrailerSection from "@/components/movie/TrailerSection"
import MovieSidebar from "@/components/movie/MovieSidebar"

export default function MovieDetails() {
    const { id } = useParams()
    const { toast } = useToast()
    const { savedMovies, addSavedMovie, removeSavedMovie } = useReservation()

    const [movie, setMovie] = useState(null)
    const [screenings, setScreenings] = useState([])
    const [loading, setLoading] = useState(true)

    const isInWatchlist = movie ? savedMovies.some(m => m.id === movie.id) : false

    /* Fetch movie + screenings on mount / id change */
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const [movieData, screeningsData] = await Promise.all([
                    getMovie(id),
                    getMovieScreenings(id)
                ])
                setMovie(movieData)
                setScreenings(screeningsData)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id])

    /** Toggle the movie in/out of the user's watchlist */
    const handleToggleWatchlist = () => {
        if (isInWatchlist) {
            removeSavedMovie(movie.id)
            toast({ title: "Removed from Watchlist", description: `${movie.title} has been removed from your watchlist.` })
        } else {
            addSavedMovie(movie)
            toast({ title: "Added to Watchlist", description: `${movie.title} has been added to your watchlist.` })
        }
    }

    /** Open the movie's TMDB page in a new tab */
    const handleOpenTmdb = () => {
        if (movie.tmdb_id) {
            window.open(`https://www.themoviedb.org/movie/${movie.tmdb_id}`, '_blank')
        } else {
            window.open(`https://www.themoviedb.org/search?query=${encodeURIComponent(movie.title)}`, '_blank')
        }
    }

    /* Loading skeleton */
    if (loading) {
        return (
            <div className="min-h-screen">
                <div className="relative h-[60vh] bg-muted">
                    <Skeleton className="h-full w-full" />
                </div>
                <div className="container py-8">
                    <Skeleton className="h-8 w-2/3 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            </div>
        )
    }

    /* Movie not found */
    if (!movie) {
        return (
            <div className="container py-16 text-center">
                <h2 className="text-2xl font-bold mb-4">Movie not found</h2>
                <Link to="/movies"><Button>Back to Movies</Button></Link>
            </div>
        )
    }

    const backdropImages = getBackdropImages(movie)

    return (
        <>
            {/* Hero Section */}
            <HeroGallery movie={movie} backdropImages={backdropImages} />

            {/* Content Section */}
            <div className="container py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <ScreeningsCalendar movie={movie} screenings={screenings} />

                        <Separator />

                        {/* Overview */}
                        <div>
                            <h2 className="text-2xl font-bold mb-4">Overview</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                {movie.description || "No description available."}
                            </p>
                        </div>

                        <Separator />

                        <TrailerSection movie={movie} />
                    </div>

                    {/* Sidebar */}
                    <MovieSidebar
                        movie={movie}
                        isInWatchlist={isInWatchlist}
                        onToggleWatchlist={handleToggleWatchlist}
                        onOpenTmdb={handleOpenTmdb}
                    />
                </div>
            </div>
        </>
    )
}
