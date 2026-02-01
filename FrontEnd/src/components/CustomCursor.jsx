import { useEffect, useRef } from 'react'
import styles from './CustomCursor.module.css'

export default function CustomCursor() {
  const innerRef = useRef(null)
  const outerRef = useRef(null)
  const mouseX = useRef(-200)
  const mouseY = useRef(-200)
  const outerX = useRef(-200)
  const outerY = useRef(-200)

  useEffect(() => {
    let animId
    let shown = false

    const onMove = (e) => {
      mouseX.current = e.clientX
      mouseY.current = e.clientY
      if (!shown) {
        shown = true
        if (innerRef.current) innerRef.current.style.opacity = '1'
        if (outerRef.current) outerRef.current.style.opacity = '1'
      }
    }

    const lerp = (a, b, t) => a + (b - a) * t

    const tick = () => {
      outerX.current = lerp(outerX.current, mouseX.current, 0.1)
      outerY.current = lerp(outerY.current, mouseY.current, 0.1)

      if (innerRef.current)
        innerRef.current.style.transform = `translate(${mouseX.current - 4}px, ${mouseY.current - 4}px)`
      if (outerRef.current)
        outerRef.current.style.transform = `translate(${outerX.current - 20}px, ${outerY.current - 20}px)`

      animId = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove)
    animId = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <>
      <div ref={outerRef} className={styles.cursorOuter} />
      <div ref={innerRef} className={styles.cursorInner} />
    </>
  )
}
