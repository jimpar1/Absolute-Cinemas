import { useEffect, useState } from "react"
import { getScreenings } from "../api/screenings"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Calendar, Film, Clock } from "lucide-react"
import { Link } from "react-router-dom"

export default function Screenings() {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        getScreenings()
            .then(data => {
                console.log("Screenings data:", data)
                if (data.results) {
                    setData(data.results)
                } else {
                    setData(data || [])
                }
            })
            .finally(() => setLoading(false))
    }, [])

    return (
        <>
            <div className="container py-8">
                <div className="flex items-center gap-3 mb-8">
                    <Calendar className="h-8 w-8" />
                    <h1 className="text-4xl font-bold">All Screenings</h1>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-20 w-full" />
                        ))}
                    </div>
                ) : data.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No screenings available</h3>
                            <p className="text-muted-foreground">Check back later for upcoming shows.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {data.map(s => (
                            <Card key={s.id} className="hover:shadow-lg transition-shadow">
                                <CardContent className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-lg bg-primary/10">
                                            <Film className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-lg">
                                                Movie ID: {s.movie}
                                            </p>
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {new Date(s.start_time).toLocaleDateString('en-US', { 
                                                        weekday: 'short', 
                                                        month: 'short', 
                                                        day: 'numeric' 
                                                    })}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    {new Date(s.start_time).toLocaleTimeString('en-US', { 
                                                        hour: '2-digit', 
                                                        minute: '2-digit' 
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <Link to={`/booking/${s.id}`}>
                                        <Button>Book Now</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}
