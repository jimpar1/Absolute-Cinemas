/*
Αυτή η σελίδα είναι η αρχική σελίδα της εφαρμογής με hero section και λίστα ταινιών.
*/

import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Film, Calendar, Play, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getMovies } from '../api/movies'
import MovieCard from '../components/MovieCard'
import styles from './Home.module.css'

import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCoverflow, Pagination, Navigation, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

export default function Home() {

    const heroBg = '/absulute-cinema.webp'
    const [movies, setMovies] = useState([])

    useEffect(() => {
        getMovies()
            .then((data) => setMovies(data?.results || []))
            .catch((err) => console.error('Failed to fetch movies:', err))
    }, [])

    return (
        <>
            {/* === HERO SECTION — FULL IMAGE WITH TEXT & LOGO AT BOTTOM === */}
            <section
                className={styles.heroSection}
                style={{ backgroundImage: `url(${heroBg})` }}
            >
                <div className={styles.heroContent}>
                    <img src="/logo.webp" className={styles.heroLogo} alt="Absolute Cinema" />

                    <div className={styles.heroText}>
                        <h1>Welcome to Absolute Cinemas</h1>
                        <p>Book FAKE tickets at the best FAKE cinemas.</p>

                        <Link to="/now-playing">
                            <Button size="lg" className="gap-2 mt-4">
                                <Film className="h-5 w-5" />
                                Browse Movies
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* === SLIDER SECTION === */}
            <section className={styles.sliderSection}>
                {movies.length > 0 && (
                    <div className="w-full flex justify-center px-4">
                        <div className="w-full max-w-5xl">
                            <Swiper
                                effect="coverflow"
                                grabCursor={true}
                                centeredSlides={true}
                                loop={movies.length > 3}
                                slidesPerView="auto"
                                coverflowEffect={{
                                    rotate: 35,
                                    stretch: 0,
                                    depth: 180,
                                    modifier: 1,
                                    slideShadows: true,
                                }}
                                pagination={{ clickable: true }}
                                navigation={true}
                                autoplay={{
                                    delay: 5000,
                                    disableOnInteraction: false,
                                    pauseOnMouseEnter: true,
                                }}
                                speed={600}
                                modules={[EffectCoverflow, Pagination, Navigation, Autoplay]}
                            >
                                {movies.map((movie) => (
                                    <SwiperSlide key={movie.id}>
                                        <Link to={`/movies/${movie.id}`} className="block w-full h-full">
                                            <div className="relative w-full h-full rounded-xl overflow-hidden shadow-xl transition-transform duration-300 hover:scale-105">
                                                <img
                                                    src={movie.poster_url}
                                                    alt={movie.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent flex items-end px-3 pb-2">
                                                    <p className="text-xs md:text-sm text-white truncate">
                                                        {movie.title}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    </div>
                )}
            </section>

            {/* === FEATURES SECTION === */}
            <section className={styles.featuresSection}>
                <div className="container py-16">
                    <Tabs defaultValue="now-playing" className="w-full">
                        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
                            <TabsTrigger value="now-playing" className="gap-2">
                                <Play className="h-4 w-4" />
                                Now Playing
                            </TabsTrigger>
                            <TabsTrigger value="upcoming" className="gap-2">
                                <Calendar className="h-4 w-4" />
                                Upcoming
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="now-playing">
                            <div className="mb-6 text-center">
                                <h2 className="text-2xl font-bold mb-2">Now Playing</h2>
                                <p className="text-muted-foreground">Check out what's currently showing in theaters</p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                {movies.filter(movie => movie.status === 'now_playing' || !movie.status).map(movie => (
                                    <MovieCard key={movie.id} movie={movie} />
                                ))}
                            </div>
                            <div className="text-center mt-8">
                                <Link to="/now-playing">
                                    <Button variant="outline">View All Now Playing</Button>
                                </Link>
                            </div>
                        </TabsContent>

                        <TabsContent value="upcoming">
                            <div className="mb-6 text-center">
                                <h2 className="text-2xl font-bold mb-2">Upcoming Releases</h2>
                                <p className="text-muted-foreground">See what movies are coming soon</p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                {movies.filter(movie => movie.status === 'upcoming').map(movie => (
                                    <MovieCard key={movie.id} movie={movie} />
                                ))}
                            </div>
                            <div className="text-center mt-8">
                                <Link to="/upcoming">
                                    <Button variant="outline">View All Upcoming</Button>
                                </Link>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="mt-16 flex justify-center">
                        <Link to="/screenings">
                            <Card className="transition-all hover:shadow-lg hover:scale-105 duration-300 flex flex-col h-48 w-full max-w-sm">
                                <CardHeader className="flex-grow">
                                    <Film className="h-10 w-10 mb-2 text-primary" />
                                    <CardTitle>Book Screening</CardTitle>
                                    <CardDescription>Reserve your seats for upcoming shows</CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                    </div>
                </div>
            </section>


        </>
    )
}
