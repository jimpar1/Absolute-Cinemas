/**
 * MovieFilters – Search bar, genre filter toggle, and active-filter badges.
 * Used at the top of the Movies page to narrow down the displayed movies.
 */

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, X, SlidersHorizontal } from "lucide-react"
import { GENRES } from "./constants"

export default function MovieFilters({
    searchQuery, onSearchChange,
    selectedGenres, onToggleGenre, onClearGenres,
    showFilters, onToggleFilters,
    onClearAll
}) {
    const hasActiveFilters = searchQuery !== "" || selectedGenres.length > 0

    return (
        <div className="mb-6 space-y-4">
            {/* Search + Filter Toggle */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search movies..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10 pr-10"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Filter Toggle Button */}
                <Button
                    variant={showFilters ? "default" : "outline"}
                    onClick={onToggleFilters}
                    className="gap-2"
                >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {selectedGenres.length > 0 && (
                        <Badge variant="secondary" className="ml-1">
                            {selectedGenres.length}
                        </Badge>
                    )}
                </Button>
            </div>

            {/* Genre Filter Panel */}
            {showFilters && (
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-sm">Filter by Genre</h3>
                            {selectedGenres.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={onClearGenres}>
                                    Clear
                                </Button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {GENRES.map(genre => (
                                <Badge
                                    key={genre}
                                    variant={selectedGenres.includes(genre) ? "default" : "outline"}
                                    className="cursor-pointer hover:bg-primary/80 transition-colors"
                                    onClick={() => onToggleGenre(genre)}
                                >
                                    {genre}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Active filters:</span>
                    {searchQuery && (
                        <Badge variant="secondary" className="gap-1">
                            Search: "{searchQuery}"
                            <X className="h-3 w-3 cursor-pointer" onClick={() => onSearchChange("")} />
                        </Badge>
                    )}
                    {selectedGenres.map(genre => (
                        <Badge key={genre} variant="secondary" className="gap-1">
                            {genre}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => onToggleGenre(genre)} />
                        </Badge>
                    ))}
                    <Button variant="ghost" size="sm" onClick={onClearAll}>
                        Clear all
                    </Button>
                </div>
            )}
        </div>
    )
}
