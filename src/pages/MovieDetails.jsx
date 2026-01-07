/*
Αυτή η σελίδα εμφανίζει τις λεπτομέρειες μιας ταινίας, συμπεριλαμβανομένων πληροφοριών και προβολών.
*/

import { useParams, Link } from "react-router-dom"
import { useEffect, useState, useRef } from "react"
import { getMovie, getMovieScreenings } from "../api/movies"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Star, Clock, Calendar, Play, Users, Image, ChevronLeft, ChevronRight, CalendarDays, CalendarRange, Bookmark, ExternalLink } from "lucide-react"
import { useReservation } from "@/context/ReservationContext"

export default function MovieDetails() {
    const { id } = useParams()
    const { toast } = useToast()
    const { savedMovies, addSavedMovie, removeSavedMovie } = useReservation()
    const [movie, setMovie] = useState(null)
    const [screenings, setScreenings] = useState([])
    const [loading, setLoading] = useState(true)
    const [currentSlide, setCurrentSlide] = useState(0)
    const [calendarView, setCalendarView] = useState('weekly') // 'weekly' or 'monthly'
    const [selectedDate, setSelectedDate] = useState(null) // For the screening modal
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        const today = new Date()
        const day = today.getDay()
        const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Monday start
        return new Date(today.setDate(diff))
    })
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const castSliderRef = useRef(null)
    const [canScrollCast, setCanScrollCast] = useState(false)

    const isInWatchlist = movie ? savedMovies.some(m => m.id === movie.id) : false

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const [movieData, screeningsData] = await Promise.all([
                    getMovie(id),
                    getMovieScreenings(id)
                ])
                console.log("Movie data from API:", movieData)
                console.log("trailer_url:", movieData.trailer_url)
                console.log("shots (original URLs):", movieData.shots)
                console.log("actors:", movieData.actors)
                setMovie(movieData)
                setScreenings(screeningsData)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id])

    const handleToggleWatchlist = () => {
        if (isInWatchlist) {
            removeSavedMovie(movie.id)
            toast({
                title: "Removed from Watchlist",
                description: `${movie.title} has been removed from your watchlist.`,
            })
        } else {
            addSavedMovie(movie)
            toast({
                title: "Added to Watchlist",
                description: `${movie.title} has been added to your watchlist.`,
            })
        }
    }

    const handleOpenTmdb = () => {
        if (movie.tmdb_id) {
            window.open(`https://www.themoviedb.org/movie/${movie.tmdb_id}`, '_blank')
        } else {
            // Fallback to search if no tmdb_id
            window.open(`https://www.themoviedb.org/search?query=${encodeURIComponent(movie.title)}`, '_blank')
        }
    }

    const getYouTubeVideoId = (url) => {
        if (!url) return null;
        const regExp = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
        const match = url.match(regExp);
        return match ? match[1] : null;
    }

    // Upgrade TMDB image URL to highest quality (original size)
    const getHighQualityImage = (url) => {
        if (!url) return url;
        // TMDB URLs: https://image.tmdb.org/t/p/w500/xxxxx.jpg
        // Replace w200, w300, w500, w780, w1280 with original
        if (url.includes('image.tmdb.org')) {
            return url.replace(/\/t\/p\/w\d+\//, '/t/p/original/');
        }
        return url;
    }

    // Get all backdrop images (shots + poster as fallback) in HIGH QUALITY
    const getBackdropImages = () => {
        if (movie?.shots && movie.shots.length > 0) {
            return movie.shots.map(shot => getHighQualityImage(shot));
        }
        return movie?.poster_url ? [getHighQualityImage(movie.poster_url)] : [];
    }

    const backdropImages = movie ? getBackdropImages() : [];

    const nextSlide = () => {
        if (backdropImages.length > 0) {
            setCurrentSlide((prev) => (prev + 1) % backdropImages.length);
        }
    }

    const prevSlide = () => {
        if (backdropImages.length > 0) {
            setCurrentSlide((prev) => (prev - 1 + backdropImages.length) % backdropImages.length);
        }
    }

    // Calendar helper functions
    const getWeekDays = () => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(currentWeekStart);
            day.setDate(currentWeekStart.getDate() + i);
            days.push(day);
        }
        return days;
    }

    const getMonthDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        // Add empty slots for days before the first day of the month
        const startPadding = (firstDay.getDay() + 6) % 7; // Adjust for Monday start
        for (let i = 0; i < startPadding; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    }

    const getScreeningsForDate = (date) => {
        if (!date) return [];
        return screenings.filter(s => {
            const screeningDate = new Date(s.start_time);
            return screeningDate.toDateString() === date.toDateString();
        });
    }

    const isToday = (date) => {
        if (!date) return false;
        return date.toDateString() === new Date().toDateString();
    }

    const navigateWeek = (direction) => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(currentWeekStart.getDate() + (direction * 7));
        setCurrentWeekStart(newDate);
    }

    const navigateMonth = (direction) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(currentMonth.getMonth() + direction);
        setCurrentMonth(newDate);
    }

    // Auto-slide every 5.5 seconds
    useEffect(() => {
        if (backdropImages.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % backdropImages.length);
        }, 7000);

        return () => clearInterval(interval);
    }, [backdropImages.length])

    // Check if cast slider needs scroll arrows
    useEffect(() => {
        const checkScroll = () => {
            if (castSliderRef.current) {
                const { scrollWidth, clientWidth } = castSliderRef.current;
                setCanScrollCast(scrollWidth > clientWidth);
            }
        };

        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [movie?.actors])

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
            {/* Hero Section with Gallery Slider Backdrop */}
            <div className="relative h-[70vh] overflow-hidden">
                {/* Gallery Slider Background */}
                {backdropImages.length > 0 ? (
                    <>
                        {backdropImages.map((image, index) => (
                            <div
                                key={index}
                                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                                }`}
                            >
                                <img
                                    src={image}
                                    alt={`${movie.title} - Scene ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />

                        {/* Slider Controls */}
                        {backdropImages.length > 1 && (
                            <>
                                <button
                                    onClick={prevSlide}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all hover:scale-110"
                                    aria-label="Previous slide"
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </button>
                                <button
                                    onClick={nextSlide}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all hover:scale-110"
                                    aria-label="Next slide"
                                >
                                    <ChevronRight className="h-6 w-6" />
                                </button>

                                {/* Slide Indicators */}
                                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                                    {backdropImages.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentSlide(index)}
                                            className={`w-3 h-3 rounded-full transition-all ${
                                                index === currentSlide 
                                                    ? 'bg-white scale-110' 
                                                    : 'bg-white/50 hover:bg-white/70'
                                            }`}
                                            aria-label={`Go to slide ${index + 1}`}
                                        />
                                    ))}
                                </div>

                                {/* Slide Counter */}
                                <div className="absolute top-4 right-4 z-20 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                    <Image className="h-4 w-4" />
                                    {currentSlide + 1} / {backdropImages.length}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background" />
                )}
                
                {/* Movie Poster and Title at Bottom */}
                <div className="absolute bottom-6 left-0 right-0 z-10">
                    <div className="container flex flex-col md:flex-row items-end md:items-center gap-6">
                        {movie.poster_url && (
                            <img
                                src={movie.poster_url}
                                alt={movie.title}
                                className="w-32 md:w-48 rounded-lg shadow-2xl border-2 border-white/20"
                            />
                        )}
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold drop-shadow-lg text-white flex-1 text-center md:text-left">{movie.title}</h1>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold">Screenings</h2>
                                {screenings.length > 0 && movie.status !== 'upcoming' && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant={calendarView === 'weekly' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setCalendarView('weekly')}
                                            className="gap-2"
                                        >
                                            <CalendarDays className="h-4 w-4" />
                                            Weekly
                                        </Button>
                                        <Button
                                            variant={calendarView === 'monthly' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setCalendarView('monthly')}
                                            className="gap-2"
                                        >
                                            <CalendarRange className="h-4 w-4" />
                                            Monthly
                                        </Button>
                                    </div>
                                )}
                            </div>
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
                            ) : calendarView === 'weekly' ? (
                                /* Weekly Calendar View */
                                <Card>
                                    <CardContent className="p-4">
                                        {/* Week Navigation */}
                                        <div className="flex items-center justify-between mb-4">
                                            <Button variant="ghost" size="sm" onClick={() => navigateWeek(-1)}>
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <span className="font-medium">
                                                {currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {
                                                    (() => {
                                                        const endDate = new Date(currentWeekStart);
                                                        endDate.setDate(currentWeekStart.getDate() + 6);
                                                        return endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                                    })()
                                                }
                                            </span>
                                            <Button variant="ghost" size="sm" onClick={() => navigateWeek(1)}>
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* Week Days Grid */}
                                        <div className="grid grid-cols-7 gap-2">
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                                                    {day}
                                                </div>
                                            ))}
                                            {getWeekDays().map((date, index) => {
                                                const dayScreenings = getScreeningsForDate(date);
                                                const hasScreenings = dayScreenings.length > 0;
                                                return (
                                                    <div
                                                        key={index}
                                                        onClick={() => hasScreenings && setSelectedDate(date)}
                                                        className={`min-h-[80px] p-2 rounded-lg border transition-all ${
                                                            hasScreenings ? 'cursor-pointer' : ''
                                                        } ${
                                                            isToday(date) 
                                                                ? 'border-primary bg-primary/10' 
                                                                : hasScreenings 
                                                                    ? 'border-border bg-card hover:bg-accent hover:scale-[1.02]' 
                                                                    : 'border-border/50 bg-muted/30'
                                                        }`}
                                                    >
                                                        <div className={`text-sm font-medium mb-1 ${isToday(date) ? 'text-primary' : ''}`}>
                                                            {date.getDate()}
                                                        </div>
                                                        {hasScreenings && (
                                                            <div className="flex flex-col items-center gap-1">
                                                                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                                                                <span className="text-xs text-muted-foreground">
                                                                    {dayScreenings.length} show{dayScreenings.length > 1 ? 's' : ''}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                /* Monthly Calendar View */
                                <Card>
                                    <CardContent className="p-4">
                                        {/* Month Navigation */}
                                        <div className="flex items-center justify-between mb-4">
                                            <Button variant="ghost" size="sm" onClick={() => navigateMonth(-1)}>
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <span className="font-medium">
                                                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                            </span>
                                            <Button variant="ghost" size="sm" onClick={() => navigateMonth(1)}>
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* Month Days Grid */}
                                        <div className="grid grid-cols-7 gap-1">
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                                                    {day}
                                                </div>
                                            ))}
                                            {getMonthDays().map((date, index) => {
                                                if (!date) {
                                                    return <div key={index} className="min-h-[60px]" />;
                                                }
                                                const dayScreenings = getScreeningsForDate(date);
                                                const hasScreenings = dayScreenings.length > 0;
                                                return (
                                                    <div
                                                        key={index}
                                                        onClick={() => hasScreenings && setSelectedDate(date)}
                                                        className={`min-h-[60px] p-1 rounded-lg border transition-all ${
                                                            hasScreenings ? 'cursor-pointer' : ''
                                                        } ${
                                                            isToday(date) 
                                                                ? 'border-primary bg-primary/10' 
                                                                : hasScreenings 
                                                                    ? 'border-border bg-card hover:bg-accent hover:scale-[1.02]' 
                                                                    : 'border-border/50 bg-muted/30'
                                                        }`}
                                                    >
                                                        <div className={`text-xs font-medium mb-1 ${isToday(date) ? 'text-primary' : ''}`}>
                                                            {date.getDate()}
                                                        </div>
                                                        {hasScreenings && (
                                                            <div className="flex flex-col items-center">
                                                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                                                <span className="text-[10px] text-muted-foreground">
                                                                    {dayScreenings.length}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <Separator />

                        <div>
                            <h2 className="text-2xl font-bold mb-4">Overview</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                {movie.description || "No description available."}
                            </p>
                        </div>

                        {/* Trailer Section */}
                        <Separator />
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Play className="h-6 w-6 text-primary" />
                                <h2 className="text-2xl font-bold">Trailer</h2>
                            </div>
                            {movie.trailer_url ? (
                                <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(movie.trailer_url)}`}
                                        title={`${movie.title} Trailer`}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="w-full h-full"
                                    ></iframe>
                                </div>
                            ) : (
                                <Card>
                                    <CardContent className="py-8 text-center text-muted-foreground">
                                        <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No trailer available for this movie.</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4 lg:mt-[48px]">
                        <Card>
                            <CardHeader>
                                <CardTitle>Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button 
                                    className="w-full gap-2" 
                                    variant={isInWatchlist ? "default" : "outline"}
                                    onClick={handleToggleWatchlist}
                                >
                                    <Bookmark className={`h-4 w-4 ${isInWatchlist ? 'fill-current' : ''}`} />
                                    {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                                </Button>
                                <Button
                                    className="w-full gap-2"
                                    variant="outline"
                                    onClick={handleOpenTmdb}
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    View on TMDB
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

                        {/* Cast Section with Horizontal Slider */}
                        <Card className="overflow-visible">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Cast
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="overflow-visible">
                                {movie.actors && movie.actors.length > 0 ? (
                                    <div className="flex items-center gap-3 overflow-visible">
                                        {/* Left Arrow - only show if scrollable */}
                                        {canScrollCast && (
                                            <button
                                                onClick={() => {
                                                    if (castSliderRef.current) castSliderRef.current.scrollBy({ left: -200, behavior: 'smooth' });
                                                }}
                                                className="flex-shrink-0 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition-all hover:scale-110 z-10"
                                                aria-label="Scroll left"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>
                                        )}

                                        {/* Cast Slider */}
                                        <div ref={castSliderRef} className="flex gap-4 overflow-x-auto overflow-y-visible py-2 scrollbar-hide scroll-smooth flex-1 -mx-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                            <div className="w-2 flex-shrink-0"></div>
                                            {movie.actors.map((actor, index) => (
                                                <div key={index} className="flex-shrink-0 w-20 group py-2">
                                                    <div className="text-center">
                                                        <div className="aspect-square rounded-full overflow-hidden bg-muted mb-2 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20 relative">
                                                            {actor.profile_path ? (
                                                                <img
                                                                    src={actor.profile_path}
                                                                    alt={actor.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <Users className="h-6 w-6 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                            {/* Name overlay on hover */}
                                                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-1">
                                                                <p className="font-medium text-[10px] text-white text-center line-clamp-2">{actor.name}</p>
                                                                {actor.character && (
                                                                    <p className="text-[9px] text-white/70 text-center line-clamp-1 mt-0.5">{actor.character}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="w-2 flex-shrink-0"></div>
                                        </div>

                                        {/* Right Arrow - only show if scrollable */}
                                        {canScrollCast && (
                                            <button
                                                onClick={() => {
                                                    if (castSliderRef.current) castSliderRef.current.scrollBy({ left: 200, behavior: 'smooth' });
                                                }}
                                                className="flex-shrink-0 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition-all hover:scale-110 z-10"
                                                aria-label="Scroll right"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center text-muted-foreground py-4">
                                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No cast info available.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Screenings Modal */}
            <Dialog open={selectedDate !== null} onOpenChange={(open) => !open && setSelectedDate(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Screenings for {selectedDate?.toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 mt-4">
                        {selectedDate && getScreeningsForDate(selectedDate).map(screening => (
                            <Card key={screening.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                            <Clock className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-lg">
                                                {new Date(screening.start_time).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                            {screening.hall_name && (
                                                <p className="text-sm text-muted-foreground">
                                                    {screening.hall_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <Link to={`/booking/${screening.id}`}>
                                        <Button size="sm" className="gap-2">
                                            Book Now
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
