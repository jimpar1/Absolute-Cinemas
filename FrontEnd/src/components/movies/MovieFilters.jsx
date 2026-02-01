/**
 * MovieFilters – Sidebar with search bar, hall, genre filters, and active-filter badges.
 * Rendered as a left sidebar on the Movies page.
 */

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, X, SlidersHorizontal } from "lucide-react"
import { GENRES } from "./constants"

export default function MovieFilters({
    searchQuery, onSearchChange,
    selectedGenres, onToggleGenre, onClearGenres,
    halls, selectedHall, onSelectHall,
    onClearAll
}) {
    const hasActiveFilters = searchQuery !== "" || selectedGenres.length > 0 || selectedHall !== null

    return (
        <div className="flex flex-col gap-5 w-full">
            {/* Header */}
            <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm tracking-wide">Filters</span>
                {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-auto">
                        {selectedGenres.length + (searchQuery ? 1 : 0) + (selectedHall ? 1 : 0)}
                    </Badge>
                )}
            </div>

            {/* Search Input */}
            <div className="relative">
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

            {/* Hall Filter */}
            {halls?.length > 0 && (
                <div>
                    <h3 className="font-medium text-sm mb-3">Hall</h3>
                    <div className="flex flex-col gap-1.5">
                        <button
                            onClick={() => onSelectHall(null)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left w-full
                                ${!selectedHall
                                    ? 'bg-primary text-primary-foreground font-medium'
                                    : 'hover:bg-accent text-muted-foreground hover:text-foreground'}`}
                        >
                            All Halls
                        </button>
                        {halls.map(hall => (
                            <button
                                key={hall.id}
                                onClick={() => onSelectHall(hall.name)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left w-full
                                    ${selectedHall === hall.name
                                        ? 'bg-primary text-primary-foreground font-medium'
                                        : 'hover:bg-accent text-muted-foreground hover:text-foreground'}`}
                            >
                                <span className="text-[0.6rem] font-bold tracking-widest opacity-60 bg-current/10 px-1.5 py-0.5 rounded">
                                    {hall.badge}
                                </span>
                                {hall.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Genre Filter */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-sm">Genre</h3>
                    {selectedGenres.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={onClearGenres} className="h-auto py-0 px-1 text-xs">
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
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
                <div className="flex flex-col gap-2 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Active filters</span>
                        <Button variant="ghost" size="sm" onClick={onClearAll} className="h-auto py-0 px-1 text-xs">
                            Clear all
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {searchQuery && (
                            <Badge variant="secondary" className="gap-1 text-xs">
                                "{searchQuery}"
                                <X className="h-3 w-3 cursor-pointer" onClick={() => onSearchChange("")} />
                            </Badge>
                        )}
                        {selectedHall && (
                            <Badge variant="secondary" className="gap-1 text-xs">
                                {selectedHall}
                                <X className="h-3 w-3 cursor-pointer" onClick={() => onSelectHall(null)} />
                            </Badge>
                        )}
                        {selectedGenres.map(genre => (
                            <Badge key={genre} variant="secondary" className="gap-1 text-xs">
                                {genre}
                                <X className="h-3 w-3 cursor-pointer" onClick={() => onToggleGenre(genre)} />
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
