import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"

export default function LoginDialog({ open, onOpenChange }) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { login, isLoading } = useAuth()
    const { toast } = useToast()

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!username || !password) {
            toast({
                title: "Error",
                description: "Please enter both username and password",
                variant: "destructive",
            })
            return
        }

        setIsSubmitting(true)
        console.log("Attempting login with:", username)

        try {
            const result = await login(username, password)
            console.log("Login successful:", result)
            
            toast({
                title: "Success",
                description: "You have been logged in successfully!",
            })
            setUsername("")
            setPassword("")
            onOpenChange(false)
        } catch (error) {
            console.error("Login error:", error)
            
            toast({
                title: "Login Failed",
                description: error.message || "Failed to login. Please check your credentials and try again.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Login</DialogTitle>
                    <DialogDescription>
                        Sign in to your account to book movies and save your preferences.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            placeholder="yourusername"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isLoading || isSubmitting}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading || isSubmitting}
                            required
                        />
                    </div>
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading || isSubmitting}
                    >
                        {isSubmitting ? "Logging in..." : "Login"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
