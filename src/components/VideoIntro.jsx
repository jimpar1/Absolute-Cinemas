import { useState, useEffect, useRef } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
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

export default function VideoIntro({ onComplete, preloadedVideoEl }) {
  const [videoText, setVideoText] = useState('')
  const [videoZoom, setVideoZoom] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const videoContainerRef = useRef(null)
  const videoRef = useRef(null)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    setIsVisible(true)
  }, [])

  useEffect(() => {
    const container = videoContainerRef.current
    if (!container) return

    // Reuse the already-buffered element, or fall back to a fresh one
    const video = preloadedVideoEl ?? (() => {
      const el = document.createElement('video')
      el.src = '/intro.mp4'
      el.preload = 'auto'
      return el
    })()

    // eslint-disable-next-line react-hooks/immutability
    video.className = styles.video
    video.playsInline = true
    videoRef.current = video
    container.appendChild(video)

    video.onended = () => {
      setIsVisible(false)
      setTimeout(() => onCompleteRef.current?.(), 500)
    }

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

    // Try unmuted play first; browsers may block it — fall back to muted.
    // Ignore AbortError: React Strict Mode fires the effect twice and the first
    // play() gets aborted by the cleanup — that is not a real failure.
    video.muted = false
    video.play()
      .then(() => setIsMuted(false))
      .catch(() => {
        video.muted = true
        setIsMuted(true)
        video.play().catch((e) => {
          if (e?.name !== 'AbortError') onCompleteRef.current?.()
        })
      })

    return () => {
      video.removeEventListener('timeupdate', updateText)
      video.onended = null
      if (container.contains(video)) container.removeChild(video)
    }
  }, [preloadedVideoEl])

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
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
      <div ref={videoContainerRef} className={styles.videoContainer} />
      <div className={styles.videoOverlay}>
        <div className={`${styles.videoText} ${videoText ? styles.visible : ''} ${videoZoom ? styles.zoom : ''}`}>
          {videoText}
        </div>
      </div>
      <div className={styles.videoControls}>
        <button className={styles.muteButton} onClick={handleMuteToggle} title={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <button className={styles.skipButton} onClick={handleSkip}>SKIP</button>
      </div>
    </div>
  )
}
