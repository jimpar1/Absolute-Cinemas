/**
 * Movies page – Browse all movies with search, genre filters, and tabs.
 *
 * Cinematic additions (GSAP):
 *   • Film grain overlay (CSS, fixed)
 *   • Cinema marquee ticker (CSS animation)
 *   • "The Films" spotlight heading with char-by-char drop-in
 *   • Filters fade-up on page load
 *
 * Tabs:
 *   • Now Playing – movies currently in theaters
 *   • Upcoming    – movies coming soon
 *   • Watchlist   – user's saved/bookmarked movies (from ReservationContext)
 */

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { getMovies } from "@/api/movies"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useReservation } from "@/context/ReservationContext"
import { Play, Calendar, Bookmark } from "lucide-react"

import MovieFilters from "@/components/movies/MovieFilters"
import MovieGrid from "@/components/movies/MovieGrid"
import SplitChars from '../components/SplitChars'
import CreatorPromo from '../components/CreatorPromo'
import styles from './Movies.module.css'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

// ─── Cinema marquee items ─────────────────────────────────────────
const MARQUEE_ITEMS = [
    'Now Playing', 'Upcoming', 'Drama', 'Thriller', 'Action',
    'Sci-Fi', 'Horror', 'Romance', 'Comedy', 'Documentary', 'Mystery',
]

const PILL_TABS = [
    { label: 'Now Playing', value: 'now-playing' },
    { label: 'Upcoming',    value: 'upcoming'    },
    { label: 'Watchlist',   value: 'watchlist'   },
]

export default function Movies() {
    const [movies, setMovies] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedGenres, setSelectedGenres] = useState([])
    const [showFilters, setShowFilters] = useState(false)

    const { savedMovies } = useReservation()
    const [searchParams] = useSearchParams()

    // Initialise active tab from ?tab= query param (e.g. linked from Home page pills)
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'now-playing')

    // GSAP refs
    const headingRef        = useRef(null)
    const filtersRef        = useRef(null)
    const gridWrapRef       = useRef(null)
    const pillContainerRef  = useRef(null)
    const pillIndicatorRef  = useRef(null)
    const pillItemRefs      = useRef([])

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

    // ─── Page-load animation (curve swipe reveal + filters fade) ───
    useEffect(() => {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (prefersReduced) return

        const ctx = gsap.context(() => {
            const chars = headingRef.current?.querySelectorAll(`.${styles.char}`) || []

            // Set initial states before animating
            gsap.set(headingRef.current, { clipPath: 'inset(0 105% 0 0 round 0 120px 120px 0)' })
            if (chars.length) gsap.set(chars, { y: 28, opacity: 0 })

            const tl = gsap.timeline({ delay: 0.15 })

            // 1. Curve swipe — sweeps left→right with a rounded trailing edge
            tl.to(headingRef.current, {
                clipPath: 'inset(0 0% 0 0 round 0 0px 0px 0)',
                duration: 0.9,
                ease: 'power2.inOut',
            })

            // 2. Chars rise up during the tail of the swipe
            if (chars.length) {
                tl.to(
                    chars,
                    { y: 0, opacity: 1, duration: 0.45, stagger: 0.04, ease: 'power3.out' },
                    '-=0.55'
                )
            }

            // 3. Filters fade up
            tl.fromTo(
                filtersRef.current,
                { y: 28, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' },
                '-=0.2'
            )
        })

        return () => ctx.revert()
    }, [])

    // ─── ScrollTrigger.batch card reveals ────────────────────────
    useEffect(() => {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (prefersReduced) return

        const id = requestAnimationFrame(() => {
            const grid =
                gridWrapRef.current?.querySelector('[class*="grid"]') ||
                gridWrapRef.current?.firstElementChild
            if (!grid?.children.length) return

            ScrollTrigger.batch(grid.children, {
                onEnter: (batch) =>
                    gsap.fromTo(
                        batch,
                        { opacity: 0, y: 28, scale: 0.95 },
                        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.06, ease: 'power3.out', overwrite: true }
                    ),
                start: 'top 92%',
            })
        })

        return () => {
            cancelAnimationFrame(id)
            ScrollTrigger.getAll().forEach(t => t.kill())
        }
    }, [movies, searchQuery, selectedGenres, activeTab])

    // ─── Scroll velocity skew on grid ────────────────────────────
    useEffect(() => {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (prefersReduced || !gridWrapRef.current) return

        const proxy = { skewY: 0 }
        const skewSetter = gsap.quickSetter(gridWrapRef.current, 'skewY', 'deg')
        const clamp = gsap.utils.clamp(-6, 6)

        const st = ScrollTrigger.create({
            onUpdate: (self) => {
                const skew = clamp(self.getVelocity() / -300)
                if (Math.abs(skew) > Math.abs(proxy.skewY)) {
                    proxy.skewY = skew
                    gsap.to(proxy, {
                        skewY: 0,
                        duration: 0.8,
                        ease: 'power3',
                        overwrite: true,
                        onUpdate: () => skewSetter(proxy.skewY),
                    })
                }
            },
        })

        return () => st.kill()
    }, [])

    // ─── Pill indicator helpers ───────────────────────────────────
    const movePillTo = (idx) => {
        const el  = pillItemRefs.current[idx]
        const box = pillContainerRef.current
        const ind = pillIndicatorRef.current
        if (!el || !box || !ind) return
        const bRect = box.getBoundingClientRect()
        const eRect = el.getBoundingClientRect()
        gsap.killTweensOf(ind)
        gsap.to(ind, { x: eRect.left - bRect.left, width: eRect.width, opacity: 1, duration: 0.35, ease: 'power2.inOut' })
    }

    // Sync indicator whenever active tab changes (incl. initial mount + URL-driven)
    useEffect(() => {
        const idx = PILL_TABS.findIndex(t => t.value === activeTab)
        if (idx < 0) return
        const id = requestAnimationFrame(() => movePillTo(idx))
        return () => cancelAnimationFrame(id)
    }, [activeTab])

    const handleTabChange = (value) => {
        setActiveTab(value)
        const idx = PILL_TABS.findIndex(t => t.value === value)
        if (idx >= 0) movePillTo(idx)
    }

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
    const upcomingMovies   = filterMovies(movies.filter(m => m.status === 'upcoming'))
    const watchlistMovies  = filterMovies(savedMovies)
    const hasActiveFilters = searchQuery !== "" || selectedGenres.length > 0

    return (
        <>
            {/* Film grain overlay */}
            <div className={styles.grain} aria-hidden="true" />

            {/* Cinema marquee ticker */}
            <div className={styles.marqueeWrapper} aria-hidden="true">
                <div className={styles.marqueeTrack}>
                    {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
                        <span key={i} className={styles.filmItem}>{item} ·</span>
                    ))}
                </div>
            </div>

            {/* Spotlight hero heading */}
            <section className={styles.heroSection}>
                {/* Animated poster collage — only rendered once movies load */}
                {movies.length > 0 && (
                    <div className={styles.posterCollage} aria-hidden="true">
                        <div className={`${styles.posterRow} ${styles.posterRowLeft}`}>
                            {[...movies, ...movies].map((m, i) => (
                                <img key={i} src={m.poster_url} alt="" className={styles.posterImg} loading="lazy" />
                            ))}
                        </div>
                        <div className={`${styles.posterRow} ${styles.posterRowRight}`}>
                            {[...movies, ...movies].map((m, i) => (
                                <img key={i} src={m.poster_url} alt="" className={styles.posterImg} loading="lazy" />
                            ))}
                        </div>
                        <div className={`${styles.posterRow} ${styles.posterRowLeftSlow}`}>
                            {[...movies, ...movies].map((m, i) => (
                                <img key={i} src={m.poster_url} alt="" className={styles.posterImg} loading="lazy" />
                            ))}
                        </div>
                    </div>
                )}
                <div className={styles.heroDimmer} />
                <h1
                    ref={headingRef}
                    className={styles.spotlightHeading}
                >
                    <SplitChars text="The Films" charClass={styles.char} />
                </h1>
            </section>

            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
                {/* Badge showing total count */}
                <div className="flex justify-end mb-4">
                    <Badge variant="secondary">{movies.length} Movies</Badge>
                </div>

                {/* Search & Genre Filters — animated as one unit */}
                <div ref={filtersRef} className={styles.filtersWrapper}>
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
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <div className="flex justify-center mb-6">
                        <div ref={pillContainerRef} className={styles.pillSwitcher}>
                            <span ref={pillIndicatorRef} className={styles.pillIndicator} />
                            {PILL_TABS.map(({ label, value }, i) => (
                                <button
                                    key={value}
                                    ref={el => { pillItemRefs.current[i] = el }}
                                    className={`${styles.pillItem} ${activeTab === value ? styles.pillItemActive : ''}`}
                                    onClick={() => handleTabChange(value)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div ref={gridWrapRef} className={styles.gridWrapper}>
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
                    </div>
                </Tabs>
            </div>

            <CreatorPromo />
        </>
    )
}
