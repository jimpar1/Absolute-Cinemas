/**
 * App – Root component. Sets up React Router, context providers
 * (Auth + Reservation), and wraps all pages with Navigation + Footer.
 *
 * Session flow: LoadingScreen overlays the app on first visit (once per browser
 * session). The app mounts underneath so resources preload and the reveal
 * transition is instant — no cold-mount flash.
 */

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import Navigation from "./components/Navigation"
import { Toaster } from "@/components/ui/toaster"
import Footer from "./components/Footer"
import Home from "./pages/Home"
import Movies from "./pages/Movies"
import MovieDetails from "./pages/MovieDetails"
import Booking from "./pages/Booking"
import AboutUs from "./pages/AboutUs"
import Profile from "./pages/Profile"
import SubscriptionSuccess from "./pages/SubscriptionSuccess"
import SubscriptionCancel from "./pages/SubscriptionCancel"
import { ReservationProvider } from "./context/ReservationContext"
import { AuthProvider } from "./context/AuthContext"
import { useState, useEffect } from "react"
import LoadingScreen from "./components/LoadingScreen"
import CustomCursor from "./components/CustomCursor"

function ScrollToTop() {
    const { pathname } = useLocation()
    useEffect(() => { window.scrollTo(0, 0) }, [pathname])
    return null
}

export default function App() {
    const [showLoader, setShowLoader] = useState(() => !sessionStorage.getItem('hasSeenLoader'))

    const handleLoaderComplete = () => {
        sessionStorage.setItem('hasSeenLoader', 'true')
        setShowLoader(false)
    }

    // App always renders so it's already mounted beneath the loading screen.
    // LoadingScreen overlays it (position:fixed z-index:10000) and slides away,
    // revealing fully-rendered content — no cold-mount flash on exit.
    return (
        <BrowserRouter>
            <AuthProvider>
                <ReservationProvider>
                    <Navigation />
                    <ScrollToTop />
                    <div className="min-h-screen flex flex-col">
                        <main className="flex-grow w-full">
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/movies" element={<Movies />} />
                                <Route path="/movies/:id" element={<MovieDetails />} />
                                <Route path="/booking/:id" element={<Booking />} />
                                <Route path="/about" element={<AboutUs />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/subscription/success" element={<SubscriptionSuccess />} />
                                <Route path="/subscription/cancel" element={<SubscriptionCancel />} />
                            </Routes>
                        </main>
                        <Footer />
                    </div>
                    <Toaster />
                </ReservationProvider>
            </AuthProvider>
            {showLoader && <LoadingScreen onComplete={handleLoaderComplete} />}
            <CustomCursor />
        </BrowserRouter>
    )
}
