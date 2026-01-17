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

import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { getMovies } from "@/api/movies"
import { getScreenings } from "@/api/screenings"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useReservation } from "@/context/ReservationContext"
import { Play, Calendar, Bookmark, SlidersHorizontal, X } from "lucide-react"

import MovieFilters from "@/components/movies/MovieFilters"
import MovieGrid from "@/components/movies/MovieGrid"
import SplitChars from '../components/SplitChars'
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

const HALLS = [
    { id: '01', name: 'Hall Alpha', badge: 'IMAX',  image: '/screen.webp',              seats: '280 seats', tech: '4K Laser · Dolby Atmos'         },
    { id: '02', name: 'Hall Beta',  badge: 'Dolby', image: '/backGroundHomePage.webp',   seats: '200 seats', tech: 'Premium Audio · Recliner Seating' },
    { id: '03', name: 'Hall Gamma', badge: 'VIP',   image: '/backGroundHomePage2.webp',  seats: '80 seats',  tech: 'Private Lounge · Waiter Service'  },
]

const PASS_TIERS = [
    {
        name: 'Student Plan',
        currency: '',
        priceDisplay: 'Free',
        priceNum: null,
        note: "it's all fake anyway",
        features: ['Watch imaginary movies', 'Pretend to reserve seats', 'Tell your friends you go to the cinema a lot'],
        cta: 'Get This Fake Plan',
    },
    {
        name: 'Regular Pass',
        currency: '€',
        priceDisplay: '9',
        priceNum: 9,
        note: '/month',
        features: ["Everything from Student, but you paid for it", "Our dev will buy a coffee", 'Warm fuzzy feeling inside'],
        cta: 'Most Popular (Allegedly)',
        highlight: true,
    },
    {
        name: 'VIP Delusion Pass',
        currency: '€',
        priceDisplay: '29',
        priceNum: 29,
        note: '/month',
        features: ['Absolutely identical to Regular', 'Fancy golden button on the website', "A heartfelt 'thank you' from our developer"],
        cta: 'Get This Fake Plan',
    },
]

export default function Movies() {
    const [movies, setMovies] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedGenres, setSelectedGenres] = useState([])
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const { savedMovies } = useReservation()
    const [searchParams] = useSearchParams()

    // Initialise active tab from ?tab= query param (e.g. linked from Home page pills)
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'now-playing')
    const [hoveredIdx, setHoveredIdx] = useState(null)
    const [selectedHall, setSelectedHall] = useState(null)
    const [hallMovieIds, setHallMovieIds] = useState({}) // { 'Hall Alpha': Set([id, ...]) }
    const [promoIdx, setPromoIdx] = useState(0)

    // GSAP refs
    const headingRef        = useRef(null)
    const filtersRef        = useRef(null)
    const gridWrapRef       = useRef(null)
    const pillContainerRef  = useRef(null)
    const pillIndicatorRef  = useRef(null)
    const pillItemRefs      = useRef([])
    const upcomingPromoRef  = useRef(null)
    const promoPosterRef    = useRef(null)
    const promoContentRef   = useRef(null)
    const passPromoRef      = useRef(null)
    const tierRefs          = useRef([])
    const priceNumRefs      = useRef([])
    const hallsSectionRef   = useRef(null)
    const hallCardRefs      = useRef([])

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

    /* Fetch screenings to build hall → movie ID mapping */
    useEffect(() => {
        getScreenings()
            .then(data => {
                const list = data.results || data || []
                const map = {}
                list.forEach(s => {
                    if (!s.hall_name || !s.movie) return
                    if (!map[s.hall_name]) map[s.hall_name] = new Set()
                    map[s.hall_name].add(s.movie)
                })
                setHallMovieIds(map)
            })
            .catch(() => {}) // hall filter gracefully degrades if API is unavailable
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

    // ─── Halls staggered curve-swipe reveal ──────────────────────
    useEffect(() => {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (prefersReduced) return

        const ctx = gsap.context(() => {
            const cards = hallCardRefs.current.filter(Boolean)
            if (!cards.length) return

            gsap.set(cards, { clipPath: 'inset(0 105% 0 0 round 0 100px 100px 0)' })
            gsap.to(cards, {
                clipPath: 'inset(0 0% 0 0 round 0 0px 0px 0)',
                duration: 0.85,
                stagger: 0.18,
                ease: 'power2.inOut',
                scrollTrigger: {
                    trigger: hallsSectionRef.current,
                    start: 'top 78%',
                    toggleActions: 'play none none reset',
                },
            })
            cards.forEach(card => {
                const ghost = card.querySelector(`.${styles.hallGhost}`)
                if (!ghost) return
                gsap.fromTo(ghost,
                    { opacity: 0, scale: 1.4 },
                    { opacity: 1, scale: 1, duration: 1.1, ease: 'power3.out',
                      scrollTrigger: { trigger: hallsSectionRef.current, start: 'top 78%', toggleActions: 'play none none reset' } }
                )
            })
        })
        return () => ctx.revert()
    }, [])

    // ─── Cinema Pass pricing cards GSAP ──────────────────────────
    useEffect(() => {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (prefersReduced || !passPromoRef.current) return

        const ctx = gsap.context(() => {
            const cards = tierRefs.current.filter(Boolean)
            if (!cards.length) return

            const trigger = { trigger: passPromoRef.current, start: 'top 80%', toggleActions: 'play none none reset' }

            // 1. Clip-path reveal: each card wipes up from the bottom, staggered
            gsap.fromTo(cards,
                { clipPath: 'inset(100% 0 0 0 round 12px)', opacity: 0 },
                {
                    clipPath: 'inset(0% 0 0 0 round 12px)', opacity: 1,
                    duration: 0.85, stagger: 0.18, ease: 'power3.out',
                    scrollTrigger: trigger,
                }
            )

            // 2. Price counter — animate numbers from 0 up
            priceNumRefs.current.forEach((el, i) => {
                if (!el || !PASS_TIERS[i]?.priceNum) return
                const target = PASS_TIERS[i].priceNum
                gsap.fromTo(el,
                    { innerText: 0 },
                    {
                        innerText: target, duration: 1.4, ease: 'power2.out',
                        snap: { innerText: 1 },
                        scrollTrigger: { ...trigger, start: 'top 78%' },
                        delay: i * 0.18,
                    }
                )
            })

            // 3. Feature items slide in from the left, staggered per card
            cards.forEach((card, i) => {
                const items = card.querySelectorAll('li')
                if (!items.length) return
                gsap.from(items, {
                    x: -24, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out',
                    scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none reset' },
                    delay: i * 0.18,
                })
            })
        })
        return () => ctx.revert()
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

    // Return indicator to the currently active tab (called on mouse-leave)
    const restorePillToActive = () => {
        setHoveredIdx(null)
        const idx = PILL_TABS.findIndex(t => t.value === activeTab)
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
        setSelectedHall(null)
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
    const nowPlayingBase   = movies.filter(m => m.status === 'now_playing' || !m.status)
    const nowPlayingMovies = (() => {
        const filtered = filterMovies(nowPlayingBase)
        if (!selectedHall || !hallMovieIds[selectedHall]) return filtered
        return filtered.filter(m => hallMovieIds[selectedHall].has(m.id))
    })()
    const upcomingMovies   = filterMovies(movies.filter(m => m.status === 'upcoming'))
    const watchlistMovies  = filterMovies(savedMovies)
    const hasActiveFilters = searchQuery !== "" || selectedGenres.length > 0
    const upcomingList     = movies.filter(m => m.status === 'upcoming')
    const featuredMovie    = upcomingList[promoIdx] || null

    // ─── Promo auto-rotation ──────────────────────────────────────
    const promoIntervalRef = useRef(null)

    const startPromoInterval = useCallback(() => {
        clearInterval(promoIntervalRef.current)
        if (upcomingList.length < 2) return
        promoIntervalRef.current = setInterval(() => {
            setPromoIdx(prev => (prev + 1) % upcomingList.length)
        }, 9000)
    }, [upcomingList.length])

    useEffect(() => {
        startPromoInterval()
        return () => clearInterval(promoIntervalRef.current)
    }, [startPromoInterval])

    const goPromo = (dir) => {
        setPromoIdx(prev => (prev + dir + upcomingList.length) % upcomingList.length)
        startPromoInterval() // reset timer so it doesn't jump right after manual nav
    }

    // ─── Promo GSAP transition on movie change ────────────────────
    useEffect(() => {
        if (!promoPosterRef.current || !promoContentRef.current || !featuredMovie) return

        const ctx = gsap.context(() => {
            const tl = gsap.timeline()
            // Poster: clip-path wipe in from left
            tl.fromTo(promoPosterRef.current,
                { clipPath: 'inset(0 100% 0 0 round 8px)' },
                { clipPath: 'inset(0 0% 0 0 round 8px)', duration: 0.7, ease: 'power2.inOut' }
            )
            // Content: fade + slide from right
            tl.fromTo(promoContentRef.current,
                { opacity: 0, x: 30 },
                { opacity: 1, x: 0, duration: 0.55, ease: 'power3.out' },
                '-=0.4'
            )
        })
        return () => ctx.revert()
    }, [promoIdx, featuredMovie])

    // ─── Ticket 3D hover tilt ─────────────────────────────────────
    const handleTicketMouseMove = (e, el) => {
        if (!el) return
        const rect = el.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const rx = ((e.clientY - cy) / (rect.height / 2)) * -6
        const ry = ((e.clientX - cx) / (rect.width  / 2)) *  6
        gsap.to(el, { rotateX: rx, rotateY: ry, duration: 0.35, ease: 'power2.out', overwrite: 'auto' })
    }
    const handleTicketMouseLeave = (el) => {
        if (!el) return
        gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' })
    }

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
                <div className={styles.pageLayout}>
                    {/* ── Left Sidebar Filter ───────────────────────────── */}
                    <aside
                        ref={filtersRef}
                        className={`${styles.filterSidebar} ${!sidebarOpen ? styles.sidebarClosed : ''}`}
                        aria-hidden={!sidebarOpen}
                    >
                        <MovieFilters
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            selectedGenres={selectedGenres}
                            onToggleGenre={toggleGenre}
                            onClearGenres={() => setSelectedGenres([])}
                            halls={HALLS}
                            selectedHall={selectedHall}
                            onSelectHall={setSelectedHall}
                            onClearAll={clearFilters}
                        />
                    </aside>

                    {/* ── Main Content ──────────────────────────────────── */}
                    <div className={`${styles.mainContent} ${!sidebarOpen ? styles.mainContentFull : ''}`}>
                        {/* Top row: filter toggle + movie count */}
                        <div className={styles.filterToggleRow}>
                            <button
                                className={`${styles.filterToggleBtn} ${sidebarOpen ? styles.filterToggleBtnActive : ''}`}
                                onClick={() => setSidebarOpen(o => !o)}
                                aria-expanded={sidebarOpen}
                                aria-label="Toggle filters"
                            >
                                {sidebarOpen
                                    ? <X className="h-3.5 w-3.5" />
                                    : <SlidersHorizontal className="h-3.5 w-3.5" />
                                }
                                Filters
                                {(selectedGenres.length > 0 || searchQuery || selectedHall) && (
                                    <span className={styles.filterBadge}>
                                        {selectedGenres.length + (searchQuery ? 1 : 0) + (selectedHall ? 1 : 0)}
                                    </span>
                                )}
                            </button>
                            <Badge variant="secondary" className="ml-auto">{movies.length} Movies</Badge>
                        </div>

                        {/* Tabs */}
                        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <div className="flex justify-center mb-6">
                        <div ref={pillContainerRef} className={styles.pillSwitcher}
                            onMouseLeave={restorePillToActive}
                        >
                            <span ref={pillIndicatorRef} className={styles.pillIndicator} />
                            {PILL_TABS.map(({ label, value }, i) => {
                                const isLit = hoveredIdx !== null ? hoveredIdx === i : activeTab === value
                                return (
                                    <button
                                        key={value}
                                        ref={el => { pillItemRefs.current[i] = el }}
                                        className={`${styles.pillItem} ${isLit ? styles.pillItemActive : ''}`}
                                        onClick={() => handleTabChange(value)}
                                        onMouseEnter={() => { setHoveredIdx(i); movePillTo(i) }}
                                    >
                                        {label}
                                    </button>
                                )
                            })}
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
                    </div>{/* end mainContent */}
                </div>{/* end pageLayout */}
            </div>

            {/* ── Upcoming Movie Promo ─────────────────────────────── */}
            {featuredMovie && (
                <section ref={upcomingPromoRef} className={styles.upcomingPromo}>
                    {/* Blurred poster backdrop — very subtle */}
                    <div
                        className={styles.upcomingPromoBg}
                        style={{ backgroundImage: `url(${featuredMovie.poster_url})` }}
                    />

                    {/* Poster frame */}
                    <div ref={promoPosterRef} className={styles.upcomingPosterWrap}>
                        <img
                            key={featuredMovie.id}
                            src={featuredMovie.poster_url}
                            alt={featuredMovie.title}
                            className={styles.upcomingPosterImg}
                        />
                        <div className={styles.upcomingPosterGlow} />
                    </div>

                    {/* Content */}
                    <div ref={promoContentRef} className={styles.upcomingPromoContent}>
                        <p className={styles.upcomingPromoLabel}>Coming Soon (Allegedly)</p>
                        <h2 className={styles.upcomingPromoTitle}>{featuredMovie.title}</h2>
                        {featuredMovie.genre && (
                            <p className={styles.upcomingPromoGenre}>{featuredMovie.genre}</p>
                        )}
                        <p className={styles.upcomingPromoMeta}>
                            We fetched this from an API and are choosing to believe it's real.
                            Our developer is very excited about this one.
                        </p>

                        {/* Navigation: arrows + dots */}
                        {upcomingList.length > 1 && (
                            <div className={styles.promoNav} aria-label="Select movie">
                                <button
                                    className={styles.promoArrow}
                                    onClick={() => goPromo(-1)}
                                    aria-label="Previous movie"
                                >&#8592;</button>

                                <div className={styles.promoDots}>
                                    {upcomingList.map((_, i) => (
                                        <button
                                            key={i}
                                            className={`${styles.promoDot} ${i === promoIdx ? styles.promoDotActive : ''}`}
                                            onClick={() => { setPromoIdx(i); startPromoInterval() }}
                                            aria-label={`Movie ${i + 1}`}
                                        />
                                    ))}
                                </div>

                                <button
                                    className={styles.promoArrow}
                                    onClick={() => goPromo(1)}
                                    aria-label="Next movie"
                                >&#8594;</button>
                            </div>
                        )}

                        <Link to={`/movies/${featuredMovie.id}`} className={styles.upcomingPromoCTA}>
                            Stare Longingly at This Movie
                        </Link>
                    </div>
                </section>
            )}

            {/* ── Cinema Pass Promo ────────────────────────────────── */}
            <section ref={passPromoRef} className={styles.passPromo}>
                <div className={styles.passPromoInner}>
                    <p className={styles.passPromoLabel}>The Cinema Pass™</p>
                    <h2 className={styles.passPromoTitle}>
                        A subscription for a cinema that doesn't technically exist.
                    </h2>
                    <div className={styles.passTiers}>
                        {PASS_TIERS.map((tier, i) => (
                            <div
                                key={i}
                                data-tier
                                ref={el => { tierRefs.current[i] = el }}
                                className={`${styles.pricingCard} ${tier.highlight ? styles.pricingCardHL : ''}`}
                                onMouseMove={e => handleTicketMouseMove(e, e.currentTarget)}
                                onMouseLeave={e => handleTicketMouseLeave(e.currentTarget)}
                            >
                                <p className={styles.pricingTierName}>{tier.name}</p>
                                <div className={styles.pricingDivider} />

                                <p className={styles.pricingPrice}>
                                    {tier.currency && (
                                        <span className={styles.pricingCurrency}>{tier.currency}</span>
                                    )}
                                    <span
                                        ref={el => { priceNumRefs.current[i] = el }}
                                        className={styles.pricingNum}
                                    >
                                        {tier.priceDisplay}
                                    </span>
                                    <span className={styles.pricingNote}>{tier.note}</span>
                                </p>

                                <ul className={styles.pricingFeatures}>
                                    {tier.features.map((f, j) => <li key={j}>{f}</li>)}
                                </ul>

                                <button className={`${styles.pricingBtn} ${tier.highlight ? styles.pricingBtnHL : ''}`}>
                                    {tier.cta}
                                </button>

                                {tier.highlight && <div className={styles.pricingGlow} aria-hidden="true" />}
                                {tier.highlight && <div className={styles.ticketShimmer} aria-hidden="true" />}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Cinema Halls ─────────────────────────────────────── */}
            <section ref={hallsSectionRef} className={styles.hallsSection}>
                <div className={styles.hallsLabel}>Our Cinemas</div>
                <div className={styles.hallsScroller}>
                    <div className={styles.hallsTrack}>
                        {HALLS.map((hall, i) => (
                            <div
                                key={hall.id}
                                ref={el => { hallCardRefs.current[i] = el }}
                                className={styles.hallCard}
                            >
                                <div className={styles.hallGhost}>{hall.id}</div>
                                <img src={hall.image} alt={hall.name} className={styles.hallImg} />
                                <div className={styles.hallOverlay}>
                                    <span className={styles.hallBadge}>{hall.badge}</span>
                                    <h3 className={styles.hallName}>{hall.name}</h3>
                                    <p className={styles.hallSeats}>{hall.seats}</p>
                                    <p className={styles.hallTech}>{hall.tech}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    )
}
