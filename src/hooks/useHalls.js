import { useState, useEffect } from 'react'
import { getHalls } from '../api/halls'

// Metadata keyed by English hall name (for future use)
const HALL_META = {
    'Hall Alpha': { badge: 'IMAX', tech: '4K Laser · Dolby Atmos'         },
    'Hall Gamma': { badge: 'VIP',  tech: 'Private Lounge · Waiter Service' },
}

// Index-based fallback for halls with non-English names
const FALLBACK_META = [
    { badge: 'IMAX', tech: '4K Laser · Dolby Atmos'         },
    { badge: 'VIP',  tech: 'Private Lounge · Waiter Service' },
]

export function useHalls() {
    const [hallGroups, setHallGroups]     = useState([])
    const [halls, setHalls]               = useState([])
    const [hallCount, setHallCount]       = useState(0)
    const [totalCapacity, setTotalCapacity] = useState(0)

    useEffect(() => {
        getHalls()
            .then((data) => {
                const hallList = Array.isArray(data) ? data : []

                // Build hall groups (one per hall, with all its photo URLs)
                const groups = hallList
                    .map((hall, index) => {
                        const namedMeta = HALL_META[hall.name]
                        const meta      = namedMeta ?? FALLBACK_META[index] ?? { badge: 'Cinema', tech: '' }
                        const seats     = `${hall.capacity} seats`
                        const photos    = (hall.photos || []).map((p) => p.image_url).filter(Boolean)
                        return { name: hall.name, badge: meta.badge, seats, tech: meta.tech, photos }
                    })
                    .filter((g) => g.photos.length > 0) // skip halls with no photos yet

                // Hall list for MovieFilters (always include all halls)
                const hallsMeta = hallList.map((h, index) => {
                    const namedMeta = HALL_META[h.name]
                    const meta      = namedMeta ?? FALLBACK_META[index] ?? { badge: 'Cinema', tech: '' }
                    return { id: h.id, name: h.name, badge: meta.badge }
                })

                if (groups.length > 0)    setHallGroups(groups)
                if (hallsMeta.length > 0) setHalls(hallsMeta)

                // Raw counts (not filtered by photos) — used for stats display
                setHallCount(hallList.length)
                setTotalCapacity(hallList.reduce((sum, h) => sum + (h.capacity || 0), 0))
            })
            .catch(() => {
                // API unavailable — keep fallbacks
            })
    }, [])

    return { hallGroups, halls, hallCount, totalCapacity }
}
