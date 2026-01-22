import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import styles from './AboutUs.module.css'
import VideoIntro from '../components/VideoIntro'

gsap.registerPlugin(ScrollTrigger, SplitText)

const people = [
  {
    first: "Dimitris",
    tag: "The Swiss Knife",
    am: "21390314",
    bio: "With great CODE comes Great Responsibility. So don't let the bugs out!!",
    photo: "/team/absolute-egw.webp",
    photo2: "/team/absolute-egw-2.webp",
  },
  {
    first: "Nikos",
    tag: "The MegaDev",
    am: "21390284",
    bio: "Debugging code in the morning, breaking hearts at night. Full-stack developer specializing in 'good-times-as-a-service'. If life was a script, mine would only have high-end vibes and zero errors. Cheers to good drinks and even better company.",
    photo: "/team/absolute-nikos.webp",
    photo2: "/team/absolute-nikos-2.webp",
  },
  {
    first: "Giorgos",
    tag: "The .exeCutor",
    am: "22390221",
    bio: "Stack full. Glass full. Low latency in thought, high standards in life. I don't chase trends — I write version control in reality. Street vibes with production discipline.",
    photo: "/team/absolute-tzimos.webp",
    photo2: "/team/absolute-tzimos-2.webp",
  },
  {
    first: "Sotiris",
    tag: "Ma1c OS",
    am: "20390136",
    bio: "The System's Operator. Keeping everything running smoothly.",
    photo: "/team/absolute-makos.webp",
    photo2: "/team/absolute-makos-2.webp",
  },
]

const textPos = [styles.ptBl, styles.ptCr, styles.ptCl, styles.ptBr]

// Brush timeline positions (as fraction of ScrollTrigger progress 0-1)
const BRUSH_APPEAR_START = 0.15
const BRUSH_APPEAR_END   = 0.55
const BRUSH_EVAP_END     = 0.80

// ── Canvas drawing ─────────────────────────────────────────────

function drawInkBrush(canvas, img, brushMask, headProgress, evapProgress, reverse = false) {
  const ctx = canvas.getContext('2d')
  const w = canvas.width, h = canvas.height
  ctx.clearRect(0, 0, w, h)
  if (headProgress <= 0 || !brushMask) return

  const totalD = w + h
  const headD  = headProgress * totalD
  const tailD  = evapProgress * totalD

  // Parallelogram clip vertices — direction depends on reverse flag
  let hTopX, tTopX, hBotX, tBotX
  if (reverse) {
    // top-left → bottom-right: D = x + y
    // D=0 at top-left corner, D=w+h at bottom-right corner
    hTopX = headD        // head edge at y=0: x = headD
    tTopX = tailD
    hBotX = headD - h    // head edge at y=h: x = headD - h
    tBotX = tailD - h
  } else {
    // top-right → bottom-left: D = w - x + y (original)
    // D=0 at top-right corner, D=w+h at bottom-left corner
    hTopX = w - headD
    tTopX = w - tailD
    hBotX = w + h - headD
    tBotX = w + h - tailD
  }

  // ── Build mask canvas with diagonal clip ──
  const mc   = document.createElement('canvas')
  mc.width   = w
  mc.height  = h
  const mCtx = mc.getContext('2d')

  mCtx.save()
  mCtx.beginPath()
  mCtx.moveTo(hTopX, 0)
  mCtx.lineTo(tTopX, 0)
  mCtx.lineTo(tBotX, h)
  mCtx.lineTo(hBotX, h)
  mCtx.closePath()
  mCtx.clip()

  // Rotate brush PNG: -45° for current direction, +45° for reverse direction
  const diagLen = Math.sqrt(w * w + h * h)
  mCtx.translate(w / 2, h / 2)
  mCtx.rotate(reverse ? Math.PI / 4 : -Math.PI / 4)
  mCtx.drawImage(brushMask, -diagLen / 2, -diagLen / 2, diagLen, diagLen)
  mCtx.restore()

  // ── Composite: photo (cover-style, no stretching) through brush mask ──
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const sw = img.naturalWidth  * scale
  const sh = img.naturalHeight * scale
  ctx.drawImage(img, (w - sw) / 2, (h - sh) / 2, sw, sh)
  ctx.globalCompositeOperation = 'destination-in'
  ctx.drawImage(mc, 0, 0)
  ctx.globalCompositeOperation = 'source-over'
}

// ── Component ──────────────────────────────────────────────────

export default function AboutUs() {
  const [progress, setProgress]     = useState(0)
  const [activeIdx, setActiveIdx]   = useState(0)
  const [photoErrors, setPhotoErrors] = useState({})
  const [showVideo, setShowVideo]   = useState(true)

  const scopeRef          = useRef(null)
  const lenisRef          = useRef(null)
  const sectionRefs       = useRef([])
  const photoLayerRefs    = useRef([])
  const textLayerRefs     = useRef([])
  const textElemRefs      = useRef(people.map(() => Array(3).fill(null)))
  const nameRefs          = useRef([])
  const ghostNumRefs      = useRef([])
  const lineRefs          = useRef([])
  const stageRefs         = useRef([])
  const heroLabelRef      = useRef(null)
  const heroHeadingRef    = useRef(null)
  const heroSubRef        = useRef(null)
  const scrollCueRef      = useRef(null)

  const brushCanvasRefs = useRef([])
  const loadedPhoto2    = useRef([])
  const brushMaskRef    = useRef(null)

  // ── Lenis + ScrollTrigger integration ──────────────────────────
  useEffect(() => {
    const lenis = new Lenis({
      duration: 0.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.8,
      syncTouch: true,
    })
    lenisRef.current = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const ticker = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(ticker)
    gsap.ticker.lagSmoothing(0)
    return () => { gsap.ticker.remove(ticker); lenis.destroy() }
  }, [])

  // ── Preload color photos + brush mask ──────────────────────────
  useEffect(() => {
    people.forEach((person, i) => {
      if (!person.photo2) return
      const img = new Image()
      img.onload  = () => { loadedPhoto2.current[i] = img }
      img.onerror = () => { loadedPhoto2.current[i] = null }
      img.src = person.photo2
    })
    const bi = new Image()
    bi.onload = () => {
      const mc = document.createElement('canvas')
      mc.width  = bi.naturalWidth
      mc.height = bi.naturalHeight
      const mCtx = mc.getContext('2d')
      mCtx.drawImage(bi, 0, 0)
      const id = mCtx.getImageData(0, 0, mc.width, mc.height)
      const px = id.data
      for (let i = 0; i < px.length; i += 4) {
        const lum = px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114
        px[i] = px[i + 1] = px[i + 2] = 0
        px[i + 3] = Math.round(255 - lum)
      }
      mCtx.putImageData(id, 0, 0)
      brushMaskRef.current = mc
    }
    bi.src = '/brush-stroke.png'
  }, [])

  // ── Canvas resize observer ─────────────────────────────────────
  useEffect(() => {
    const observers = []
    brushCanvasRefs.current.forEach((canvas) => {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      if (rect.width > 0) {
        canvas.width  = Math.round(rect.width)
        canvas.height = Math.round(rect.height)
      }
      const ro = new ResizeObserver(entries => {
        for (const e of entries) {
          canvas.width  = Math.round(e.contentRect.width)
          canvas.height = Math.round(e.contentRect.height)
        }
      })
      ro.observe(canvas)
      observers.push(ro)
    })
    return () => observers.forEach(ro => ro.disconnect())
  }, [])

  // ── GSAP animations ────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      // Hero: animated entrance (respects reduced-motion)
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        if (!heroHeadingRef.current) return
        gsap.set(heroHeadingRef.current, { y: 20 })
        const heroTl = gsap.timeline({ delay: 0.2 })
        heroTl
          .to(heroLabelRef.current,   { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' })
          .to(heroHeadingRef.current, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.4')
          .to(heroSubRef.current,     { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
          .to(scrollCueRef.current,   { opacity: 1, duration: 0.5 }, '-=0.1')
      })

      // Reduced motion: instantly reveal hero
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(
          [heroLabelRef.current, heroHeadingRef.current, heroSubRef.current, scrollCueRef.current],
          { opacity: 1, clearProps: 'transform' }
        )
      })

      // Global page progress bar
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => setProgress(self.progress * 100),
      })

      // ── Desktop: pinned per-person scroll timelines ─────────────
      mm.add('(min-width: 769px) and (prefers-reduced-motion: no-preference)', () => {
        people.forEach((_, i) => {
          const sectionEl  = sectionRefs.current[i]
          const photoLayer = photoLayerRefs.current[i]
          const canvas     = brushCanvasRefs.current[i]
          const tagAmEl    = textElemRefs.current[i]?.[0]
          const nameEl     = nameRefs.current[i]
          const bioEl      = textElemRefs.current[i]?.[2]
          const ghostEl    = ghostNumRefs.current[i]
          const lineEl     = lineRefs.current[i]
          const stageEl    = stageRefs.current[i]
          const reverseDir = i % 2 === 1
          if (!sectionEl || !photoLayer) return

          // Set initial hidden states (before ScrollTrigger fires)
          gsap.set(photoLayer, { opacity: 0 })
          if (tagAmEl) gsap.set(tagAmEl, { opacity: 0, y: 20 })
          if (nameEl)  gsap.set(nameEl,  { opacity: 1 }) // wrapper stays, chars are hidden
          if (bioEl)   gsap.set(bioEl,   { opacity: 0, y: 20 })
          if (ghostEl) gsap.set(ghostEl, { opacity: 0 })
          if (lineEl)  gsap.set(lineEl,  { scaleX: 0, opacity: 0 })
          if (stageEl) gsap.set(stageEl, { transformOrigin: 'center center' })

          const split = new SplitText(nameEl, { type: 'chars' })
          gsap.set(split.chars, { opacity: 0, y: 22 })

          // Pre-reveal: photo fades in as section approaches viewport (before pin fires)
          ScrollTrigger.create({
            trigger: sectionEl,
            start: 'top 85%',
            end: 'top top',
            onEnter:     () => gsap.to(photoLayer, { opacity: 1, duration: 0.5, overwrite: true }),
            onLeaveBack: () => gsap.to(photoLayer, { opacity: 0, duration: 0.3, overwrite: true }),
          })

          const tl = gsap.timeline({
            scrollTrigger: {
              id: `person-${i}`,
              trigger: sectionEl,
              start: 'top top',
              end: '+=150%',
              scrub: 1,
              pin: true,
              anticipatePin: 1,
              onEnter:     () => setActiveIdx(i),
              onEnterBack: () => setActiveIdx(i),
              onUpdate: (self) => {
                // Drive canvas ink brush from scroll progress
                if (canvas && loadedPhoto2.current[i] && brushMaskRef.current &&
                    canvas.width > 0 && canvas.height > 0) {
                  const p = self.progress
                  const headP = gsap.utils.clamp(0, 1, (p - BRUSH_APPEAR_START) / (BRUSH_APPEAR_END - BRUSH_APPEAR_START))
                  const evapP = gsap.utils.clamp(0, 1, (p - BRUSH_APPEAR_END)   / (BRUSH_EVAP_END   - BRUSH_APPEAR_END))
                  drawInkBrush(canvas, loadedPhoto2.current[i], brushMaskRef.current, headP, evapP, reverseDir)
                } else if (canvas) {
                  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
                }
              },
            },
          })

          // 15–33%: ghost number + tag/AM text slide up
          if (ghostEl) tl.to(ghostEl, { opacity: 1, duration: 0.12, ease: 'power1.out' }, 0.15)
          if (tagAmEl) tl.to(tagAmEl, { opacity: 1, y: 0, duration: 0.18, ease: 'power2.out' }, 0.20)

          // 28–60%: name characters stagger in
          tl.to(split.chars, { opacity: 1, y: 0, stagger: 0.016, duration: 0.28, ease: 'power2.out' }, 0.28)

          // 40–65%: bio paragraph slides up
          if (bioEl) tl.to(bioEl, { opacity: 1, y: 0, duration: 0.24, ease: 'power2.out' }, 0.40)

          // 55–65%: decorative line draws left→right
          if (lineEl) tl.to(lineEl, { scaleX: 1, opacity: 1, duration: 0.10, ease: 'power1.inOut' }, 0.55)

          // 65–72%: text exits (snappy — makes room for the depth exit)
          const textFadeTargets = [tagAmEl, bioEl, ghostEl, lineEl].filter(Boolean)
          tl.to(textFadeTargets, { opacity: 0, duration: 0.07 }, 0.65)
          tl.to(split.chars,     { opacity: 0, y: -12, stagger: 0.005, duration: 0.06 }, 0.65)
          if (tagAmEl) tl.to(tagAmEl, { y: -10, duration: 0.07 }, 0.65)

          // 70–95%: depth exit — stage zooms forward like a camera flying into the scene
          if (stageEl) {
            tl.to(stageEl, { scale: 1.10,  duration: 0.25, ease: 'power1.in'  }, 0.70)
            // Cut to black — cinematic before next section
            tl.to(stageEl, { opacity: 0,   duration: 0.05, ease: 'power2.in'  }, 0.95)
          }

          return () => split.revert()
        })
      })

      // Desktop + reduced-motion: show static, still pin for pacing
      mm.add('(min-width: 769px) and (prefers-reduced-motion: reduce)', () => {
        people.forEach((_, i) => {
          const sectionEl  = sectionRefs.current[i]
          const photoLayer = photoLayerRefs.current[i]
          const tagAmEl    = textElemRefs.current[i]?.[0]
          const nameEl     = nameRefs.current[i]
          const bioEl      = textElemRefs.current[i]?.[2]
          if (!sectionEl) return
          gsap.set([photoLayer, tagAmEl, nameEl, bioEl].filter(Boolean), { opacity: 1, clearProps: 'transform' })
          ScrollTrigger.create({
            id: `person-${i}`,
            trigger: sectionEl,
            start: 'top top',
            end: '+=150%',
            pin: true,
            anticipatePin: 1,
            onEnter:     () => setActiveIdx(i),
            onEnterBack: () => setActiveIdx(i),
          })
        })
      })

      // ── Mobile: simple stacked scroll-triggered reveals ─────────
      mm.add('(max-width: 768px)', () => {
        people.forEach((_, i) => {
          const sectionEl  = sectionRefs.current[i]
          const photoLayer = photoLayerRefs.current[i]
          const tagAmEl    = textElemRefs.current[i]?.[0]
          const nameEl     = nameRefs.current[i]
          const bioEl      = textElemRefs.current[i]?.[2]
          if (!sectionEl) return

          const allEls = [photoLayer, tagAmEl, nameEl, bioEl].filter(Boolean)
          gsap.set(allEls, { opacity: 0, y: 40 })

          gsap.to(allEls, {
            opacity: 1,
            y: 0,
            stagger: 0.12,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionEl,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
              onEnter: () => setActiveIdx(i),
            },
          })
        })
      })

    }, scopeRef)

    return () => ctx.revert()
  }, [])

  const scrollToSection = (i) => {
    const st = ScrollTrigger.getById(`person-${i}`)
    if (st && lenisRef.current) {
      lenisRef.current.scrollTo(st.start)
    } else if (sectionRefs.current[i] && lenisRef.current) {
      lenisRef.current.scrollTo(sectionRefs.current[i])
    }
  }

  return (
    <div ref={scopeRef} className={styles.aboutPage}>

      <div className={styles.grain} />
      <div className={styles.progressBar} style={{ width: `${progress}%` }} />

      <div className={styles.dotNav}>
        {people.map((person, i) => (
          <button
            key={i}
            className={`${styles.dot} ${activeIdx === i ? styles.dotActive : ''}`}
            onClick={() => scrollToSection(i)}
            aria-label={person.first}
          />
        ))}
      </div>

      <section className={styles.hero}>
        <div className={styles.heroBg}>TEAM</div>
        <div className={styles.heroContent}>
          <div ref={heroLabelRef} className={styles.heroLabel}>The People Behind Everything</div>
          <h1 ref={heroHeadingRef} className={styles.heroHeading}>
            Meet The <em>Team</em>
          </h1>
          <p ref={heroSubRef} className={styles.heroSub}>
            Four individuals. One shared vision. Scroll to discover the people shaping our future.
          </p>
        </div>
        <div ref={scrollCueRef} className={styles.scrollCue}>
          <span>Scroll</span>
          <div className={styles.scrollLine} />
        </div>
      </section>

      {people.map((person, i) => (
        <div
          key={i}
          ref={el => { sectionRefs.current[i] = el }}
          className={styles.personSection}
        >
          <div
            ref={el => { stageRefs.current[i] = el }}
            className={styles.stage}
          >
            <div className={styles.photoFrame}>
              <div className={styles.ovT} />
              <div className={styles.ovB} />
              <div className={styles.ovL} />
              <div className={styles.ovR} />

              <div
                ref={el => { photoLayerRefs.current[i] = el }}
                className={styles.personLayer}
              >
                <div className={styles.photoWrap}>
                  {!photoErrors[i] ? (
                    <img
                      src={person.photo}
                      alt={person.first}
                      className={styles.photo}
                      onError={() => setPhotoErrors(prev => ({ ...prev, [i]: true }))}
                    />
                  ) : (
                    <div className={styles.photoPlaceholder}>{person.first[0]}</div>
                  )}
                  {person.photo2 && (
                    <>
                      <canvas
                        ref={el => { brushCanvasRefs.current[i] = el }}
                        className={styles.brushCanvas}
                        aria-hidden="true"
                      />
                      <img
                        src={person.photo2}
                        alt={`${person.first} color`}
                        className={styles.brushCanvasMobileFallback}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

            <div
              ref={el => { ghostNumRefs.current[i] = el }}
              className={`${styles.ghostNum} ${[1, 3].includes(i) ? styles.ghostNumLeft : ''}`}
            >
              <span>0{i + 1}</span>
            </div>

            <div
              ref={el => { textLayerRefs.current[i] = el }}
              className={`${styles.textLayer} ${textPos[i]}`}
            >
              <div ref={el => { if (textElemRefs.current[i]) textElemRefs.current[i][0] = el }}>
                <span className={styles.tag}>{person.tag}</span>
                <span className={styles.am}>AM: {person.am}</span>
              </div>
              <h2
                ref={el => {
                  nameRefs.current[i] = el
                  if (textElemRefs.current[i]) textElemRefs.current[i][1] = el
                }}
                className={styles.personName}
              >
                {person.first}
              </h2>
              <p
                ref={el => { if (textElemRefs.current[i]) textElemRefs.current[i][2] = el }}
                className={styles.bio}
              >
                {person.bio}
              </p>
              <div ref={el => { lineRefs.current[i] = el }} className={styles.personLine} />
            </div>
          </div>
        </div>
      ))}

      <section className={styles.outro}>
        <h2 className={styles.outroHeading}>
          The Vision<br /><em>Continues</em>
        </h2>
        <p className={styles.outroText}>
          Four minds. Infinite possibilities. This is just the beginning of our story.
        </p>
      </section>

      <div className={styles.ctaRow}>
        <Link to="/movies" className={styles.ctaBtn}>
          Browse Movies
        </Link>
      </div>

      {showVideo && (
        <VideoIntro onComplete={() => setShowVideo(false)} />
      )}
    </div>
  )
}
