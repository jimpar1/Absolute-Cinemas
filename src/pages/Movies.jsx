/**
 * Movies page – Browse all movies with search, genre filters, and tabs.
 *
 * Tabs:
 *   • Now Playing – movies currently in theaters
 *   • Upcoming    – movies coming soon
 *   • Watchlist   – user's saved/bookmarked movies (from ReservationContext)
 *
 * Delegates UI to MovieFilters (search + genre) and MovieGrid (card grid).
 */

import { useEffect, useState } from "react"
import { getMovies } from "@/api/movies"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useReservation } from "@/context/ReservationContext"
import { Film, Play, Calendar, Bookmark } from "lucide-react"

import MovieFilters from "@/components/movies/MovieFilters"
import MovieGrid from "@/components/movies/MovieGrid"

export default function Movies() {
    const [movies, setMovies] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedGenres, setSelectedGenres] = useState([])
    const [showFilters, setShowFilters] = useState(false)
    const [activeTab, setActiveTab] = useState("now-playing")

    const { savedMovies } = useReservation()

    /* Fetch movies on mount */
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const data = await getMovies()
                setMovies(data.results || [])
            } catch (err) {
                console.error("Failed to fetch movies:", err)
                setMovies([])
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    /** Toggle a genre in the selected list */
    const toggleGenre = (genre) => {
        setSelectedGenres(prev =>
            prev.includes(genre)
                ? prev.filter(g => g !== genre)
                : [...prev, genre]
        )
    }

    /** Reset all filters */
    const clearFilters = () => {
        setSearchQuery("")
        setSelectedGenres([])
    }

    /** Apply search + genre filters to a movie list */
    const filterMovies = (movieList) => {
        return movieList.filter(movie => {
            const matchesSearch = searchQuery === "" ||
                movie.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                movie.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                movie.overview?.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesGenre = selectedGenres.length === 0 ||
                selectedGenres.some(genre =>
                    movie.genre?.toLowerCase().includes(genre.toLowerCase())
                )

            return matchesSearch && matchesGenre
        })
    }

    /* Derived filtered lists */
    const nowPlayingMovies = filterMovies(movies.filter(m => m.status === 'now_playing' || !m.status))
    const upcomingMovies = filterMovies(movies.filter(m => m.status === 'upcoming'))
    const watchlistMovies = filterMovies(savedMovies)
    const hasActiveFilters = searchQuery !== "" || selectedGenres.length > 0

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <Film className="h-7 w-7 md:h-8 md:w-8" />
                    <div>
                        <h1 className="text-2xl md:text-4xl font-bold">Movies</h1>
                        <p className="text-sm md:text-base text-muted-foreground">Browse all movies</p>
                    </div>
                </div>
                <Badge variant="secondary" className="self-start sm:self-auto">
                    {movies.length} Movies
                </Badge>
            </div>

            {/* Search & Genre Filters */}
            <MovieFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedGenres={selectedGenres}
                onToggleGenre={toggleGenre}
                onClearGenres={() => setSelectedGenres([])}
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(!showFilters)}
                onClearAll={clearFilters}
            />

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-center mb-6">
                    <TabsList className="grid w-full max-w-2xl grid-cols-3 h-auto">
                        <TabsTrigger value="now-playing" className="gap-1 text-xs sm:text-sm py-2">
                            <Play className="h-3 w-3 sm:h-4 sm:w-4 hidden sm:block" />
                            Now Playing
                        </TabsTrigger>
                        <TabsTrigger value="upcoming" className="gap-1 text-xs sm:text-sm py-2">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 hidden sm:block" />
                            Upcoming
                        </TabsTrigger>
                        <TabsTrigger value="watchlist" className="gap-1 text-xs sm:text-sm py-2">
                            <Bookmark className="h-3 w-3 sm:h-4 sm:w-4 hidden sm:block" />
                            Watchlist
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="now-playing">
                    <div className="mb-4 text-center">
                        <p className="text-muted-foreground">{nowPlayingMovies.length} movies currently in theaters</p>
                    </div>
                    <MovieGrid
                        movies={nowPlayingMovies} loading={loading}
                        emptyIcon={<Play className="h-16 w-16 mx-auto text-muted-foreground mb-4" />}
                        emptyTitle="No movies currently playing"
                        emptyDescription="Check back soon for new releases"
                        hasActiveFilters={hasActiveFilters} onClearFilters={clearFilters}
                    />
                </TabsContent>

                <TabsContent value="upcoming">
                    <div className="mb-4 text-center">
                        <p className="text-muted-foreground">{upcomingMovies.length} movies coming soon</p>
                    </div>
                    <MovieGrid
                        movies={upcomingMovies} loading={loading}
                        emptyIcon={<Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />}
                        emptyTitle="No upcoming movies"
                        emptyDescription="Check back later for future releases"
                        hasActiveFilters={hasActiveFilters} onClearFilters={clearFilters}
                    />
                </TabsContent>

                <TabsContent value="watchlist">
                    <div className="mb-4 text-center">
                        <p className="text-muted-foreground">{watchlistMovies.length} movies in your watchlist</p>
                    </div>
                    <MovieGrid
                        movies={watchlistMovies} loading={loading}
                        emptyIcon={<Bookmark className="h-16 w-16 mx-auto text-muted-foreground mb-4" />}
                        emptyTitle="Your watchlist is empty"
                        emptyDescription="Add movies to your watchlist to see them here"
                        hasActiveFilters={hasActiveFilters} onClearFilters={clearFilters}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
