import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Lenis from 'lenis'
import styles from './AboutUs.module.css'
import VideoIntro from '../components/VideoIntro'

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

// Ink brush constants
const BRUSH_END     = 0.18   // brush head reaches full width
const EVAPORATE_END = 0.35   // brush tail catches head (fully gone)

// Text element stagger: 3 elements per person (tag+am, name, bio)
const TEXT_IN       = [0.18, 0.22, 0.26]   // text starts when brush hits max
const TEXT_OUT      = [0.88, 0.86, 0.84]   // fade-out start (reverse order)
const TEXT_FADE_DUR = 0.08                  // duration of each fade (as fraction of local)

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
  const [progress, setProgress] = useState(0)
  const [activeIdx, setActiveIdx] = useState(0)
  const [photoErrors, setPhotoErrors] = useState({})
  const [showVideo, setShowVideo] = useState(false)

  const lenisRef = useRef(null)
  const containerRef = useRef(null)
  const photoLayerRefs = useRef([])
  const textLayerRefs = useRef([])
  const textElemRefs = useRef(people.map(() => Array(3).fill(null)))
  const ghostNumRef = useRef(null)
  const cursorInnerRef = useRef(null)
  const cursorOuterRef = useRef(null)
  const mouseX = useRef(-200)
  const mouseY = useRef(-200)
  const outerX = useRef(-200)
  const outerY = useRef(-200)

  const brushCanvasRefs = useRef([])   // one <canvas> per person
  const loadedPhoto2    = useRef([])   // preloaded Image objects
  const brushMaskRef    = useRef(null) // converted brush PNG → alpha mask canvas
  const ghostNumRef2    = useRef(null) // ghost number element for opacity control

  // Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    lenisRef.current = lenis
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf) }
    const frameId = requestAnimationFrame(raf)
    return () => { cancelAnimationFrame(frameId); lenis.destroy() }
  }, [])

  // Preload color photos into Image objects for canvas drawing
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
      // Convert white-background PNG → alpha mask (dark = opaque, light = transparent)
      const mc = document.createElement('canvas')
      mc.width  = bi.naturalWidth
      mc.height = bi.naturalHeight
      const mCtx = mc.getContext('2d')
      mCtx.drawImage(bi, 0, 0)
      const id   = mCtx.getImageData(0, 0, mc.width, mc.height)
      const px   = id.data
      for (let i = 0; i < px.length; i += 4) {
        const lum   = px[i] * 0.299 + px[i+1] * 0.587 + px[i+2] * 0.114
        px[i]       = 0
        px[i+1]     = 0
        px[i+2]     = 0
        px[i+3]     = Math.round(255 - lum)   // dark → opaque, white → transparent
      }
      mCtx.putImageData(id, 0, 0)
      brushMaskRef.current = mc
    }
    bi.src = '/brush-stroke.png'
  }, [])

  // Keep canvas bitmap size in sync with CSS layout size
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

  // Scroll handler: progress bar + phase-based crossfade
  useEffect(() => {
    const onScroll = () => {
      const st = window.scrollY
      const dh = document.documentElement.scrollHeight - window.innerHeight
      setProgress(dh > 0 ? (st / dh) * 100 : 0)

      const container = containerRef.current
      if (!container) return

      const r = container.getBoundingClientRect()
      const totalScroll = container.offsetHeight - window.innerHeight
      if (totalScroll <= 0) return

      const globalProg = Math.max(0, Math.min(1, -r.top / totalScroll))

      let currentActive = 0

      people.forEach((_, i) => {
        const phaseStart = i / people.length
        const phaseEnd = (i + 1) / people.length
        const phaseLen = phaseEnd - phaseStart

        const local = Math.max(0, Math.min(1,
          (globalProg - phaseStart) / phaseLen
        ))

        // Photo layer opacity
        let photoOp
        if (i === 0) {
          photoOp = local > 0.88 ? (1 - local) / 0.12 : 1
        } else if (local <= 0) {
          photoOp = 0
        } else if (local < 0.06) {
          photoOp = local / 0.06          // fast fade-in for grayscale photo
        } else if (i < people.length - 1 && local > 0.88) {
          photoOp = (1 - local) / 0.12
        } else {
          photoOp = 1
        }

        if (photoLayerRefs.current[i]) {
          photoLayerRefs.current[i].style.opacity = photoOp
          photoLayerRefs.current[i].style.visibility = photoOp > 0 || i === 0 ? 'visible' : 'hidden'
        }

        // Canvas ink brush for photo2
        const canvas   = brushCanvasRefs.current[i]
        const photoImg = loadedPhoto2.current[i]

        if (canvas && photoImg && canvas.width > 0 && canvas.height > 0) {
          const headProgress = Math.min(1, local / BRUSH_END)
          const evapProgress = local < BRUSH_END
            ? 0
            : Math.min(1, (local - BRUSH_END) / (EVAPORATE_END - BRUSH_END))
          const reverseDirection = i === 1 || i === 3
          drawInkBrush(canvas, photoImg, brushMaskRef.current, headProgress, evapProgress, reverseDirection)
        } else if (canvas) {
          canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
        }

        // Staggered text elements — 3 elements: tag+am, name, bio
        let anyVisible = false
        for (let j = 0; j < 3; j++) {
          const inStart  = TEXT_IN[j]
          const outStart = TEXT_OUT[j]
          let elemOp
          if (local < inStart) {
            elemOp = 0
          } else if (local < inStart + TEXT_FADE_DUR) {
            elemOp = (local - inStart) / TEXT_FADE_DUR
          } else if (local < outStart) {
            elemOp = 1
          } else if (local < outStart + TEXT_FADE_DUR) {
            elemOp = (outStart + TEXT_FADE_DUR - local) / TEXT_FADE_DUR
          } else {
            elemOp = 0
          }
          if (elemOp > 0) anyVisible = true
          const el = textElemRefs.current[i]?.[j]
          if (el) el.style.opacity = elemOp
        }

        // Text layer wrapper: only controls visibility for pointer-events
        if (textLayerRefs.current[i]) {
          textLayerRefs.current[i].style.visibility = anyVisible ? 'visible' : 'hidden'
        }

        if (local > 0.05) currentActive = i
      })

      setActiveIdx(currentActive)
      if (ghostNumRef.current) {
        ghostNumRef.current.textContent = `0${currentActive + 1}`
      }

      // Ghost number opacity: fade in when brush starts, fade out at TEXT_OUT[0]
      if (ghostNumRef2.current) {
        const brushStartProgress = BRUSH_END
        const brushFadeOutProgress = TEXT_OUT[0]
        const ghostFadeInDur = 0.08
        const globalLocalProgress = (globalProg - (currentActive / people.length)) / (1 / people.length)

        let ghostOp
        if (globalLocalProgress < brushStartProgress) {
          ghostOp = 0
        } else if (globalLocalProgress < brushStartProgress + ghostFadeInDur) {
          ghostOp = (globalLocalProgress - brushStartProgress) / ghostFadeInDur
        } else if (globalLocalProgress < brushFadeOutProgress) {
          ghostOp = 1
        } else if (globalLocalProgress < brushFadeOutProgress + ghostFadeInDur) {
          ghostOp = (brushFadeOutProgress + ghostFadeInDur - globalLocalProgress) / ghostFadeInDur
        } else {
          ghostOp = 0
        }
        ghostNumRef2.current.style.opacity = ghostOp
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Custom cursor
  useEffect(() => {
    let animId
    let shown = false

    const onMove = (e) => {
      mouseX.current = e.clientX
      mouseY.current = e.clientY
      if (!shown) {
        shown = true
        if (cursorInnerRef.current) cursorInnerRef.current.style.opacity = '1'
        if (cursorOuterRef.current) cursorOuterRef.current.style.opacity = '1'
      }
    }

    const lerp = (a, b, t) => a + (b - a) * t

    const tick = () => {
      outerX.current = lerp(outerX.current, mouseX.current, 0.1)
      outerY.current = lerp(outerY.current, mouseY.current, 0.1)

      if (cursorInnerRef.current)
        cursorInnerRef.current.style.transform = `translate(${mouseX.current - 4}px, ${mouseY.current - 4}px)`
      if (cursorOuterRef.current)
        cursorOuterRef.current.style.transform = `translate(${outerX.current - 20}px, ${outerY.current - 20}px)`

      animId = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove)
    animId = requestAnimationFrame(tick)
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(animId) }
  }, [])

  const scrollToSection = useCallback((i) => {
    if (!lenisRef.current || !containerRef.current) return
    const container = containerRef.current
    const totalScroll = container.offsetHeight - window.innerHeight
    const phaseStart = i / people.length
    const targetScroll = container.offsetTop + phaseStart * totalScroll
    lenisRef.current.scrollTo(targetScroll, { offset: 0 })
  }, [])

  return (
    <div className={styles.aboutPage}>
      <div ref={cursorOuterRef} className={styles.cursorOuter} />
      <div ref={cursorInnerRef} className={styles.cursorInner} />

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
          <div className={styles.heroLabel}>The People Behind Everything</div>
          <h1 className={styles.heroHeading}>
            Meet The <em>Team</em>
          </h1>
          <p className={styles.heroSub}>
            Four individuals. One shared vision. Scroll to discover the people shaping our future.
          </p>
        </div>
        <div className={styles.scrollCue}>
          <span>Scroll</span>
          <div className={styles.scrollLine} />
        </div>
      </section>

      {/* Scroll-driven crossfade container */}
      <div ref={containerRef} className={styles.scrollContainer}>
        <div className={styles.stage}>
          {/* Photo frame — gradient overlays stable */}
          <div className={styles.photoFrame}>
            <div className={styles.ovT} />
            <div className={styles.ovB} />
            <div className={styles.ovL} />
            <div className={styles.ovR} />

            {people.map((person, i) => (
              <div
                key={i}
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
            ))}
          </div>

          {/* Ghost number */}
          <div ref={ghostNumRef2} className={`${styles.ghostNum} ${[1, 3].includes(activeIdx) ? styles.ghostNumLeft : ''}`}>
            <span ref={ghostNumRef}>01</span>
          </div>

          {/* Text layers — each person's text block, elements stagger individually */}
          {people.map((person, i) => (
            <div
              key={`text-${i}`}
              ref={el => { textLayerRefs.current[i] = el }}
              className={`${styles.textLayer} ${textPos[i]}`}
            >
              <div ref={el => { textElemRefs.current[i][0] = el }} style={{ opacity: 0 }}>
                <span className={styles.tag}>{person.tag}</span>
                <span className={styles.am}>AM: {person.am}</span>
              </div>
              <h2
                ref={el => { textElemRefs.current[i][1] = el }}
                className={styles.personName}
                style={{ opacity: 0 }}
              >
                {person.first}
              </h2>
              <p
                ref={el => { textElemRefs.current[i][2] = el }}
                className={styles.bio}
                style={{ opacity: 0 }}
              >
                {person.bio}
              </p>
            </div>
          ))}
        </div>
      </div>

      <section className={styles.outro}>
        <h2 className={styles.outroHeading}>
          The Vision<br /><em>Continues</em>
        </h2>
        <p className={styles.outroText}>
          Four minds. Infinite possibilities. This is just the beginning of our story.
        </p>
      </section>

      {/* ── Bottom CTA buttons ── */}
      <div className={styles.ctaRow}>
        <button className={styles.ctaBtn} onClick={() => setShowVideo(true)}>
          Watch Intro
        </button>
        <Link to="/movies" className={styles.ctaBtn}>
          Browse Movies
        </Link>
      </div>

      {/* ── Video modal ── */}
      {showVideo && (
        <VideoIntro onComplete={() => setShowVideo(false)} />
      )}
    </div>
  )
}
