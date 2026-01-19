import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { getUserBookings } from "@/api/bookings"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, User, Lock, Calendar, Ticket, Star, Clock, ChevronRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import TicketModal from "@/components/booking/TicketModal"
import { useToast } from "@/hooks/use-toast"

export default function Profile() {
    const { user, accessToken, updateProfile, changePassword, subscription } = useAuth()
    const { toast } = useToast()
    const navigate = useNavigate()
    const [bookings, setBookings] = useState([])
    const [loadingBookings, setLoadingBookings] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const [selectedBooking, setSelectedBooking] = useState(null)

    // Profile form state
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        phone: "",
    })

    // Password form state
    const [passwordData, setPasswordData] = useState({
        old_password: "",
        new_password: "",
        confirm_password: "",
    })

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || "",
                last_name: user.last_name || "",
                phone: user.phone || "",
            })
        }
    }, [user])

    useEffect(() => {
        if (accessToken) {
            getUserBookings(accessToken)
                .then((data) => {
                    const results = Array.isArray(data) ? data : (data.results || [])
                    setBookings(results)
                })
                .catch((err) => console.error("Failed to fetch bookings:", err))
                .finally(() => setLoadingBookings(false))
        } else {
            setLoadingBookings(false)
        }
    }, [accessToken])

    const handleProfileUpdate = async (e) => {
        e.preventDefault()
        setIsUpdating(true)
        try {
            await updateProfile(formData)
            toast({
                title: "Profile updated",
                description: "Your personal information has been updated successfully.",
            })
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Update failed",
                description: error.message || "Failed to update profile.",
            })
        } finally {
            setIsUpdating(false)
        }
    }

    const handlePasswordChange = async (e) => {
        e.preventDefault()
        if (passwordData.new_password !== passwordData.confirm_password) {
            toast({
                variant: "destructive",
                title: "Passwords do not match",
                description: "New password and confirmation must match.",
            })
            return
        }

        setIsUpdating(true)
        try {
            const result = await changePassword(
                passwordData.old_password,
                passwordData.new_password,
                passwordData.confirm_password
            )
            toast({
                title: "Password changed",
                description: result?.message || result?.detail || "Your password has been updated successfully.",
            })
            setPasswordData({ old_password: "", new_password: "", confirm_password: "" })
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Change failed",
                description: error.message || "Failed to change password.",
            })
        } finally {
            setIsUpdating(false)
        }
    }

    if (!user) {
        return <div className="p-8 text-center">Please log in to view your profile.</div>
    }

    return (
        <div className="container mx-auto py-10 px-4 max-w-5xl">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar / User Summary */}
                <div className="md:w-1/3 space-y-6">
                    <Card className="border-none shadow-lg bg-gradient-to-br from-primary/10 to-background">
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto bg-primary/20 p-4 rounded-full w-24 h-24 flex items-center justify-center mb-4">
                                <User className="h-12 w-12 text-primary" />
                            </div>
                            <CardTitle className="text-2xl">{user.username}</CardTitle>
                            <CardDescription>{user.email}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center pb-6">
                            <div className="flex justify-center gap-4 text-sm text-muted-foreground mt-2">
                                <div className="flex flex-col items-center">
                                    <span className="font-bold text-foreground text-lg">{bookings.length}</span>
                                    <span>Bookings</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="hidden md:block text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Lock className="h-4 w-4" /> Security Tip
                        </h4>
                        <p>
                            Use a strong password and update it regularly to keep your account secure.
                        </p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="md:w-2/3">
                    <Tabs defaultValue="bookings" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-8">
                            <TabsTrigger value="bookings" className="flex items-center gap-2">
                                <Ticket className="h-4 w-4" /> Bookings
                            </TabsTrigger>
                            <TabsTrigger value="subscription" className="flex items-center gap-2">
                                <Star className="h-4 w-4" /> Plan
                            </TabsTrigger>
                            <TabsTrigger value="profile" className="flex items-center gap-2">
                                <User className="h-4 w-4" /> Profile
                            </TabsTrigger>
                            <TabsTrigger value="security" className="flex items-center gap-2">
                                <Lock className="h-4 w-4" /> Security
                            </TabsTrigger>
                        </TabsList>

                        {/* Bookings Tab */}
                        <TabsContent value="bookings" className="space-y-4">
                            {loadingBookings ? (
                                <div className="flex justify-center py-16">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : bookings.length === 0 ? (
                                <Card>
                                    <CardContent className="text-center py-16 text-muted-foreground">
                                        <Ticket className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                        <p className="text-lg font-medium">No bookings yet</p>
                                        <p className="text-sm">Your movie history will appear here.</p>
                                    </CardContent>
                                </Card>
                            ) : (() => {
                                const now = new Date()
                                const upcoming = bookings.filter(b => {
                                    const t = b.screening_details?.start_time
                                    return t && new Date(t) > now && b.status !== "cancelled"
                                })
                                const past = bookings.filter(b => {
                                    const t = b.screening_details?.start_time
                                    return !t || new Date(t) <= now || b.status === "cancelled"
                                })

                                const BookingRow = ({ booking, isUpcoming }) => (
                                    <button
                                        onClick={() => setSelectedBooking(booking)}
                                        className="w-full text-left flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors group"
                                        style={isUpcoming ? { borderColor: "var(--tier-color, rgba(255,255,255,0.1))" } : {}}
                                    >
                                        <div className="flex gap-4 flex-1 min-w-0">
                                            <div className="p-3 rounded-md hidden sm:flex items-center justify-center shrink-0"
                                                style={{ background: isUpcoming ? "var(--tier-faint, rgba(255,255,255,0.05))" : "rgba(255,255,255,0.04)" }}>
                                                {isUpcoming
                                                    ? <Clock className="h-6 w-6" style={{ color: "var(--tier-solid, currentColor)" }} />
                                                    : <Calendar className="h-6 w-6 text-muted-foreground" />
                                                }
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-base truncate">
                                                    {booking.screening_details?.movie_title || "Movie Title"}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {booking.screening_details?.start_time
                                                        ? new Date(booking.screening_details.start_time).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
                                                        : "—"}
                                                    {booking.screening_details?.hall_name && ` · ${booking.screening_details.hall_name}`}
                                                </p>
                                                <p className="text-sm mt-0.5">
                                                    Seats: <span className="font-medium text-foreground">{booking.seat_numbers || "—"}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-3 sm:mt-0 flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                booking.status === "confirmed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                            }`}>
                                                {booking.status || "confirmed"}
                                            </span>
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <span className="text-sm font-bold text-foreground">
                                                    {booking.total_price ? `€${booking.total_price}` : "—"}
                                                </span>
                                                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-60 transition-opacity" />
                                            </div>
                                        </div>
                                    </button>
                                )

                                return (
                                    <>
                                        {upcoming.length > 0 && (
                                            <Card>
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-base flex items-center gap-2">
                                                        <Clock className="h-4 w-4" style={{ color: "var(--tier-solid, currentColor)" }} />
                                                        Upcoming
                                                        <span className="ml-1 text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                            {upcoming.length}
                                                        </span>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                    {upcoming.map(b => <BookingRow key={b.id} booking={b} isUpcoming />)}
                                                </CardContent>
                                            </Card>
                                        )}
                                        {past.length > 0 && (
                                            <Card>
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-base flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        Past
                                                        <span className="ml-1 text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                            {past.length}
                                                        </span>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                    {past.map(b => <BookingRow key={b.id} booking={b} isUpcoming={false} />)}
                                                </CardContent>
                                            </Card>
                                        )}
                                    </>
                                )
                            })()}
                        </TabsContent>

                        {/* Subscription Tab */}
                        <TabsContent value="subscription">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Subscription</CardTitle>
                                    <CardDescription>Your current CinemaPass plan and weekly usage.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {subscription ? (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-primary/20 text-primary capitalize">
                                                    {subscription.tier}
                                                </span>
                                                {subscription.expires_at && (
                                                    <span className="text-sm text-muted-foreground">
                                                        Renews {new Date(subscription.expires_at).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>

                                            {subscription.weekly_free_total > 0 && (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Weekly free tickets</span>
                                                        <span className="font-medium">{subscription.free_tickets_used} / {subscription.weekly_free_total} used</span>
                                                    </div>
                                                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-primary transition-all"
                                                            style={{ width: `${Math.min(100, (subscription.free_tickets_used / subscription.weekly_free_total) * 100)}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">Resets every Monday</p>
                                                </div>
                                            )}

                                            {subscription.discount_rate > 0 && (
                                                <p className="text-sm text-muted-foreground">
                                                    {Math.round(subscription.discount_rate * 100)}% discount on paid seats at checkout.
                                                </p>
                                            )}

                                            {subscription.tier === 'free' ? (
                                                <div className="rounded-lg border border-dashed p-4 text-center space-y-3">
                                                    <p className="text-sm text-muted-foreground">Upgrade to get free weekly tickets and discounts.</p>
                                                    <Button variant="outline" onClick={() => navigate('/#cinemapass')}>
                                                        View Plans
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button variant="outline" size="sm" onClick={() => navigate('/#cinemapass')}>
                                                    Change Plan
                                                </Button>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Star className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                            <p>No subscription data available.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Profile Tab */}
                        <TabsContent value="profile">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Personal Information</CardTitle>
                                    <CardDescription>Update your personal details here.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="firstName">First Name</Label>
                                                <Input
                                                    id="firstName"
                                                    value={formData.first_name}
                                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="lastName">Last Name</Label>
                                                <Input
                                                    id="lastName"
                                                    value={formData.last_name}
                                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input id="email" value={user.email} disabled className="bg-muted" />
                                            <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="+30 69XXXXXXXX"
                                            />
                                        </div>
                                        <div className="pt-4 flex justify-end">
                                            <Button type="submit" disabled={isUpdating}>
                                                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Save Changes
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Security Tab */}
                        <TabsContent value="security">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Security Settings</CardTitle>
                                    <CardDescription>Manage your password and account security.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                                        <div className="space-y-2">
                                            <Label htmlFor="currentPassword">Current Password</Label>
                                            <Input
                                                id="currentPassword"
                                                type="password"
                                                value={passwordData.old_password}
                                                onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="newPassword">New Password</Label>
                                            <Input
                                                id="newPassword"
                                                type="password"
                                                value={passwordData.new_password}
                                                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                value={passwordData.confirm_password}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="pt-4">
                                            <Button type="submit" disabled={isUpdating}>
                                                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Update Password
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        <TicketModal
            booking={selectedBooking}
            open={!!selectedBooking}
            onClose={() => setSelectedBooking(null)}
        />
        </div>
    )
}
