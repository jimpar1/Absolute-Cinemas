import { useEffect, useState } from "react"
import { getMovies } from "../api/movies"
import MovieCard from "../components/MovieCard"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Film } from "lucide-react"

const GENRE_INFO = {
    Action: { icon: "💥", color: "from-red-500 to-orange-500" },
    Comedy: { icon: "😂", color: "from-yellow-500 to-amber-500" },
    Drama: { icon: "🎭", color: "from-blue-500 to-indigo-500" },
    Horror: { icon: "👻", color: "from-purple-500 to-pink-500" },
    "Sci-Fi": { icon: "🚀", color: "from-cyan-500 to-blue-500" },
    Thriller: { icon: "🔪", color: "from-gray-500 to-slate-500" },
    Romance: { icon: "💕", color: "from-pink-500 to-rose-500" },
    Animation: { icon: "🎨", color: "from-green-500 to-emerald-500" },
    Documentary: { icon: "📹", color: "from-teal-500 to-cyan-500" },
}

function MovieCardSkeleton() {
    return (
        <div className="space-y-3">
            <Skeleton className="aspect-[2/3] w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
        </div>
    )
}

export default function Genres() {
    const [movies, setMovies] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedGenre, setSelectedGenre] = useState(null)

    useEffect(() => {
        setLoading(true)
        getMovies()
            .then(data => {
                setMovies(data.results || [])
            })
            .catch(err => {
                console.error("Failed to fetch movies:", err)
                setMovies([])
            })
            .finally(() => setLoading(false))
    }, [])

    // Group movies by genre
    const moviesByGenre = {}
    movies.forEach(movie => {
        const genre = movie.genre || "Other"
        if (!moviesByGenre[genre]) {
            moviesByGenre[genre] = []
        }
        moviesByGenre[genre].push(movie)
    })

    const genres = Object.keys(moviesByGenre).sort()
    const filteredMovies = selectedGenre ? moviesByGenre[selectedGenre] || [] : []

    return (
        <>
            <div className="container py-8">
                <div className="flex items-center gap-3 mb-8">
                    <Star className="h-8 w-8" />
                    <div>
                        <h1 className="text-4xl font-bold">Browse by Genre</h1>
                        <p className="text-muted-foreground mt-1">Explore movies by category</p>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <Skeleton key={i} className="h-32 rounded-xl" />
                        ))}
                    </div>
                ) : genres.length === 0 ? (
                    <div className="text-center py-16">
                        <Film className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No genres available</h3>
                        <p className="text-muted-foreground">Movies will be categorized once added.</p>
                    </div>
                ) : (
                    <>
                        {/* Genre Grid */}
                        {!selectedGenre && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-12">
                                {genres.map(genre => {
                                    const info = GENRE_INFO[genre] || { icon: "🎬", color: "from-gray-500 to-slate-500" }
                                    const count = moviesByGenre[genre]?.length || 0
                                    
                                    return (
                                        <Card
                                            key={genre}
                                            className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 duration-300"
                                            onClick={() => setSelectedGenre(genre)}
                                        >
                                            <CardContent className="p-0">
                                                <div className={`h-32 bg-gradient-to-br ${info.color} flex flex-col items-center justify-center text-white rounded-t-xl`}>
                                                    <span className="text-5xl mb-2">{info.icon}</span>
                                                </div>
                                                <div className="p-4">
                                                    <h3 className="font-semibold text-lg mb-1">{genre}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {count} movie{count !== 1 ? "s" : ""}
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        )}

                        {/* Selected Genre Movies */}
                        {selectedGenre && (
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <button
                                        onClick={() => setSelectedGenre(null)}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        ← Back to genres
                                    </button>
                                </div>
                                <div className="flex items-center gap-3 mb-8">
                                    <h2 className="text-3xl font-bold">{selectedGenre}</h2>
                                    <Badge variant="secondary">
                                        {filteredMovies.length} movie{filteredMovies.length !== 1 ? "s" : ""}
                                    </Badge>
                                </div>
                                {filteredMovies.length === 0 ? (
                                    <div className="text-center py-16">
                                        <Film className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                        <h3 className="text-xl font-semibold mb-2">No movies in this genre</h3>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                        {filteredMovies.map(m => (
                                            <MovieCard key={m.id} movie={m} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    )
}
