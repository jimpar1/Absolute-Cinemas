/**
 * TrailerSection – Embeds the YouTube trailer for the movie, or shows a placeholder.
 */

import { Card, CardContent } from "@/components/ui/card"
import { Play } from "lucide-react"
import { getYouTubeVideoId } from "@/utils/youtube"

export default function TrailerSection({ movie }) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <Play className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Trailer</h2>
            </div>
            {movie.trailer_url ? (
                <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
                    <iframe
                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(movie.trailer_url)}`}
                        title={`${movie.title} Trailer`}
                        style={{ border: 'none' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                    ></iframe>
                </div>
            ) : (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No trailer available for this movie.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
