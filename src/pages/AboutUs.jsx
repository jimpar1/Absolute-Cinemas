import { useState, useEffect, useRef, useCallback } from 'react'
import Lenis from 'lenis'
import styles from './AboutUs.module.css'

const people = [
  {
    first: "Dimitris",
    last: "",
    tag: "The Swiss Knife",
    am: "21390314",
    bio: "With great CODE comes Great Responsibility. So don't let the bugs out!!",
    quote: '"With great CODE comes Great Responsibility"',
    effect: "clip-zoom",
    photo: "/team/person1.jpg",
  },
  {
    first: "Nikos",
    last: "Makos",
    tag: "The MegaDev",
    am: "21390284",
    bio: "Debugging code in the morning, breaking hearts at night. Full-stack developer specializing in 'good-times-as-a-service'. If life was a script, mine would only have high-end vibes and zero errors. Cheers to good drinks and even better company.",
    quote: '"Debugging code in the morning, breaking hearts at night"',
    effect: "split",
    photo: "/team/person2.jpg",
  },
  {
    first: "George",
    last: "",
    tag: "The .exeCutor",
    am: "22390221",
    bio: "Stack full. Glass full. Low latency in thought, high standards in life. I don't chase trends — I write version control in reality. Street vibes with production discipline.",
    quote: '"Stack full. Glass full. Low latency in thought"',
    effect: "blur",
    photo: "/team/person3.jpg",
  },
  {
    first: "Sotiris",
    last: "",
    tag: "Ma1c OS",
    am: "20390136",
    bio: "The System's Operator. Keeping everything running smoothly.",
    quote: '"The System\'s Operator"',
    effect: "blinds",
    photo: "/team/person4.jpg",
  },
]

const effectClass = {
  'clip-zoom': styles.fxClipZoom,
  'split': styles.fxSplit,
  'blur': styles.fxBlur,
  'blinds': styles.fxBlinds,
}

const ghostPos = ['left', 'right', 'left', 'right']
const textPos = [styles.ptBl, styles.ptCr, styles.ptCl, styles.ptBr]
const sigPos = [styles.sTr, styles.sBl, styles.sTl, styles.sBr]

export default function AboutUs() {
  const [progress, setProgress] = useState(0)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [visibleSet, setVisibleSet] = useState(new Set())
  const lenisRef = useRef(null)
  const sectionsRef = useRef([])

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    lenisRef.current = lenis

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    const frameId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(frameId)
      lenis.destroy()
    }
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const st = window.scrollY
      const dh = document.documentElement.scrollHeight - window.innerHeight
      setProgress(dh > 0 ? (st / dh) * 100 : 0)

      let newActive = -1
      const newVisible = new Set()

      sectionsRef.current.forEach((el, i) => {
        if (!el) return
        const r = el.getBoundingClientRect()
        if (r.top < window.innerHeight * 0.55 && r.bottom > window.innerHeight * 0.25) {
          newVisible.add(i)
          newActive = i
        }
      })
      setVisibleSet(newVisible)
      setActiveIdx(newActive)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToSection = useCallback((i) => {
    const el = sectionsRef.current[i]
    if (el && lenisRef.current) {
      lenisRef.current.scrollTo(el, { offset: -64 })
    } else if (i === 0 && lenisRef.current) {
      lenisRef.current.scrollTo(0)
    }
  }, [])

  return (
    <div className={styles.aboutPage}>
      <div className={styles.grain} />
      <div className={styles.progressBar} style={{ width: `${progress}%` }} />

      <div className={styles.dotNav}>
        {people.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${activeIdx === i ? styles.dotActive : ''}`}
            onClick={() => scrollToSection(i)}
            aria-label={`Go to person ${i + 1}`}
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

      {people.map((person, i) => (
        <div key={i}>
          {i > 0 && (
            <div className={styles.divider}>
              <div className={styles.dividerLine} />
            </div>
          )}
          <section
            ref={(el) => (sectionsRef.current[i] = el)}
            className={`
              ${styles.personSection}
              ${effectClass[person.effect] || ''}
              ${visibleSet.has(i) ? styles.inView : ''}
            `}
          >
            <div className={styles.personSticky}>
              <div className={`${styles.ghostNum} ${styles[`gn${ghostPos[i].charAt(0).toUpperCase() + ghostPos[i].slice(1)}`]}`}>
                0{i + 1}
              </div>

              <div className={styles.photoContainer}>
                <div className={styles.ovT} />
                <div className={styles.ovB} />
                <div className={styles.ovL} />
                <div className={styles.ovR} />
                <div className={styles.photoWrap}>
                  <img
                    src={person.photo}
                    alt={person.first}
                    className={styles.photo}
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                  <div className={styles.photoPlaceholder} style={{ display: 'none' }}>
                    {person.first[0]}
                  </div>
                </div>
              </div>

              <div className={`${styles.signature} ${sigPos[i]}`}>
                {person.first}
              </div>

              <div className={`${styles.personText} ${textPos[i]}`}>
                <div className={`${styles.textReveal} ${styles.delay1}`}>
                  <span className={styles.tag}>{person.tag}</span>
                  <span className={styles.am}>AM: {person.am}</span>
                </div>
                <div className={`${styles.textReveal} ${styles.delay2}`}>
                  <h2 className={styles.personName}>
                    {person.first}
                    {person.last && <em>{person.last}</em>}
                  </h2>
                </div>
                <div className={`${styles.textReveal} ${styles.delay3}`}>
                  <p className={styles.bio}>{person.bio}</p>
                </div>
              </div>

              <div className={`${styles.pullQuote} ${styles.textReveal} ${styles.delay4}`}>
                <blockquote>{person.quote}</blockquote>
              </div>
            </div>
          </section>
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
    </div>
  )
}
