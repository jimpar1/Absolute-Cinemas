/*
Αυτή η σελίδα εμφανίζει τη λίστα παρακολούθησης και τα αγαπημένα του χρήστη.
*/

import { useState } from "react"
import { Link } from "react-router-dom"
import MovieCard from "../components/MovieCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, Heart, Bookmark } from "lucide-react"

export default function Watchlist() {
    // This would normally come from a state management solution or API
    const [watchlist] = useState([])
    const [favorites] = useState([])

    return (
        <>
            <div className="container py-8">
                <div className="flex items-center gap-3 mb-8">
                    <Star className="h-8 w-8" />
                    <div>
                        <h1 className="text-4xl font-bold">My Collection</h1>
                        <p className="text-muted-foreground mt-1">Your saved movies and favorites</p>
                    </div>
                </div>

                <Tabs defaultValue="watchlist" className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="watchlist" className="gap-2">
                            <Bookmark className="h-4 w-4" />
                            Watchlist
                        </TabsTrigger>
                        <TabsTrigger value="favorites" className="gap-2">
                            <Heart className="h-4 w-4" />
                            Favorites
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="watchlist" className="mt-8">
                        {watchlist.length === 0 ? (
                            <Card>
                                <CardContent className="py-16 text-center">
                                    <Bookmark className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">Your watchlist is empty</h3>
                                    <p className="text-muted-foreground mb-6">
                                        Start adding movies you want to watch later
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                {watchlist.map(movie => (
                                    <MovieCard key={movie.id} movie={movie} />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="favorites" className="mt-8">
                        {favorites.length === 0 ? (
                            <Card>
                                <CardContent className="py-16 text-center">
                                    <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">No favorites yet</h3>
                                    <p className="text-muted-foreground mb-6">
                                        Mark movies as favorites to see them here
                                    </p>
                                    <Link to="/movies">
                                        <Button>Browse Movies</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                {favorites.map(movie => (
                                    <MovieCard key={movie.id} movie={movie} />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </>
    )
}
