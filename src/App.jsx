/**
 * App – Root component. Sets up React Router, context providers
 * (Auth + Reservation), and wraps all pages with Navigation + Footer.
 */

import { BrowserRouter, Routes, Route } from "react-router-dom"
import Navigation from "./components/Navigation"
import { Toaster } from "@/components/ui/toaster"
import Footer from "./components/Footer"
import Home from "./pages/Home"
import Movies from "./pages/Movies"
import MovieDetails from "./pages/MovieDetails"
import Booking from "./pages/Booking"
import AboutUs from "./pages/AboutUs"
import { ReservationProvider } from "./context/ReservationContext"
import { AuthProvider } from "./context/AuthContext"

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ReservationProvider>
                    <Navigation />
                    <div className="min-h-screen flex flex-col">
                        <main className="flex-grow mx-auto max-w-7xl w-full">
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/movies" element={<Movies />} />
                                <Route path="/movies/:id" element={<MovieDetails />} />
                                <Route path="/booking/:id" element={<Booking />} />
                                <Route path="/about" element={<AboutUs />} />
                            </Routes>
                        </main>
                        <Footer />
                    </div>
                    <Toaster />
                </ReservationProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}
