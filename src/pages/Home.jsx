/**
 * Home page – "The Projection Room" cinematic redesign.
 *
 * Sections:
 *  1. Hero         — circular iris open + char-by-char title (GSAP)
 *  2. Cinema Halls — horizontal CSS scroll-snap + curtain reveals (GSAP ScrollTrigger)
 *  3. Stats        — slot-machine digit roll on scroll (GSAP ScrollTrigger)
 *  4. Movie Slider — spotlight heading sweep + Swiper coverflow
 *  5. Navigation   — pills linking to corresponding tabs on /movies
 *
 * GSAP plugins: ScrollTrigger
 * Smooth scroll: Lenis (already installed)
 */

import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Film, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getMovies } from '../api/movies'
import styles from './Home.module.css'
import SplitChars from '../components/SplitChars'

import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCoverflow, Pagination, Navigation, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

// ─── Cinema halls data ────────────────────────────────────────────
const HALLS = [
    {
        id: '01',
        name: 'Hall Alpha',
        badge: 'IMAX',
        image: '/screen.webp',
        seats: '280 seats',
        tech: '4K Laser · Dolby Atmos',
    },
    {
        id: '02',
        name: 'Hall Beta',
        badge: 'Dolby',
        image: '/backGroundHomePage.webp',
        seats: '200 seats',
        tech: 'Premium Audio · Recliner Seating',
    },
    {
        id: '03',
        name: 'Hall Gamma',
        badge: 'VIP',
        image: '/backGroundHomePage2.webp',
        seats: '80 seats',
        tech: 'Private Lounge · Waiter Service',
    },
]

// ─── Derived stat values ──────────────────────────────────────────
const TOTAL_SEATS = HALLS.reduce((sum, hall) => {
    const m = hall.seats.match(/(\d+)/)
    return sum + (m ? parseInt(m[1]) : 0)
}, 0)

const STAT_META = [
    { label: 'Films', suffix: '+' },
    { label: 'Halls', suffix: '' },
    { label: 'Seats', suffix: '+' },
]

// ─── Main component ───────────────────────────────────────────────
export default function Home() {
    const heroBg = '/absulute-cinema.webp'
    const [movies, setMovies] = useState([])
    const [movieCount, setMovieCount] = useState(null)

    // Refs for GSAP targets
    const heroSectionRef = useRef(null)
    const irisRef = useRef(null)
    const heroLogoRef = useRef(null)
    const heroTitleRef = useRef(null)
    const heroSubRef = useRef(null)
    const heroBtnRef = useRef(null)

    const hallsSectionRef = useRef(null)
    const hallCardRefs = useRef([])

    const statsRef = useRef(null)
    const statNumRefs = useRef([])

    const sliderSectionRef = useRef(null)
    const spotlightHeadingRef = useRef(null)
    const swiperWrapRef = useRef(null)

    // Refs for sliding pill switcher
    const pillContainerRef = useRef(null)
    const pillIndicatorRef = useRef(null)
    const pillItemRefs = useRef([])

    // Fetch movies
    useEffect(() => {
        getMovies()
            .then((data) => {
                setMovies(data?.results || [])
                setMovieCount(data?.count ?? null)
            })
            .catch((err) => console.error('Failed to fetch movies:', err))
    }, [])

    // Lenis smooth scroll
    useEffect(() => {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (prefersReduced) return

        const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
        // Use a flag so the RAF loop stops when the component unmounts
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

    // ─── Hero projector intro ──────────────────────────────────────
    useEffect(() => {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (irisRef.current) irisRef.current.style.display = 'none'
        if (prefersReduced) return

        const chars = heroTitleRef.current?.querySelectorAll(`.${styles.char}`) || []
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ delay: 0.1 })

            // 1. Logo flicker
            tl.fromTo(
                heroLogoRef.current,
                { opacity: 0, scale: 0.9 },
                {
                    opacity: 1,
                    scale: 1,
                    duration: 0.1,
                    ease: 'none',
                    onComplete: () => {
                        gsap.to(heroLogoRef.current, {
                            keyframes: [
                                { opacity: 0.2, duration: 0.06 },
                                { opacity: 1, duration: 0.06 },
                                { opacity: 0.4, duration: 0.06 },
                                { opacity: 1, duration: 0.1 },
                            ],
                        })
                    },
                }
            )

            // 2. Char-by-char title
            if (chars.length > 0) {
                tl.fromTo(
                    chars,
                    { y: -24, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.4, stagger: 0.035, ease: 'back.out(1.7)' },
                    '-=0.05'
                )
            }

            // 3. Subtitle + button
            tl.fromTo(
                [heroSubRef.current, heroBtnRef.current],
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, stagger: 0.15, ease: 'power2.out' },
                '-=0.2'
            )
        })

        return () => ctx.revert()
    }, [])

    // ─── Hero parallax ────────────────────────────────────────────
    useEffect(() => {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (prefersReduced) return

        const ctx = gsap.context(() => {
            gsap.to(heroSectionRef.current, {
                backgroundPositionY: '40%',
                ease: 'none',
                scrollTrigger: {
                    trigger: heroSectionRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true,
                },
            })
        })
        return () => ctx.revert()
    }, [])

    // ─── Halls staggered curve-swipe reveal ───────────────────────
    useEffect(() => {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (prefersReduced) return

        const ctx = gsap.context(() => {
            const cards = hallCardRefs.current.filter(Boolean)
            if (!cards.length) return

            // Set all cards hidden behind a curved clip before animating
            gsap.set(cards, { clipPath: 'inset(0 105% 0 0 round 0 100px 100px 0)' })

            // Staggered curve swipe across all cards when section enters
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

            // Ghost numbers bloom in behind the cards
            cards.forEach((card) => {
                const ghost = card.querySelector(`.${styles.hallGhost}`)
                if (!ghost) return
                gsap.fromTo(ghost,
                    { opacity: 0, scale: 1.4 },
                    {
                        opacity: 1, scale: 1,
                        duration: 1.1, ease: 'power3.out',
                        scrollTrigger: {
                            trigger: hallsSectionRef.current,
                            start: 'top 78%',
                            toggleActions: 'play none none reset',
                        },
                    }
                )
            })
        })

        return () => ctx.revert()
    }, [])

    // ─── Stats slot-machine counters ──────────────────────────────
    useEffect(() => {
        if (movieCount === null) return  // wait until the API responds

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (prefersReduced) return

        const statValues = [movieCount, HALLS.length, TOTAL_SEATS]

        const ctx = gsap.context(() => {
            statNumRefs.current.forEach((el, i) => {
                if (!el) return
                const target = statValues[i]
                const obj = { val: 0 }
                gsap.to(obj, {
                    val: target,
                    duration: 1.6,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: statsRef.current,
                        start: 'top 80%',
                        toggleActions: 'play none none reset',
                    },
                    onUpdate: () => {
                        el.textContent = Math.round(obj.val) + STAT_META[i].suffix
                    },
                })
            })
        })
        return () => ctx.revert()
    }, [movieCount])

    // ─── Slider spotlight heading ─────────────────────────────────
    useEffect(() => {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (prefersReduced) return

        const ctx = gsap.context(() => {
            // Spotlight sweep: animate a CSS custom property from -100% to 100%
            gsap.fromTo(
                spotlightHeadingRef.current,
                { '--spotlight-x': '-120%' },
                {
                    '--spotlight-x': '120%',
                    duration: 1.2,
                    ease: 'power2.inOut',
                    scrollTrigger: {
                        trigger: sliderSectionRef.current,
                        start: 'top 75%',
                        toggleActions: 'play none none reset',
                    },
                }
            )
            // Swiper fade up
            gsap.fromTo(
                swiperWrapRef.current,
                { y: 60, opacity: 0, scale: 0.97 },
                {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    duration: 0.9,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: sliderSectionRef.current,
                        start: 'top 70%',
                        toggleActions: 'play none none reset',
                    },
                }
            )
        })
        return () => ctx.revert()
    }, [])

    // ─── Pill switcher helpers ────────────────────────────────────
    const PILL_TABS = [
        { label: 'Now Playing', to: '/movies?tab=now-playing' },
        { label: 'Upcoming',    to: '/movies?tab=upcoming'    },
        { label: 'My Watchlist',to: '/movies?tab=watchlist'   },
    ]

    const movePillTo = (idx) => {
        const el  = pillItemRefs.current[idx]
        const box = pillContainerRef.current
        const ind = pillIndicatorRef.current
        if (!el || !box || !ind) return
        const bRect = box.getBoundingClientRect()
        const eRect = el.getBoundingClientRect()
        gsap.killTweensOf(ind)
        gsap.to(ind, {
            x: eRect.left - bRect.left,
            width: eRect.width,
            opacity: 1,
            duration: 0.35,
            ease: 'power2.inOut',
        })
    }

    const hidePill = () => {
        const ind = pillIndicatorRef.current
        if (!ind) return
        gsap.killTweensOf(ind)
        gsap.to(ind, { opacity: 0, duration: 0.2 })
    }

    // ─── Render ───────────────────────────────────────────────────
    return (
        <>
            {/* Film grain overlay */}
            <div className={styles.grain} aria-hidden="true" />

            {/* === 1. HERO — CIRCULAR IRIS OPENING === */}
            <section
                ref={heroSectionRef}
                className={styles.heroSection}
                style={{ backgroundImage: `url(${heroBg})` }}
            >
                {/* Circular iris overlay — GSAP shrinks it from full black to nothing */}
                <div ref={irisRef} className={styles.irisOverlay} aria-hidden="true" />

                <div className={styles.heroContent}>
                    <img ref={heroLogoRef} src="/logo.webp" className={styles.heroLogo} alt="Absolute Cinema" />
                    <div className={styles.heroText}>
                        <h1 ref={heroTitleRef} className={styles.heroHeading}>
                            <SplitChars text="Welcome to Absolute" charClass={styles.char} />
                            <br />
                            <SplitChars text="Cinemas" charClass={styles.char} />
                        </h1>
                        <p ref={heroSubRef} className={styles.heroSub}>
                            Book FAKE tickets at the best FAKE cinemas.
                        </p>
                        <div ref={heroBtnRef}>
                            <Link to="/movies">
                                <Button size="lg" className="gap-2 mt-4">
                                    <Film className="h-5 w-5" />
                                    Browse Movies
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* === 2. STATS — CINEMA LIGHTBOARD === */}
            <section ref={statsRef} className={styles.statsSection}>
                {STAT_META.map((stat, i) => (
                    <div key={stat.label} className={styles.statItem}>
                        <span
                            ref={(el) => { statNumRefs.current[i] = el }}
                            className={styles.statNum}
                        >
                            0{stat.suffix}
                        </span>
                        <span className={styles.statLabel}>{stat.label}</span>
                    </div>
                ))}
            </section>

            {/* === 4. MOVIE SLIDER — SPOTLIGHT HEADING === */}
            <section ref={sliderSectionRef} className={styles.sliderSection}>
                <h2
                    ref={spotlightHeadingRef}
                    className={styles.spotlightHeading}
                    style={{ '--spotlight-x': '-120%' }}
                >
                    Now Showing
                </h2>

                {movies.length > 0 && (
                    <div ref={swiperWrapRef} className={`w-full max-w-6xl mx-auto px-4 ${styles.swiperWrap}`}>
                        <Swiper
                            effect="coverflow"
                            grabCursor={true}
                            centeredSlides={true}
                            loop={movies.length > 3}
                            slidesPerView="auto"
                            coverflowEffect={{ rotate: 35, stretch: 0, depth: 180, modifier: 1, slideShadows: true }}
                            pagination={{ clickable: true }}
                            navigation={true}
                            autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                            speed={600}
                            modules={[EffectCoverflow, Pagination, Navigation, Autoplay]}
                        >
                            {movies.map((movie) => (
                                <SwiperSlide key={movie.id}>
                                    <Link to={`/movies/${movie.id}`} className="block w-full h-full">
                                        <div className="relative w-full h-full rounded-xl overflow-hidden shadow-xl transition-transform duration-300 hover:scale-105">
                                            <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover" />
                                            <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/70 to-transparent flex items-end px-3 pb-2">
                                                <p className="text-xs md:text-sm text-white truncate">{movie.title}</p>
                                            </div>
                                        </div>
                                    </Link>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                )}
            </section>

            {/* === 4. NAVIGATION PILLS → Movies page tabs === */}
            <section className={styles.featuresSection}>
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
                    <div className="flex justify-center">
                    <div
                        ref={pillContainerRef}
                        className={styles.pillSwitcher}
                        onMouseLeave={hidePill}
                    >
                        {/* Sliding white indicator */}
                        <span ref={pillIndicatorRef} className={styles.pillIndicator} />
                        {PILL_TABS.map((tab, i) => (
                            <Link
                                key={tab.to}
                                to={tab.to}
                                ref={el => pillItemRefs.current[i] = el}
                                className={styles.pillItem}
                                onMouseEnter={() => movePillTo(i)}
                            >
                                {tab.label}
                            </Link>
                        ))}
                    </div>
                    </div>
                </div>
            </section>

            {/* === 5. CINEMA HALLS — STAGGERED CURVE-SWIPE REVEAL === */}
            <section ref={hallsSectionRef} className={styles.hallsSection}>
                <div className={styles.hallsLabel}>Our Cinemas</div>
                <div className={styles.hallsScroller}>
                    <div className={styles.hallsTrack}>
                        {HALLS.map((hall, i) => (
                            <div
                                key={hall.id}
                                ref={(el) => { hallCardRefs.current[i] = el }}
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
