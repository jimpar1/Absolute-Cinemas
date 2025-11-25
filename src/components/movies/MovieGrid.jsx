/**
 * MovieGrid – Renders a responsive grid of MovieCards.
 * Handles three states: loading (skeletons), empty (message), and populated (cards).
 */

import MovieCard from "@/components/MovieCard"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

/** Placeholder skeleton for a single movie card while loading */
function MovieCardSkeleton() {
    return (
        <div className="space-y-3">
            <Skeleton className="aspect-[2/3] w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
        </div>
    )
}

export default function MovieGrid({ movies, loading, emptyIcon, emptyTitle, emptyDescription, hasActiveFilters, onClearFilters }) {
    /* Loading state */
    if (loading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                    <MovieCardSkeleton key={i} />
                ))}
            </div>
        )
    }

    /* Empty state */
    if (movies.length === 0) {
        return (
            <Card>
                <CardContent className="py-16 text-center">
                    {emptyIcon}
                    <h3 className="text-xl font-semibold mb-2">{emptyTitle}</h3>
                    <p className="text-muted-foreground mb-4">{emptyDescription}</p>
                    {hasActiveFilters && (
                        <Button variant="outline" onClick={onClearFilters}>
                            Clear Filters
                        </Button>
                    )}
                </CardContent>
            </Card>
        )
    }

    /* Populated state */
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {movies.map(movie => (
                <MovieCard key={movie.id} movie={movie} />
            ))}
        </div>
    )
}
