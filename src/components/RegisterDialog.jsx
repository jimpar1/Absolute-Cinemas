import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"

export default function RegisterDialog({ open, onOpenChange }) {
    const PASSWORD_MIN_LENGTH = 8
    const PHONE_MAX_LENGTH = 20

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

    const isBlank = (value) => !value || value.trim().length === 0

    const isValidEmail = (email) => {
        const normalized = (email || "").trim()
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
    }

    const getBackendRegistrationErrorDescription = (error) => {
        const data = error?.data

        const asStringArray = (value) => {
            if (!value) return []
            if (Array.isArray(value)) return value.filter((v) => typeof v === "string")
            if (typeof value === "string") return [value]
            return []
        }

        const messages = []

        const usernameErrors = asStringArray(data?.username)
        if (usernameErrors.length > 0) {
            if (usernameErrors.some((m) => /already|exists|unique/i.test(m))) {
                messages.push("Το username χρησιμοποιείται ήδη.")
            } else {
                messages.push(usernameErrors[0])
            }
        }

        const emailErrors = asStringArray(data?.email)
        if (emailErrors.length > 0) {
            if (emailErrors.some((m) => /already|exists|unique/i.test(m))) {
                messages.push("Αυτό το email χρησιμοποιείται ήδη.")
            } else {
                messages.push(emailErrors[0])
            }
        }

        const password2Errors = asStringArray(data?.password2)
        if (password2Errors.length > 0) {
            if (password2Errors.some((m) => /match|same|two password/i.test(m))) {
                messages.push("Οι κωδικοί δεν ταιριάζουν.")
            } else {
                messages.push(password2Errors[0])
            }
        }

        const passwordErrors = asStringArray(data?.password)
        if (passwordErrors.length > 0) {
            const mapped = passwordErrors.map((m) => {
                if (/too short|at least/i.test(m)) return `Ο κωδικός πρέπει να έχει τουλάχιστον ${PASSWORD_MIN_LENGTH} χαρακτήρες.`
                if (/too common/i.test(m)) return "Ο κωδικός είναι πολύ κοινός."
                if (/too similar/i.test(m)) return "Ο κωδικός μοιάζει πολύ με τα στοιχεία σου (username/email/όνομα)."
                if (/entirely numeric|only numeric/i.test(m)) return "Ο κωδικός δεν μπορεί να είναι μόνο αριθμοί."
                return m
            })
            messages.push(...mapped)
        }

        const nonFieldErrors = asStringArray(data?.non_field_errors)
        if (nonFieldErrors.length > 0) {
            messages.push(nonFieldErrors[0])
        }

        if (messages.length > 0) return messages.join(" ")

        if (typeof data?.detail === "string") return data.detail
        if (typeof error?.message === "string" && error.message.trim().length > 0) return error.message

        return "Αποτυχία δημιουργίας λογαριασμού. Δοκίμασε ξανά."
    }

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
        if (
            isBlank(formData.username) ||
            isBlank(formData.email) ||
            isBlank(formData.first_name) ||
            isBlank(formData.last_name) ||
            isBlank(formData.password) ||
            isBlank(formData.password2)
        ) {
            toast({
                title: "Σφάλμα",
                description: "Συμπλήρωσε όλα τα υποχρεωτικά πεδία.",
                variant: "destructive",
            })
            return
        }

        if (!isValidEmail(formData.email)) {
            toast({
                title: "Σφάλμα",
                description: "Βάλε έγκυρο email (π.χ. name@example.com).",
                variant: "destructive",
            })
            return
        }

        if (formData.phone && formData.phone.length > PHONE_MAX_LENGTH) {
            toast({
                title: "Σφάλμα",
                description: `Το τηλέφωνο πρέπει να είναι έως ${PHONE_MAX_LENGTH} χαρακτήρες.`,
                variant: "destructive",
            })
            return
        }

        if (formData.password !== formData.password2) {
            toast({
                title: "Σφάλμα",
                description: "Οι κωδικοί δεν ταιριάζουν.",
                variant: "destructive",
            })
            return
        }

        if (formData.password.length < PASSWORD_MIN_LENGTH) {
            toast({
                title: "Σφάλμα",
                description: `Ο κωδικός πρέπει να έχει τουλάχιστον ${PASSWORD_MIN_LENGTH} χαρακτήρες.`,
                variant: "destructive",
            })
            return
        }

        setIsSubmitting(true)

        try {
            const result = await register(formData)

            toast({
                title: "Επιτυχία",
                description: "Ο λογαριασμός δημιουργήθηκε και έκανες είσοδο.",
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
            toast({
                title: "Αποτυχία εγγραφής",
                description: getBackendRegistrationErrorDescription(error),
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Account</DialogTitle>
                    <DialogDescription>
                        Sign up to book movies and save your preferences.
                    </DialogDescription>
                    <div className="text-xs text-muted-foreground">
                        Υποχρεωτικά για δημιουργία λογαριασμού: username, email, όνομα, επώνυμο, κωδικός, επιβεβαίωση κωδικού.
                    </div>
                    <div className="text-xs text-muted-foreground">Τα πεδία με * είναι υποχρεωτικά.</div>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username *</Label>
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
                            <p className="text-xs text-muted-foreground">
                                Γράψε ένα μοναδικό username. Επιτρέπονται γράμματα, αριθμοί και τα σύμβολα @ . + - _.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
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
                            <p className="text-xs text-muted-foreground">
                                Βάλε έγκυρο email (π.χ. name@example.com). Πρέπει να είναι μοναδικό.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name">First Name *</Label>
                            <Input
                                id="first_name"
                                name="first_name"
                                type="text"
                                placeholder="John"
                                value={formData.first_name}
                                onChange={handleChange}
                                disabled={isLoading || isSubmitting}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last_name">Last Name *</Label>
                            <Input
                                id="last_name"
                                name="last_name"
                                type="text"
                                placeholder="Doe"
                                value={formData.last_name}
                                onChange={handleChange}
                                disabled={isLoading || isSubmitting}
                                required
                            />
                        </div>
                        <div className="col-span-2 text-xs text-muted-foreground">
                            Συμπλήρωσε το όνομα και το επώνυμό σου.
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
                            maxLength={PHONE_MAX_LENGTH}
                        />
                        <p className="text-xs text-muted-foreground">Προαιρετικό (έως 20 χαρακτήρες).</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Password *</Label>
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
                            <Label htmlFor="password2">Confirm Password *</Label>
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
                            <p className="text-xs text-muted-foreground">Ξαναγράψε ακριβώς τον ίδιο κωδικό.</p>
                        </div>
                    </div>

                    <div className="rounded-md border bg-card p-3 text-xs text-muted-foreground">
                        <div className="text-sm font-medium text-foreground">Σημείωση για τον κωδικό</div>
                        <ul className="mt-2 list-disc space-y-1 pl-4">
                            <li>Τουλάχιστον 8 χαρακτήρες.</li>
                            <li>Μην είναι πολύ “κοντά” σε username/email/όνομα.</li>
                            <li>Μην είναι πολύ κοινός.</li>
                            <li>Όχι μόνο αριθμοί.</li>
                        </ul>
                        <div className="mt-2">Tip: Προτείνεται συνδυασμός γραμμάτων + αριθμών + συμβόλων.</div>
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
