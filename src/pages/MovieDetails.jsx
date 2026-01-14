/**
 * MovieDetails page – Shows full movie information.
 *
 * Cinematic additions (GSAP):
 *   • Film grain overlay (CSS, fixed)
 *   • Projector iris open (clip-path inset collapse) on movie load
 *   • Letterbox bars slide away
 *   • Movie title char-by-char drop-in
 *   • Rating slot-machine counter
 *   • Genre badge stagger
 *   • Hero parallax on scroll
 *   • Section headings spotlight sweep (ScrollTrigger)
 *   • Overview fade-up (ScrollTrigger)
 *   • Trailer clip-path wipe (ScrollTrigger)
 *   • Sidebar slide-in from right (ScrollTrigger)
 *
 * Composed from smaller components:
 *   - HeroGallery      → backdrop image slider
 *   - ScreeningsCalendar → weekly / monthly screening calendar + modal
 *   - TrailerSection    → embedded YouTube trailer
 *   - MovieSidebar      → actions, info card, cast slider
 */

import { useParams, Link } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import { getMovie, getMovieScreenings } from "@/api/movies"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useReservation } from "@/context/ReservationContext"
import { getBackdropImages } from "@/utils/image"

import HeroGallery from "@/components/movie/HeroGallery"
import ScreeningsCalendar from "@/components/movie/ScreeningsCalendar"
import TrailerSection from "@/components/movie/TrailerSection"
import MovieSidebar from "@/components/movie/MovieSidebar"
import SplitChars from '../components/SplitChars'
import styles from './MovieDetails.module.css'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

export default function MovieDetails() {
    const { id } = useParams()
    const { toast } = useToast()
    const { savedMovies, addSavedMovie, removeSavedMovie } = useReservation()

    const [movie, setMovie] = useState(null)
    const [screenings, setScreenings] = useState([])
    const [loading, setLoading] = useState(true)

    const isInWatchlist = movie ? savedMovies.some(m => m.id === movie.id) : false

    // GSAP refs
    const heroWrapRef        = useRef(null)
    const movieTitleRef      = useRef(null)
    const ratingNumRef       = useRef(null)
    const genresRef          = useRef(null)
    const sectionHeadingRefs = useRef([])
    const overviewRef        = useRef(null)
    const trailerRef         = useRef(null)
    const sidebarRef         = useRef(null)

    /* Fetch movie + screenings on mount / id change */
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const [movieData, screeningsData] = await Promise.all([
                    getMovie(id),
                    getMovieScreenings(id)
                ])
                setMovie(movieData)
                setScreenings(screeningsData)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id])

    // ─── Lenis smooth scroll ──────────────────────────────────────
    useEffect(() => {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (prefersReduced) return

        const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
        let running = true
        const raf = (time) => {
            if (!running) return
            lenis.raf(time)
            requestAnimationFrame(raf)
        }
        requestAnimationFrame(raf)
        lenis.on('scroll', ScrollTrigger.update)
        gsap.ticker.lagSmoothing(0)
        return () => { running = false; lenis.destroy() }
    }, [])

    // ─── Curve swipe + hero intro (runs once movie data arrives) ─
    useEffect(() => {
        if (!movie) return

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (prefersReduced) return

        const chars = movieTitleRef.current?.querySelectorAll(`.${styles.char}`) || []
        const genreBadges = genresRef.current?.children ? [...genresRef.current.children] : []

        const ctx = gsap.context(() => {
            // Set initial states
            gsap.set(movieTitleRef.current, { clipPath: 'inset(0 105% 0 0 round 0 120px 120px 0)' })
            if (chars.length) gsap.set(chars, { y: 28, opacity: 0 })

            const tl = gsap.timeline({ delay: 0.1 })

            // 1. Curve swipe reveals the title left → right with rounded trailing edge
            tl.to(movieTitleRef.current, {
                clipPath: 'inset(0 0% 0 0 round 0 0px 0px 0)',
                duration: 0.9,
                ease: 'power2.inOut',
            })

            // 2. Chars rise up during the tail of the swipe
            if (chars.length) {
                tl.to(
                    chars,
                    { y: 0, opacity: 1, duration: 0.45, stagger: 0.035, ease: 'power3.out' },
                    '-=0.55'
                )
            }

            // 3. Rating slot-machine counter
            if (ratingNumRef.current && movie.vote_average != null) {
                const obj = { val: 0 }
                tl.to(
                    obj,
                    {
                        val: movie.vote_average,
                        duration: 1.2,
                        ease: 'power2.out',
                        onUpdate: () => {
                            if (ratingNumRef.current) {
                                ratingNumRef.current.textContent = obj.val.toFixed(1)
                            }
                        },
                    },
                    '-=0.3'
                )
            }

            // 4. Genre badges stagger in from the left
            if (genreBadges.length) {
                tl.fromTo(
                    genreBadges,
                    { x: -16, opacity: 0 },
                    { x: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power3.out' },
                    '-=0.9'
                )
            }
        })

        return () => ctx.revert()
    }, [movie])

    // ─── Hero parallax ────────────────────────────────────────────
    useEffect(() => {
        if (!movie) return

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (prefersReduced) return

        const ctx = gsap.context(() => {
            gsap.to(heroWrapRef.current, {
                backgroundPositionY: '40%',
                ease: 'none',
                scrollTrigger: {
                    trigger: heroWrapRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true,
                },
            })
        })
        return () => ctx.revert()
    }, [movie])

    // ─── Scroll reveals (section headings, overview, trailer, sidebar) ──
    useEffect(() => {
        if (!movie) return

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (prefersReduced) return

        const ctx = gsap.context(() => {
            // Section headings: spotlight sweep on scroll
            sectionHeadingRefs.current.forEach((el) => {
                if (!el) return
                gsap.fromTo(
                    el,
                    { '--spotlight-x': '-120%' },
                    {
                        '--spotlight-x': '120%',
                        duration: 1.2,
                        ease: 'power2.inOut',
                        scrollTrigger: {
                            trigger: el,
                            start: 'top 80%',
                            toggleActions: 'play none none reset',
                        },
                    }
                )
            })

            // Overview paragraph fade up
            if (overviewRef.current) {
                gsap.fromTo(
                    overviewRef.current,
                    { y: 20, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        duration: 0.7,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: overviewRef.current,
                            start: 'top 82%',
                            toggleActions: 'play none none reset',
                        },
                    }
                )
            }

            // Trailer: clip-path wipe left → right
            if (trailerRef.current) {
                gsap.fromTo(
                    trailerRef.current,
                    { clipPath: 'inset(0 100% 0 0 round 8px)' },
                    {
                        clipPath: 'inset(0 0% 0 0 round 8px)',
                        duration: 1.0,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: trailerRef.current,
                            start: 'top 80%',
                            toggleActions: 'play none none reset',
                        },
                    }
                )
            }

            // Sidebar slides in from the right
            if (sidebarRef.current) {
                gsap.fromTo(
                    sidebarRef.current,
                    { x: 40, opacity: 0 },
                    {
                        x: 0,
                        opacity: 1,
                        duration: 0.8,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: sidebarRef.current,
                            start: 'top 75%',
                            toggleActions: 'play none none reset',
                        },
                    }
                )
            }
        })

        return () => ctx.revert()
    }, [movie])

    /** Toggle the movie in/out of the user's watchlist */
    const handleToggleWatchlist = () => {
        if (isInWatchlist) {
            removeSavedMovie(movie.id)
            toast({ title: "Removed from Watchlist", description: `${movie.title} has been removed from your watchlist.` })
        } else {
            addSavedMovie(movie)
            toast({ title: "Added to Watchlist", description: `${movie.title} has been added to your watchlist.` })
        }
    }

    /** Open the movie's TMDB page in a new tab */
    const handleOpenTmdb = () => {
        if (movie.tmdb_id) {
            window.open(`https://www.themoviedb.org/movie/${movie.tmdb_id}`, '_blank')
        } else {
            window.open(`https://www.themoviedb.org/search?query=${encodeURIComponent(movie.title)}`, '_blank')
        }
    }

    /* Loading skeleton */
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

    /* Movie not found */
    if (!movie) {
        return (
            <div className="container py-16 text-center">
                <h2 className="text-2xl font-bold mb-4">Movie not found</h2>
                <Link to="/movies"><Button>Back to Movies</Button></Link>
            </div>
        )
    }

    const backdropImages = getBackdropImages(movie)

    return (
        <>
            {/* Film grain overlay */}
            <div className={styles.grain} aria-hidden="true" />

            {/* Hero Section — wrapped so the title overlay is positioned relative to it */}
            <div ref={heroWrapRef} className={styles.heroWrapper}>
                <HeroGallery movie={movie} backdropImages={backdropImages} />

                {/* Title + rating + genres rendered on top of the hero backdrop */}
                <div className={styles.heroTitleOverlay}>
                    <div className={styles.heroTitleContent}>
                        {movie.poster_url && (
                            <img
                                src={movie.poster_url}
                                alt={movie.title}
                                className={styles.heroPoster}
                            />
                        )}
                        <div className={styles.heroTextBlock}>
                            <h1 ref={movieTitleRef} className={styles.movieTitle}>
                                <SplitChars text={movie.title} charClass={styles.char} />
                            </h1>
                            <div className={styles.metaRow}>
                                {movie.vote_average != null && (
                                    <div className={styles.ratingBadge}>
                                        ⭐{' '}
                                        <span ref={ratingNumRef} className={styles.ratingNum}>0.0</span>
                                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>/10</span>
                                    </div>
                                )}
                                {movie.genre && (
                                    <div ref={genresRef} className={styles.genreBadges}>
                                        {movie.genre.split(',').map((g, i) => (
                                            <span key={i} className={styles.genreBadge}>{g.trim()}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <ScreeningsCalendar movie={movie} screenings={screenings} />

                        <Separator />

                        {/* Overview */}
                        <div>
                            <h2
                                ref={(el) => { sectionHeadingRefs.current[0] = el }}
                                className={styles.spotlightHeading}
                                style={{ '--spotlight-x': '-120%' }}
                            >
                                Overview
                            </h2>
                            <p ref={overviewRef} className={styles.overviewReveal + " text-muted-foreground leading-relaxed"}>
                                {movie.description || "No description available."}
                            </p>
                        </div>

                        <Separator />

                        {/* Trailer — clip-path wipe reveal */}
                        <div
                            ref={(el) => {
                                trailerRef.current = el
                                sectionHeadingRefs.current[1] = el?.querySelector('h2, h3') ?? null
                            }}
                            className={styles.trailerReveal}
                        >
                            <TrailerSection movie={movie} />
                        </div>
                    </div>

                    {/* Sidebar — slides in from right */}
                    <div ref={sidebarRef} className={styles.sidebarReveal}>
                        <MovieSidebar
                            movie={movie}
                            isInWatchlist={isInWatchlist}
                            onToggleWatchlist={handleToggleWatchlist}
                            onOpenTmdb={handleOpenTmdb}
                        />
                    </div>
                </div>
            </div>
        </>
    )
}
