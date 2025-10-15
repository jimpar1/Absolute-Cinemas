/*
Αυτή η σελίδα εμφανίζει τις ταινίες που προβάλλονται τώρα στους κινηματογράφους.
*/

import { useEffect, useState } from "react"
import { getMovies } from "../api/movies"
import MovieCard from "../components/MovieCard"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Play, TrendingUp } from "lucide-react"

function MovieCardSkeleton() {
    return (
        <div className="space-y-3">
            <Skeleton className="aspect-[2/3] w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
        </div>
    )
}

export default function NowPlaying() {
    const [movies, setMovies] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const data = await getMovies()
                const filteredMovies = (data.results || []).filter(movie =>
                    movie.status === 'now_playing' || !movie.status
                )
                setMovies(filteredMovies)
            } catch (err) {
                console.error("Failed to fetch movies:", err)
                setMovies([])
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    return (
        <>
            <div className="container py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Play className="h-8 w-8" />
                        <div>
                            <h1 className="text-4xl font-bold">Now Playing</h1>
                            <p className="text-muted-foreground mt-1">Currently showing in theaters</p>
                        </div>
                    </div>
                    <Badge variant="secondary" className="gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Live
                    </Badge>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <MovieCardSkeleton key={i} />
                        ))}
                    </div>
                ) : movies.length === 0 ? (
                    <div className="text-center py-16">
                        <Play className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No movies currently playing</h3>
                        <p className="text-muted-foreground">Check back soon for new releases.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {movies.map(m => (
                            <MovieCard key={m.id} movie={m} />
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}
