import { useEffect, useState } from "react"
import { getMovies } from "../api/movies"
import MovieCard from "../components/MovieCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, Filter } from "lucide-react"

function MovieCardSkeleton() {
    return (
        <div className="space-y-3">
            <Skeleton className="aspect-[2/3] w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
        </div>
    )
}

export default function Upcoming() {
    const [movies, setMovies] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedGenre, setSelectedGenre] = useState("all")

    useEffect(() => {
        setLoading(true)
        getMovies()
            .then(data => {
                const filteredMovies = (data.results || []).filter(movie =>
                    movie.status === 'upcoming'
                )
                setMovies(filteredMovies)
            })
            .catch(err => {
                console.error("Failed to fetch movies:", err)
                setMovies([])
            })
            .finally(() => setLoading(false))
    }, [])

    // Get unique genres from movies
    const allGenres = Array.from(new Set(movies.flatMap(movie => movie.genres || [])))

    // Filter movies by selected genre
    const filteredMovies = selectedGenre === "all" ? movies : movies.filter(movie => movie.genres?.includes(selectedGenre))

    // Group movies by month (mock data for demo)
    const groupedByMonth = {}
    const now = new Date()
    const months = ["January", "February", "March", "April", "May", "June"]
    
    filteredMovies.forEach((movie, index) => {
        const monthIdx = index % 6
        const month = months[monthIdx]
        if (!groupedByMonth[month]) {
            groupedByMonth[month] = []
        }
        groupedByMonth[month].push(movie)
    })

    return (
        <>
            <div className="container py-8">
                <div className="flex items-center gap-3 mb-8">
                    <Calendar className="h-8 w-8" />
                    <div>
                        <h1 className="text-4xl font-bold">Upcoming Releases</h1>
                        <p className="text-muted-foreground mt-1">Movies coming soon to theaters</p>
                    </div>
                </div>

                {/* Genre Filter */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filter by Genre
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                            <SelectTrigger className="w-full max-w-xs">
                                <SelectValue placeholder="Select a genre" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Genres</SelectItem>
                                {allGenres.map(genre => (
                                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {/* Calendar View - Upcoming months */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Release Calendar
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                            {months.map((month) => {
                                const movieCount = groupedByMonth[month]?.length || 0
                                return (
                                    <div key={month} className="text-center p-4 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer">
                                        <p className="font-semibold text-lg">{month}</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {movieCount} release{movieCount !== 1 ? "s" : ""}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {loading ? (
                    <div className="space-y-8">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="space-y-4">
                                <Skeleton className="h-8 w-48" />
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                    {Array.from({ length: 6 }).map((_, j) => (
                                        <MovieCardSkeleton key={j} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : movies.length === 0 ? (
                    <div className="text-center py-16">
                        <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No upcoming releases</h3>
                        <p className="text-muted-foreground">Check back later for new announcements.</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {Object.entries(groupedByMonth).map(([month, monthMovies]) => {
                            if (monthMovies.length === 0) return null
                            
                            return (
                                <div key={month}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <h2 className="text-2xl font-bold">{month} {now.getFullYear()}</h2>
                                        <Badge variant="secondary">{monthMovies.length} movies</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                        {monthMovies.map(m => (
                                            <MovieCard key={m.id} movie={m} />
                                        ))}
                                    </div>
                                    {Object.keys(groupedByMonth).indexOf(month) < Object.keys(groupedByMonth).length - 1 && (
                                        <Separator className="mt-12" />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </>
    )
}
