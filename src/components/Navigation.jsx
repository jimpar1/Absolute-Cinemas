/*
Αυτό το στοιχείο παρέχει την κύρια πλοήγηση με λογότυπο, συνδέσμους σελίδων και μενού για κινητά.
*/

import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Menu, Film, Home, Calendar, Star, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const navItems = [
	{ name: "Home", path: "/", icon: Home },
	{ name: "Now Playing", path: "/now-playing", icon: Play },
	{ name: "Upcoming", path: "/upcoming", icon: Calendar },
	{ name: "Screenings", path: "/screenings", icon: Calendar },
	{ name: "Halls", path: "/halls", icon: Film },
	{ name: "Watchlist", path: "/watchlist", icon: Star },
]

export default function Navigation() {
	const [open, setOpen] = useState(false)
	const location = useLocation()

	const NavLink = ({ item, mobile = false }) => {
		const Icon = item.icon
		const isActive = location.pathname === item.path

		return (
			<Link
				to={item.path}
				onClick={() => mobile && setOpen(false)}
				className={cn(
					"flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
					isActive
						? "bg-accent text-accent-foreground"
						: "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
					mobile && "text-base py-3"
				)}
			>
				<Icon className="h-4 w-4" />
				<span>{item.name}</span>
			</Link>
		)
	}

	return (
		<nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-16 items-center px-4">
				{/* Logo */}
				<Link to="/" className="flex items-center space-x-2 mr-6">
					<Film className="h-6 w-6" />
					<span className="font-bold text-xl hidden sm:inline-block">
						Absolute Cinemas
					</span>
				</Link>

				{/* Desktop Navigation */}
				<div className="hidden lg:flex items-center space-x-1 absolute left-1/2 transform -translate-x-1/2">
					{navItems.slice(0, 8).map((item) => (
						<NavLink key={item.path} item={item} />
					))}
				</div>

				{/* Right side actions */}
				<div className="flex items-center ml-auto space-x-2">
					{/* Mobile Menu */}
					<Sheet open={open} onOpenChange={setOpen}>
						<SheetTrigger asChild className="lg:hidden">
							<Button variant="ghost" size="icon" aria-label="Open menu">
								<Menu className="h-5 w-5" />
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="w-[300px] sm:w-[400px]">
							<SheetHeader>
								<SheetTitle className="flex items-center gap-2">
									<Film className="h-5 w-5" />
									Absolute Cinema
								</SheetTitle>
							</SheetHeader>
							<div className="flex flex-col space-y-1 mt-6">
								{navItems.map((item) => (
									<NavLink key={item.path} item={item} mobile />
								))}
							</div>
						</SheetContent>
					</Sheet>

					{/* Desktop User Actions */}
					<div className="hidden lg:flex items-center space-x-2">
						{/* <Link to="/watchlist">
							<Button variant="ghost" size="icon" aria-label="Watchlist">
								<Star className="h-5 w-5" />
							</Button>
						</Link> */}
					</div>
				</div>
			</div>
		</nav>
	)
}
