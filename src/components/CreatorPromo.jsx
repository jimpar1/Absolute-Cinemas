import { useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import styles from './CreatorPromo.module.css'

const CREATORS = [
    { name: 'Dimitris', tag: 'The Swiss Knife',  photo: '/team/absolute-egw.webp'    },
    { name: 'Nikos',    tag: 'The MegaDev',       photo: '/team/absolute-nikos.webp'  },
    { name: 'Giorgos',  tag: 'The .exeCutor',     photo: '/team/absolute-tzimos.webp' },
    { name: 'Sotiris',  tag: 'Ma1c OS',           photo: '/team/absolute-makos.webp'  },
]

export default function CreatorPromo() {
    const cardRef = useRef(null)

    const handleMouseMove = (e) => {
        const card = cardRef.current
        if (!card) return
        const rect = card.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dx = (e.clientX - cx) / (rect.width / 2)
        const dy = (e.clientY - cy) / (rect.height / 2)
        const rotateX = -dy * 10
        const rotateY =  dx * 12
        gsap.to(card, { rotateX, rotateY, transformPerspective: 1000, duration: 0.3, ease: 'power2.out' })
    }

    const handleMouseLeave = () => {
        gsap.to(cardRef.current, { rotateX: 0, rotateY: 0, duration: 0.7, ease: 'back.out(1.5)' })
    }

    return (
        <Link to="/about" className={styles.promoLink}>
            <div
                ref={cardRef}
                className={styles.card}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                <span className={styles.label}>Meet the Team</span>
                <div className={styles.avatars}>
                    {CREATORS.map(c => (
                        <div key={c.name} className={styles.avatarItem}>
                            <img src={c.photo} alt={c.name} className={styles.avatar} />
                            <span className={styles.name}>{c.name}</span>
                            <span className={styles.tag}>{c.tag}</span>
                        </div>
                    ))}
                </div>
                <span className={styles.arrow}>→</span>
            </div>
        </Link>
    )
}
