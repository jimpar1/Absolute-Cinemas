import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { Check } from "lucide-react"

export default function RegisterDialog({ open, onOpenChange }) {
    const PASSWORD_MIN_LENGTH = 8
    const PHONE_MAX_LENGTH = 20

    const [focusedField, setFocusedField] = useState(null)

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
                messages.push("That username is already taken.")
            } else {
                messages.push(usernameErrors[0])
            }
        }

        const emailErrors = asStringArray(data?.email)
        if (emailErrors.length > 0) {
            if (emailErrors.some((m) => /already|exists|unique/i.test(m))) {
                messages.push("That email is already in use.")
            } else {
                messages.push(emailErrors[0])
            }
        }

        const password2Errors = asStringArray(data?.password2)
        if (password2Errors.length > 0) {
            if (password2Errors.some((m) => /match|same|two password/i.test(m))) {
                messages.push("Passwords do not match.")
            } else {
                messages.push(password2Errors[0])
            }
        }

        const passwordErrors = asStringArray(data?.password)
        if (passwordErrors.length > 0) {
            const mapped = passwordErrors.map((m) => {
                if (/too short|at least/i.test(m)) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
                if (/too common/i.test(m)) return "Password is too common."
                if (/too similar/i.test(m)) return "Password is too similar to your personal info (username/email/name)."
                if (/entirely numeric|only numeric/i.test(m)) return "Password cannot be only numbers."
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

        return "Account creation failed. Please try again."
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleFormFocusCapture = (e) => {
        const fieldName = e.target?.getAttribute?.("name")
        setFocusedField(fieldName || null)
    }

    const handleFormBlurCapture = (e) => {
        const nextTarget = e.relatedTarget

        // If focus is moving to another element inside the same form (e.g. via Tab),
        // do nothing here and let onFocusCapture set the next focused field.
        if (nextTarget && e.currentTarget?.contains?.(nextTarget)) return

        setFocusedField(null)
    }

    const normalize = (value) => (value || "").toString().trim().toLowerCase()

    const isPasswordTooSimilarToProfile = () => {
        const password = normalize(formData.password)
        if (password.length === 0) return true

        const email = normalize(formData.email)
        const emailLocalPart = email.includes("@") ? email.split("@")[0] : email

        const candidates = [
            normalize(formData.username),
            emailLocalPart,
            normalize(formData.first_name),
            normalize(formData.last_name),
        ].filter((v) => v.length >= 3)

        return candidates.some((candidate) => password.includes(candidate))
    }

    const passwordValue = (formData.password || "").toString()
    const passwordNormalized = normalize(passwordValue)
    const hasPassword = passwordNormalized.length > 0
    const passwordRuleMinLength = passwordValue.length >= PASSWORD_MIN_LENGTH
    const passwordRuleNotSimilar = hasPassword && !isPasswordTooSimilarToProfile()
    const passwordRuleNotOnlyNumbers = hasPassword && !/^\d+$/.test(passwordValue)

    const passwordRules = [
        {
            id: "min-length",
            label: `At least ${PASSWORD_MIN_LENGTH} characters.`,
            met: passwordRuleMinLength,
            ariaLabel: `At least ${PASSWORD_MIN_LENGTH} characters`,
        },
        {
            id: "not-similar",
            label: "Not too similar to your username/email/name.",
            met: passwordRuleNotSimilar,
            ariaLabel: "Not too similar to username/email/name",
        },
        {
            id: "not-only-numbers",
            label: "Not only numbers.",
            met: passwordRuleNotOnlyNumbers,
            ariaLabel: "Not only numbers",
        },
    ]

    const passwordRulesMetCount = passwordRules.reduce((acc, rule) => acc + (rule.met ? 1 : 0), 0)
    const allPasswordRulesMet = passwordRulesMetCount === passwordRules.length

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
                title: "Error",
                description: "Please fill in all required fields.",
                variant: "destructive",
            })
            return
        }

        if (!isValidEmail(formData.email)) {
            toast({
                title: "Error",
                description: "Please enter a valid email (e.g. name@example.com).",
                variant: "destructive",
            })
            return
        }

        if (formData.phone && formData.phone.length > PHONE_MAX_LENGTH) {
            toast({
                title: "Error",
                description: `Phone number must be up to ${PHONE_MAX_LENGTH} characters.`,
                variant: "destructive",
            })
            return
        }

        if (formData.password !== formData.password2) {
            toast({
                title: "Error",
                description: "Passwords do not match.",
                variant: "destructive",
            })
            return
        }

        if (formData.password.length < PASSWORD_MIN_LENGTH) {
            toast({
                title: "Error",
                description: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
                variant: "destructive",
            })
            return
        }

        setIsSubmitting(true)

        try {
            await register(formData)

            toast({
                title: "Success",
                description: "Your account was created and you are now signed in.",
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
                title: "Registration failed",
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
                    <div className="text-xs text-muted-foreground">Fields marked with * are required.</div>
                </DialogHeader>
                <form
                    onSubmit={handleSubmit}
                    onFocusCapture={handleFormFocusCapture}
                    onBlurCapture={handleFormBlurCapture}
                    className="space-y-4"
                >
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
                            {focusedField === "username" && (
                                <p className="text-xs text-muted-foreground">
                                    Letters, numbers, and the symbols @ . + - _ are allowed.
                                </p>
                            )}
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
                            {focusedField === "email" && (
                                <p className="text-xs text-muted-foreground">Enter a valid email (e.g. name@example.com).</p>
                            )}
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
                            {focusedField === "first_name" && (
                                <p className="text-xs text-muted-foreground">Enter your first name.</p>
                            )}
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
                            {focusedField === "last_name" && (
                                <p className="text-xs text-muted-foreground">Enter your last name.</p>
                            )}
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
                        {focusedField === "phone" && (
                            <p className="text-xs text-muted-foreground">Optional (up to 20 characters).</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Password *</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={isLoading || isSubmitting}
                                required
                            />
                            {focusedField === "password" && (
                                <p className="text-xs text-muted-foreground">Choose a strong password.</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password2">Confirm Password *</Label>
                            <Input
                                id="password2"
                                name="password2"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password2}
                                onChange={handleChange}
                                disabled={isLoading || isSubmitting}
                                required
                            />
                            {focusedField === "password2" && (
                                <p className="text-xs text-muted-foreground">Re-enter the exact same password.</p>
                            )}
                        </div>
                    </div>

                    {(focusedField === "password" || focusedField === "password2") && (
                        <div className="rounded-md border bg-card p-3 text-xs text-muted-foreground" aria-live="polite">
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-medium text-foreground">Password requirements</div>
                                <div className="rounded-full border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                                    {passwordRulesMetCount}/{passwordRules.length}
                                </div>
                            </div>

                            <ul className="mt-3 space-y-2">
                                {passwordRules.map((rule) => (
                                    <li
                                        key={rule.id}
                                        className={
                                            "flex items-start gap-3 rounded-md border p-2 transition-colors " +
                                            (rule.met ? "bg-muted/40 text-foreground" : "bg-transparent text-muted-foreground")
                                        }
                                    >
                                        <span
                                            className={
                                                "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors " +
                                                (rule.met
                                                    ? allPasswordRulesMet
                                                        ? "border-green-500 bg-green-500 text-white"
                                                        : "border-primary bg-primary text-primary-foreground"
                                                    : "border-input bg-background text-muted-foreground/40")
                                            }
                                            aria-label={rule.ariaLabel}
                                        >
                                            <Check className={"h-3.5 w-3.5 " + (rule.met ? "opacity-100" : "opacity-0")} />
                                        </span>
                                        <span className={rule.met ? "font-medium" : ""}>{rule.label}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-3 text-[11px] text-muted-foreground/80">
                                Tip: Use a mix of letters, numbers, and symbols.
                            </div>
                        </div>
                    )}

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
