/**
 * HeroGallery – Full-height backdrop image slider with navigation arrows and dot indicators.
 * Displayed at the top of the MovieDetails page. Auto-advances every 7 seconds.
 */

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Image } from "lucide-react"

export default function HeroGallery({ movie, backdropImages }) {
    const [currentSlide, setCurrentSlide] = useState(0)

    /** Move to the next slide (wraps around). */
    const nextSlide = () => {
        if (backdropImages.length > 0) {
            setCurrentSlide((prev) => (prev + 1) % backdropImages.length)
        }
    }

    /** Move to the previous slide (wraps around). */
    const prevSlide = () => {
        if (backdropImages.length > 0) {
            setCurrentSlide((prev) => (prev - 1 + backdropImages.length) % backdropImages.length)
        }
    }

    /* Auto-slide every 7 seconds */
    useEffect(() => {
        if (backdropImages.length <= 1) return
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % backdropImages.length)
        }, 7000)
        return () => clearInterval(interval)
    }, [backdropImages.length])

    return (
        <div className="relative h-[70vh] overflow-hidden">
            {/* Gallery Slider Background */}
            {backdropImages.length > 0 ? (
                <>
                    {backdropImages.map((image, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'
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
                                        className={`w-3 h-3 rounded-full transition-all ${index === currentSlide
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
    )
}
