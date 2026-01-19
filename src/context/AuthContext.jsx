import { createContext, useContext, useState, useEffect } from "react"
import { authAPI } from "@/api/auth"
import { getSubscription, subscribeTier as apiSubscribeTier } from "@/api/subscription"

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user')
        return saved ? JSON.parse(saved) : null
    })

    const [accessToken, setAccessToken] = useState(() => {
        return localStorage.getItem('accessToken') || null
    })

    const [refreshToken, setRefreshToken] = useState(() => {
        return localStorage.getItem('refreshToken') || null
    })

    const [isLoading, setIsLoading] = useState(false)
    const [subscription, setSubscription] = useState(null)

    // Save user to localStorage
    useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user))
        } else {
            localStorage.removeItem('user')
        }
    }, [user])

    // Save tokens to localStorage
    useEffect(() => {
        if (accessToken) {
            localStorage.setItem('accessToken', accessToken)
        } else {
            localStorage.removeItem('accessToken')
        }
    }, [accessToken])

    useEffect(() => {
        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken)
        } else {
            localStorage.removeItem('refreshToken')
        }
    }, [refreshToken])

    const fetchSubscription = async (token) => {
        try {
            const data = await getSubscription(token)
            if (data && !data.detail) setSubscription(data)
        } catch {
            // non-fatal, subscription stays null
        }
    }

    // Fetch subscription on mount if already logged in
    useEffect(() => {
        const token = localStorage.getItem('accessToken')
        if (token) fetchSubscription(token)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Keep body[data-tier] in sync so CSS variables reflect the active plan
    useEffect(() => {
        document.body.dataset.tier = subscription?.tier ?? 'free'
    }, [subscription])

    const extractAccessToken = (data) => {
        return (
            data?.access ??
            data?.accessToken ??
            data?.access_token ??
            data?.token ??
            data?.jwt ??
            data?.tokens?.access ??
            data?.tokens?.access_token ??
            null
        )
    }

    const extractRefreshToken = (data) => {
        return (
            data?.refresh ??
            data?.refreshToken ??
            data?.refresh_token ??
            data?.tokens?.refresh ??
            data?.tokens?.refresh_token ??
            null
        )
    }

    const getValidAccessToken = async () => {
        // Prefer state, then localStorage (covers reloads / stale renders)
        let token = accessToken || localStorage.getItem('accessToken')
        if (token) return token

        // If we have a refresh token, try to mint a new access token.
        const refresh = refreshToken || localStorage.getItem('refreshToken')
        if (!refresh) return null

        const refreshed = await authAPI.refreshToken(refresh)
        const newAccess = extractAccessToken(refreshed)
        if (newAccess) {
            setAccessToken(newAccess)
            return newAccess
        }

        return null
    }

const login = async (username, password) => {
    setIsLoading(true)
    try {
        const data = await authAPI.login(username, password)
        // Django JWT response structure: { access, refresh, user: {...} } or similar
        const userData = data.user || {
                id: data.id,
                email: data.email,
                username: data.username,
                first_name: data.first_name,
                last_name: data.last_name,
            }

            const newAccessToken = extractAccessToken(data)
            const newRefreshToken = extractRefreshToken(data)

            setUser(userData)
            setAccessToken(newAccessToken)
            setRefreshToken(newRefreshToken)

            if (newAccessToken) await fetchSubscription(newAccessToken)

            return userData
        } finally {
            setIsLoading(false)
        }
    }

    const logout = async () => {
        setIsLoading(true)
        try {
            if (refreshToken) {
                await authAPI.logout(refreshToken)
            }
            setUser(null)
            setAccessToken(null)
            setRefreshToken(null)
            setSubscription(null)
        } catch (error) {
            console.error('Logout error:', error)
            // Still logout even if API call fails
            setUser(null)
            setAccessToken(null)
            setRefreshToken(null)
            setSubscription(null)
        } finally {
            setIsLoading(false)
        }
    }

    const register = async (formData) => {
        setIsLoading(true)
        try {
            const data = await authAPI.register(formData)

            // Django JWT response structure for registration
            const userData = data.user || {
                id: data.id,
                email: data.email,
                username: data.username,
                first_name: data.first_name,
                last_name: data.last_name,
            }

            const newAccessToken = extractAccessToken(data)
            const newRefreshToken = extractRefreshToken(data)

            setUser(userData)
            setAccessToken(newAccessToken)
            setRefreshToken(newRefreshToken)

            return userData
        } finally {
            setIsLoading(false)
        }
    }

    const updateProfile = async (profileData) => {
        setIsLoading(true)
        try {
            const token = await getValidAccessToken()
            if (!token) throw new Error('You must be logged in to update your profile')

            const data = await authAPI.updateProfile(token, profileData)
            setUser(prev => ({ ...prev, ...data }))
            return data
        } finally {
            setIsLoading(false)
        }
    }

    const subscribeTier = async (tier) => {
        const token = await getValidAccessToken()
        if (!token) throw new Error('You must be logged in to subscribe')
        const data = await apiSubscribeTier(token, tier)
        if (data && !data.error) setSubscription(data)
        return data
    }

    const changePassword = async (oldPassword, newPassword, confirmPassword) => {
        setIsLoading(true)
        try {
            const token = await getValidAccessToken()
            if (!token) throw new Error('You must be logged in to change your password')

            return await authAPI.changePassword(token, oldPassword, newPassword, confirmPassword)
        } finally {
            setIsLoading(false)
        }
    }

    const value = {
        user,
        accessToken,
        refreshToken,
        isLoading,
        subscription,
        login,
        logout,
        register,
        updateProfile,
        changePassword,
        subscribeTier,
        isAuthenticated: !!user && !!accessToken
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}
