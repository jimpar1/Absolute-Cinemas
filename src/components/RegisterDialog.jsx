import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"

export default function RegisterDialog({ open, onOpenChange }) {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        password2: "",
        first_name: "",
        last_name: "",
        phone: "",
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { register, isLoading } = useAuth()
    const { toast } = useToast()

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validation
        if (!formData.username || !formData.email || !formData.password || !formData.password2) {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            })
            return
        }

        if (formData.password !== formData.password2) {
            toast({
                title: "Error",
                description: "Passwords do not match",
                variant: "destructive",
            })
            return
        }

        if (formData.password.length < 6) {
            toast({
                title: "Error",
                description: "Password must be at least 6 characters",
                variant: "destructive",
            })
            return
        }

        setIsSubmitting(true)
        console.log("Attempting registration with:", formData.email)

        try {
            const result = await register(formData)
            console.log("Registration successful:", result)

            toast({
                title: "Success",
                description: "Account created successfully! You are now logged in.",
            })

            // Reset form
            setFormData({
                username: "",
                email: "",
                password: "",
                password2: "",
                first_name: "",
                last_name: "",
                phone: "",
            })
            onOpenChange(false)
        } catch (error) {
            console.error("Registration error:", error)

            toast({
                title: "Registration Failed",
                description: error.message || "Failed to create account. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Account</DialogTitle>
                    <DialogDescription>
                        Sign up to book movies and save your preferences.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                name="username"
                                type="text"
                                placeholder="username"
                                value={formData.username}
                                onChange={handleChange}
                                disabled={isLoading || isSubmitting}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="your@email.com"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={isLoading || isSubmitting}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name">First Name</Label>
                            <Input
                                id="first_name"
                                name="first_name"
                                type="text"
                                placeholder="John"
                                value={formData.first_name}
                                onChange={handleChange}
                                disabled={isLoading || isSubmitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last_name">Last Name</Label>
                            <Input
                                id="last_name"
                                name="last_name"
                                type="text"
                                placeholder="Doe"
                                value={formData.last_name}
                                onChange={handleChange}
                                disabled={isLoading || isSubmitting}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="6912345678"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={isLoading || isSubmitting}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={isLoading || isSubmitting}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password2">Confirm Password</Label>
                            <Input
                                id="password2"
                                name="password2"
                                type="password"
                                placeholder="••••••"
                                value={formData.password2}
                                onChange={handleChange}
                                disabled={isLoading || isSubmitting}
                                required
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading || isSubmitting}
                    >
                        {isSubmitting ? "Creating Account..." : "Sign Up"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
