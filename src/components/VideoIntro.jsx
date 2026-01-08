import { useState, useEffect, useRef } from 'react'
import styles from './VideoIntro.module.css'

const videoTexts = [
  { time: 0, text: "EVERY GREAT MOVIE", duration: 2000 },
  { time: 2000, text: "STARTS WITH A STORY", duration: 1500 },
  { time: 3500, text: "...WORTH TELLING.", duration: 1500, zoom: true },
  { time: 5000, text: "TOO MUCH CAFFEINE", duration: 1500 },
  { time: 6500, text: "ONE BOLD QUESTION:", duration: 1500 },
  { time: 8000, text: "WHAT IF", duration: 1500 },
  { time: 9500, text: "WE BUILT A CINEMA?", duration: 2000 },
  { time: 11500, text: "FOR STUDENTS", duration: 1500 },
  { time: 13000, text: "ONE MISSION", duration: 1500 },
  { time: 14500, text: "ABSOLUTE CINEMAS", duration: 3000 },
]

const VIDEO_DURATION = 17500

export default function VideoIntro({ onComplete }) {
  const [videoText, setVideoText] = useState('')
  const [videoZoom, setVideoZoom] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateText = () => {
      const currentTime = video.currentTime * 1000
      for (let i = videoTexts.length - 1; i >= 0; i--) {
        if (currentTime >= videoTexts[i].time) {
          setVideoText(videoTexts[i].text)
          setVideoZoom(videoTexts[i].zoom || false)
          break
        }
      }
    }

    video.addEventListener('timeupdate', updateText)
    
    video.play().catch(() => {})

    return () => {
      video.removeEventListener('timeupdate', updateText)
    }
  }, [])

  const handleEnded = () => {
    setIsVisible(false)
    setTimeout(() => {
      onComplete()
    }, 500)
  }

  const handleSkip = () => {
    if (videoRef.current) {
      videoRef.current.pause()
    }
    setIsVisible(false)
    setTimeout(() => {
      onComplete()
    }, 500)
  }

  return (
    <div className={`${styles.videoIntro} ${!isVisible ? styles.hidden : ''}`}>
      <div className={styles.videoBackground} />
      <video
        ref={videoRef}
        className={styles.video}
        muted
        playsInline
        onEnded={handleEnded}
        preload="auto"
      >
        <source src="/intro.mp4" type="video/mp4" />
      </video>
      <div className={styles.videoOverlay}>
        <div className={`${styles.videoText} ${videoText ? styles.visible : ''} ${videoZoom ? styles.zoom : ''}`}>
          {videoText}
        </div>
      </div>
      <button className={styles.skipButton} onClick={handleSkip}>
        SKIP
      </button>
    </div>
  )
}
