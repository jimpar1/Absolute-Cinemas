/**
 * CookieNotice – A cinematic, dark-themed consent banner.
 * Informs the user about local storage (tickets/watchlist) and Stripe.
 */

import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import styles from './CookieNotice.module.css'

export default function CookieNotice() {
    const [visible, setVisible] = useState(false)
    const containerRef = useRef(null)

    useEffect(() => {
        // Only show if the user hasn't accepted already
        const hasAccepted = localStorage.getItem('cookiesAccepted')
        if (!hasAccepted) {
            // Delay the appearance slightly for a better feel
            const timer = setTimeout(() => {
                setVisible(true)
            }, 2500)
            return () => clearTimeout(timer)
        }
    }, [])

    useEffect(() => {
        if (visible && containerRef.current) {
            gsap.to(containerRef.current, {
                y: 0,
                duration: 0.8,
                ease: 'power3.out'
            })
        }
    }, [visible])

    const handleAccept = () => {
        if (containerRef.current) {
            gsap.to(containerRef.current, {
                y: '120%',
                opacity: 0,
                duration: 0.6,
                ease: 'power3.in',
                onComplete: () => {
                    localStorage.setItem('cookiesAccepted', 'true')
                    setVisible(false)
                }
            })
        }
    }

    if (!visible) return null

    return (
        <div ref={containerRef} className={styles.noticeContainer}>
            <p className={styles.noticeText}>
                <strong>Absolute Cinemas</strong> uses local storage to save your 
                tickets, watchlist, and preferences locally on your browser. 
                We also use <strong>Stripe</strong> for secure, encrypted payments.
            </p>
            <div className={styles.noticeActions}>
                <button className={styles.acceptBtn} onClick={handleAccept}>
                    Accept
                </button>
                <button className={styles.secondaryBtn} onClick={handleAccept}>
                    I Understand
                </button>
            </div>
        </div>
    )
}
