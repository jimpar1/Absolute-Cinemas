/*
Αυτό το αρχείο περιέχει το κύριο στοιχείο της εφαρμογής που ρυθμίζει τις διαδρομές με το React Router και ενσωματώνει τα κύρια στοιχεία όπως πλοήγηση, υποσέλιδο και σελίδες.
*/

import { BrowserRouter, Routes, Route } from "react-router-dom"
import Navigation from "./components/Navigation"
import { Toaster } from "@/components/ui/toaster"
import Footer from "./components/Footer"
import Home from "./pages/Home"
import MovieDetails from "./pages/MovieDetails"
import Screenings from "./pages/Screenings"
import Booking from "./pages/Booking"
import MovieHalls from "./pages/MovieHalls"
import NowPlaying from "./pages/NowPlaying"
import Upcoming from "./pages/Upcoming"
import Watchlist from "./pages/Watchlist"

export default function App() {
    return (
        <BrowserRouter>
            <Navigation />
            <div className="min-h-screen flex flex-col">
                <main className="flex-grow mx-auto max-w-7xl w-full">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        {/* <Route path="/movies" element={<Movies />} /> */}
                        <Route path="/movies/:id" element={<MovieDetails />} />
                        <Route path="/now-playing" element={<NowPlaying />} />
                        <Route path="/upcoming" element={<Upcoming />} />
                        {/* <Route path="/genres" element={<Genres />} /> */}
                        <Route path="/screenings" element={<Screenings />} />
                        <Route path="/booking/:id" element={<Booking />} />
                        <Route path="/halls" element={<MovieHalls />} />
                        <Route path="/watchlist" element={<Watchlist />} />
                        {/* <Route path="/profile" element={<Profile />} /> */}
                    </Routes>
                </main>
                <Footer />
            </div>
            <Toaster />
        </BrowserRouter>
    )
}
