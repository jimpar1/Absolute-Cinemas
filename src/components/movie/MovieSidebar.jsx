/**
 * MovieSidebar – Right column of the MovieDetails page.
 * Contains action buttons (Watchlist, TMDB link), movie info card,
 * and the horizontally-scrollable cast slider.
 */

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, Users, Bookmark, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"

export default function MovieSidebar({ movie, isInWatchlist, onToggleWatchlist, onOpenTmdb }) {
    const castSliderRef = useRef(null)
    const [canScrollCast, setCanScrollCast] = useState(false)

    /* Detect whether the cast list overflows and needs scroll arrows */
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

    return (
        <div className="space-y-4 lg:mt-[48px]">
            {/* Actions Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button
                        className="w-full gap-2"
                        variant={isInWatchlist ? "default" : "outline"}
                        onClick={onToggleWatchlist}
                    >
                        <Bookmark className={`h-4 w-4 ${isInWatchlist ? 'fill-current' : ''}`} />
                        {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                    </Button>
                    <Button className="w-full gap-2" variant="outline" onClick={onOpenTmdb}>
                        <ExternalLink className="h-4 w-4" />
                        View on TMDB
                    </Button>
                </CardContent>
            </Card>

            {/* Movie Info Card */}
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
                            {/* Left Arrow */}
                            {canScrollCast && (
                                <button
                                    onClick={() => castSliderRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
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
                                                    <img src={actor.profile_path} alt={actor.name} className="w-full h-full object-cover" />
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

                            {/* Right Arrow */}
                            {canScrollCast && (
                                <button
                                    onClick={() => castSliderRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
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
    )
}
