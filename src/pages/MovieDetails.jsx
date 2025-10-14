import { useParams, Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { getMovie, getMovieScreenings } from "../api/movies"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Star, Clock, Calendar, Heart, Plus } from "lucide-react"

export default function MovieDetails() {
    const { id } = useParams()
    const { toast } = useToast()
    const [movie, setMovie] = useState(null)
    const [screenings, setScreenings] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        Promise.all([
            getMovie(id).then(setMovie),
            getMovieScreenings(id).then(setScreenings)
        ]).finally(() => setLoading(false))
    }, [id])

    const handleAddToWatchlist = () => {
        toast({
            title: "Added to Watchlist",
            description: `${movie.title} has been added to your watchlist.`,
        })
    }

    const handleAddToFavorites = () => {
        toast({
            title: "Added to Favorites",
            description: `${movie.title} has been added to your favorites.`,
        })
    }

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

    if (!movie) {
        return (
            <div className="container py-16 text-center">
                <h2 className="text-2xl font-bold mb-4">Movie not found</h2>
                <Link to="/movies">
                    <Button>Back to Movies</Button>
                </Link>
            </div>
        )
    }

    return (
        <>
            {/* Hero Section with Backdrop */}
            <div className="relative h-[60vh] overflow-hidden">
                {movie.poster_url ? (
                    <>
                        <div 
                            className="absolute inset-0 bg-cover bg-center blur-sm scale-110"
                            style={{ backgroundImage: `url(${movie.poster_url})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
                    </>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background" />
                )}
                
                <div className="relative container h-full flex items-end pb-12">
                    <div className="flex flex-col md:flex-row gap-8 items-end">
                        {movie.poster_url && (
                            <img 
                                src={movie.poster_url} 
                                alt={movie.title}
                                className="w-48 md:w-64 rounded-lg shadow-2xl"
                            />
                        )}
                        <div className="flex-1 pb-4">
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">{movie.title}</h1>
                            <div className="flex flex-wrap gap-3 items-center">
                                {movie.rating && (
                                    <div className="flex items-center gap-1.5">
                                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                        <span className="text-lg font-semibold">{movie.rating}</span>
                                    </div>
                                )}
                                {movie.duration && (
                                    <Badge variant="secondary" className="gap-1">
                                        <Clock className="h-3 w-3" />
                                        {movie.duration} min
                                    </Badge>
                                )}
                                {movie.status && (
                                    <Badge variant={movie.status === 'now_playing' ? 'default' : 'secondary'}>
                                        {movie.status === 'now_playing' ? 'Now Playing' : 'Upcoming'}
                                    </Badge>
                                )}
                                {movie.genre && (
                                    <Badge variant="outline">{movie.genre}</Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold mb-4">Overview</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                {movie.description || "No description available."}
                            </p>
                        </div>

                        <Separator />

                        <div>
                            <h2 className="text-2xl font-bold mb-4">Screenings</h2>
                            {movie.status === 'upcoming' ? (
                                <Card>
                                    <CardContent className="py-8 text-center">
                                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                                        <p className="text-muted-foreground mb-4">This movie is upcoming. Get notified when tickets are available.</p>
                                        <Button variant="outline">Notify Me</Button>
                                    </CardContent>
                                </Card>
                            ) : screenings.length === 0 ? (
                                <Card>
                                    <CardContent className="py-8 text-center text-muted-foreground">
                                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No screenings available at this time.</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-3">
                                    {screenings.map(s => (
                                        <Card key={s.id} className="hover:shadow-md transition-shadow">
                                            <CardContent className="flex items-center justify-between p-4">
                                                <div className="flex items-center gap-3">
                                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                                    <div>
                                                        <p className="font-medium">
                                                            {new Date(s.start_time).toLocaleDateString('en-US', { 
                                                                weekday: 'short', 
                                                                month: 'short', 
                                                                day: 'numeric' 
                                                            })}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {new Date(s.start_time).toLocaleTimeString('en-US', { 
                                                                hour: '2-digit', 
                                                                minute: '2-digit' 
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Link to={`/booking/${s.id}`}>
                                                    <Button size="sm">Book Now</Button>
                                                </Link>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button 
                                    className="w-full gap-2" 
                                    variant="outline"
                                    onClick={handleAddToWatchlist}
                                >
                                    <Heart className="h-4 w-4" />
                                    Add to Watchlist
                                </Button>
                                <Button 
                                    className="w-full gap-2" 
                                    variant="outline"
                                    onClick={handleAddToFavorites}
                                >
                                    <Plus className="h-4 w-4" />
                                    Add to Favorites
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Movie Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {movie.duration && (
                                    <div>
                                        <p className="text-muted-foreground">Runtime</p>
                                        <p className="font-medium">{movie.duration} minutes</p>
                                    </div>
                                )}
                                {movie.genre && (
                                    <div>
                                        <p className="text-muted-foreground">Genre</p>
                                        <p className="font-medium">{movie.genre}</p>
                                    </div>
                                )}
                                {movie.rating && (
                                    <div>
                                        <p className="text-muted-foreground">Rating</p>
                                        <div className="flex items-center gap-1">
                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                            <p className="font-medium">{movie.rating}/10</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    )
}
