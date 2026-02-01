/**
 * MovieCard – Displays a single movie as a card with poster, title, rating,
 * duration, status badge, genre, and action buttons (Watchlist / TMDB link).
 * Used in both the Movies and Home page grids.
 */

import { Link } from "react-router-dom"
import { Star, Clock, Play, Users, Image, Bookmark, ExternalLink } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useReservation } from "@/context/ReservationContext"

export default function MovieCard({ movie }) {
    const { savedMovies, addSavedMovie, removeSavedMovie } = useReservation()
    const isInWatchlist = savedMovies.some(m => m.id === movie.id)

    /** Toggle this movie in the user's watchlist, preventing navigation */
    const handleWatchlistClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (isInWatchlist) {
            removeSavedMovie(movie.id)
        } else {
            addSavedMovie(movie)
        }
    }

    /** Open the movie's TMDB page in a new tab, preventing card navigation */
    const handleTmdbClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (movie.tmdb_id) {
            window.open(`https://www.themoviedb.org/movie/${movie.tmdb_id}`, '_blank')
        }
    }

    return (
        <Link to={`/movies/${movie.id}`}>
            <Card className="group overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] duration-300 flex flex-col h-full">
                <div className="relative aspect-[2/3] overflow-hidden bg-muted">
                    {movie.poster_url ? (
                        <img
                            src={movie.poster_url}
                            alt={movie.title}
                            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <Star className="h-12 w-12" />
                        </div>
                    )}
                    {movie.trailer_url && (
                        <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
                            <Play className="h-4 w-4 text-white" />
                        </div>
                    )}
                    {movie.actors && movie.actors.length > 0 && (
                        <div className="absolute bottom-2 left-2 bg-black/50 rounded-full p-1">
                            <Users className="h-4 w-4 text-white" />
                        </div>
                    )}
                    {movie.shots && movie.shots.length > 0 && (
                        <div className="absolute bottom-2 right-2 bg-black/50 rounded-full p-1">
                            <Image className="h-4 w-4 text-white" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <CardContent className="p-4 flex-grow">
                    <h3 className="font-semibold text-base line-clamp-1 mb-2">{movie.title}</h3>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        {movie.rating && (
                            <div className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                <span>{movie.rating}</span>
                            </div>
                        )}
                        {movie.duration && (
                            <div className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{movie.duration} min</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-2">
                        {movie.status && (
                            <Badge variant={movie.status === 'now_playing' ? 'default' : 'secondary'} className="text-xs">
                                {movie.status === 'now_playing' ? 'Now Playing' : 'Upcoming'}
                            </Badge>
                        )}
                        {movie.genre && (
                            <Badge variant="outline" className="text-xs">
                                {movie.genre}
                            </Badge>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 gap-2">
                    <Button
                        variant={isInWatchlist ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={handleWatchlistClick}
                    >
                        <Bookmark className={`h-4 w-4 mr-1 ${isInWatchlist ? 'fill-current' : ''}`} />
                        {isInWatchlist ? 'Saved' : 'Watchlist'}
                    </Button>
                    {movie.tmdb_id && (
                        <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={handleTmdbClick}
                        >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            TMDB
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </Link>
    )
}
