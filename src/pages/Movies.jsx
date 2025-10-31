/*
Αυτή η σελίδα εμφανίζει όλες τις ταινίες με φίλτρα, αναζήτηση και καρτέλες για Now Playing, Upcoming και Watchlist.
*/

import { useEffect, useState } from "react"
import { getMovies } from "../api/movies"
import MovieCard from "../components/MovieCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Film,
    Play,
    Calendar,
    Heart,
    Bookmark,
    Search,
    X,
    SlidersHorizontal
} from "lucide-react"

// Common genre list for filtering
const GENRES = [
    "Action",
    "Adventure",
    "Animation",
    "Comedy",
    "Crime",
    "Documentary",
    "Drama",
    "Family",
    "Fantasy",
    "Horror",
    "Mystery",
    "Romance",
    "Sci-Fi",
    "Thriller",
    "War",
    "Western"
]

function MovieCardSkeleton() {
    return (
        <div className="space-y-3">
            <Skeleton className="aspect-[2/3] w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
        </div>
    )
}

export default function Movies() {
    const [movies, setMovies] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedGenres, setSelectedGenres] = useState([])
    const [showFilters, setShowFilters] = useState(false)
    const [activeTab, setActiveTab] = useState("all")

    // Watchlist and Favorites (would normally come from global state/API)
    const [watchlist] = useState(() => {
        const saved = localStorage.getItem('watchlist')
        return saved ? JSON.parse(saved) : []
    })
    const [favorites] = useState(() => {
        const saved = localStorage.getItem('favorites')
        return saved ? JSON.parse(saved) : []
    })

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

    // Save watchlist/favorites to localStorage
    useEffect(() => {
        localStorage.setItem('watchlist', JSON.stringify(watchlist))
    }, [watchlist])

    useEffect(() => {
        localStorage.setItem('favorites', JSON.stringify(favorites))
    }, [favorites])

    // Toggle genre selection
    const toggleGenre = (genre) => {
        setSelectedGenres(prev =>
            prev.includes(genre)
                ? prev.filter(g => g !== genre)
                : [...prev, genre]
        )
    }

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery("")
        setSelectedGenres([])
    }

    // Filter movies based on search and genres
    const filterMovies = (movieList) => {
        return movieList.filter(movie => {
            // Search filter
            const matchesSearch = searchQuery === "" ||
                movie.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                movie.description?.toLowerCase().includes(searchQuery.toLowerCase())

            // Genre filter
            const matchesGenre = selectedGenres.length === 0 ||
                selectedGenres.some(genre =>
                    movie.genres?.some(g => g.toLowerCase() === genre.toLowerCase())
                )

            return matchesSearch && matchesGenre
        })
    }

    // Get movies by status
    const nowPlayingMovies = filterMovies(movies.filter(m => m.status === 'now_playing' || !m.status))
    const upcomingMovies = filterMovies(movies.filter(m => m.status === 'upcoming'))
    const allMovies = filterMovies(movies)

    // Get watchlist/favorites movies
    const watchlistMovies = filterMovies(movies.filter(m => watchlist.includes(m.id)))
    const favoritesMovies = filterMovies(movies.filter(m => favorites.includes(m.id)))

    const hasActiveFilters = searchQuery !== "" || selectedGenres.length > 0

    const renderMovieGrid = (movieList, emptyIcon, emptyTitle, emptyDescription) => {
        if (loading) {
            return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <MovieCardSkeleton key={i} />
                    ))}
                </div>
            )
        }

        if (movieList.length === 0) {
            return (
                <Card>
                    <CardContent className="py-16 text-center">
                        {emptyIcon}
                        <h3 className="text-xl font-semibold mb-2">{emptyTitle}</h3>
                        <p className="text-muted-foreground mb-4">{emptyDescription}</p>
                        {hasActiveFilters && (
                            <Button variant="outline" onClick={clearFilters}>
                                Clear Filters
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )
        }

        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {movieList.map(movie => (
                    <MovieCard key={movie.id} movie={movie} />
                ))}
            </div>
        )
    }

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

            {/* Search and Filter Bar */}
            <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search movies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-10"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter Toggle Button */}
                    <Button
                        variant={showFilters ? "default" : "outline"}
                        onClick={() => setShowFilters(!showFilters)}
                        className="gap-2"
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                        {selectedGenres.length > 0 && (
                            <Badge variant="secondary" className="ml-1">
                                {selectedGenres.length}
                            </Badge>
                        )}
                    </Button>
                </div>

                {/* Genre Filters */}
                {showFilters && (
                    <Card>
                        <CardContent className="pt-4 pb-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-medium text-sm">Filter by Genre</h3>
                                {selectedGenres.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedGenres([])}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {GENRES.map(genre => (
                                    <Badge
                                        key={genre}
                                        variant={selectedGenres.includes(genre) ? "default" : "outline"}
                                        className="cursor-pointer hover:bg-primary/80 transition-colors"
                                        onClick={() => toggleGenre(genre)}
                                    >
                                        {genre}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Active Filters Display */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground">Active filters:</span>
                        {searchQuery && (
                            <Badge variant="secondary" className="gap-1">
                                Search: "{searchQuery}"
                                <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => setSearchQuery("")}
                                />
                            </Badge>
                        )}
                        {selectedGenres.map(genre => (
                            <Badge key={genre} variant="secondary" className="gap-1">
                                {genre}
                                <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => toggleGenre(genre)}
                                />
                            </Badge>
                        ))}
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Clear all
                        </Button>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-center mb-6">
                    <TabsList className="grid w-full max-w-2xl grid-cols-5 h-auto">
                        <TabsTrigger value="all" className="gap-1 text-xs sm:text-sm py-2">
                            <Film className="h-3 w-3 sm:h-4 sm:w-4 hidden sm:block" />
                            All
                        </TabsTrigger>
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
                        <TabsTrigger value="favorites" className="gap-1 text-xs sm:text-sm py-2">
                            <Heart className="h-3 w-3 sm:h-4 sm:w-4 hidden sm:block" />
                            Favorites
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* All Movies Tab */}
                <TabsContent value="all">
                    <div className="mb-4 text-center">
                        <p className="text-muted-foreground">
                            Showing {allMovies.length} of {movies.length} movies
                        </p>
                    </div>
                    {renderMovieGrid(
                        allMovies,
                        <Film className="h-16 w-16 mx-auto text-muted-foreground mb-4" />,
                        "No movies found",
                        "Try adjusting your search or filters"
                    )}
                </TabsContent>

                {/* Now Playing Tab */}
                <TabsContent value="now-playing">
                    <div className="mb-4 text-center">
                        <p className="text-muted-foreground">
                            {nowPlayingMovies.length} movies currently in theaters
                        </p>
                    </div>
                    {renderMovieGrid(
                        nowPlayingMovies,
                        <Play className="h-16 w-16 mx-auto text-muted-foreground mb-4" />,
                        "No movies currently playing",
                        "Check back soon for new releases"
                    )}
                </TabsContent>

                {/* Upcoming Tab */}
                <TabsContent value="upcoming">
                    <div className="mb-4 text-center">
                        <p className="text-muted-foreground">
                            {upcomingMovies.length} movies coming soon
                        </p>
                    </div>
                    {renderMovieGrid(
                        upcomingMovies,
                        <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />,
                        "No upcoming movies",
                        "Check back later for future releases"
                    )}
                </TabsContent>

                {/* Watchlist Tab */}
                <TabsContent value="watchlist">
                    <div className="mb-4 text-center">
                        <p className="text-muted-foreground">
                            {watchlistMovies.length} movies in your watchlist
                        </p>
                    </div>
                    {renderMovieGrid(
                        watchlistMovies,
                        <Bookmark className="h-16 w-16 mx-auto text-muted-foreground mb-4" />,
                        "Your watchlist is empty",
                        "Add movies to your watchlist to see them here"
                    )}
                </TabsContent>

                {/* Favorites Tab */}
                <TabsContent value="favorites">
                    <div className="mb-4 text-center">
                        <p className="text-muted-foreground">
                            {favoritesMovies.length} favorite movies
                        </p>
                    </div>
                    {renderMovieGrid(
                        favoritesMovies,
                        <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />,
                        "No favorites yet",
                        "Mark movies as favorites to see them here"
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}

