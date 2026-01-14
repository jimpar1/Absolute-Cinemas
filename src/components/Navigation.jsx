/**
 * Navigation – Main top navigation bar.
 *
 * Layout (desktop): Logo | Nav Links (center) | Actions (right)
 * Layout (mobile):  Logo | Hamburger menu (Sheet)
 *
 * Delegates the inbox panel to InboxDropdown and auth dialogs to LoginDialog / RegisterDialog.
 */

import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Menu, LogOut, User, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import LoginDialog from "./LoginDialog"
import RegisterDialog from "./RegisterDialog"
import InboxDropdown from "./navigation/InboxDropdown"
import VideoIntro from "./VideoIntro"

/** Top-level navigation link definitions */
const navItems = [
    { name: "Home", path: "/" },
    { name: "Movies", path: "/movies" },
    { name: "About Us", path: "/about" },
]

/**
 * NavLink – A single navigation item using Permanent Marker font.
 * Highlights when active. Can render in desktop or mobile mode.
 */
function NavLink({ item, mobile = false, onNavigate }) {
    const location = useLocation()
    const isActive = location.pathname === item.path

    return (
        <Link
            to={item.path}
            onClick={onNavigate}
            className={cn(
                "flex items-center justify-center px-3 py-2 rounded-md transition-colors",
                isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                mobile && "py-3 justify-start"
            )}
        >
            <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: mobile ? '1.1rem' : '1rem' }}>
                {item.name}
            </span>
        </Link>
    )
}

export default function Navigation() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [loginOpen, setLoginOpen] = useState(false)
    const [registerOpen, setRegisterOpen] = useState(false)
    const [showIntro, setShowIntro] = useState(false)
    const { user, logout } = useAuth()

    const handleReplayIntro = () => {
        setShowIntro(true)
    }

    const handleIntroComplete = () => {
        setShowIntro(false)
    }

    return (
        <nav className="sticky top-0 z-40 w-full bg-background/70 backdrop-blur">
            <div className="w-full h-16 px-4 lg:px-8 flex items-center justify-between lg:grid lg:grid-cols-3">

                {/* ─── Left: Logo ─── */}
                <div className="flex items-center justify-start">
                    <Link to="/" className="flex items-center whitespace-nowrap">
                        <span className="font-bold text-xl">Absolute Cinemas</span>
                    </Link>
                </div>

                {/* ─── Center: Desktop Nav ─── */}
                <div className="hidden lg:flex items-center justify-center w-full">
                    <div className="flex items-center space-x-4">
                        {navItems.map((item) => (
                            <NavLink key={item.path} item={item} />
                        ))}
                    </div>
                </div>

                {/* ─── Right: Actions ─── */}
                <div className="flex items-center justify-end gap-2">
                    {/* Replay Intro Button */}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleReplayIntro}
                        className="text-muted-foreground hover:text-foreground"
                        title="Replay Intro"
                    >
                        <Play className="h-4 w-4" />
                    </Button>

                    {/* Auth buttons / user info */}
                    {user ? (
                        <div className="flex items-center gap-2">
                            <Link to="/profile">
                                <Button variant="ghost" className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground">
                                    <User className="h-4 w-4" />
                                    <span className="text-xs">{user.name || user.username || user.email}</span>
                                </Button>
                            </Link>

                            <Button variant="ghost" size="sm" onClick={logout} className="flex items-center gap-1 text-xs sm:text-sm">
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button onClick={() => setLoginOpen(true)} variant="ghost" size="sm" className="text-xs sm:text-sm">
                                Login
                            </Button>
                            <Button onClick={() => setRegisterOpen(true)} variant="default" size="sm" className="text-xs sm:text-sm">
                                Sign Up
                            </Button>
                        </div>
                    )}

                    {/* Mobile hamburger */}
                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <SheetTrigger asChild className="lg:hidden">
                            <Button variant="ghost" size="icon" aria-label="Open menu">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                            <SheetHeader>
                                <SheetTitle>
                                    <span className="font-bold text-xl">Absolute Cinemas</span>
                                </SheetTitle>
                            </SheetHeader>
                            <div className="flex flex-col space-y-2 mt-6">
                                {navItems.map((item) => (
                                    <NavLink key={item.path} item={item} mobile onNavigate={() => setMobileMenuOpen(false)} />
                                ))}
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Inbox */}
                    <InboxDropdown />
                </div>
            </div>

            <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
            <RegisterDialog open={registerOpen} onOpenChange={setRegisterOpen} />
            {showIntro && <VideoIntro onComplete={handleIntroComplete} />}
        </nav>
    )
}