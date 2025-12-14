import { createContext, useContext, useState, useEffect } from "react"
import { authAPI } from "@/api/auth"

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

    const login = async (email, password) => {
        setIsLoading(true)
        try {
            const data = await authAPI.login(email, password)
            
            // Django JWT response structure: { access, refresh, user: {...} } or similar
            const userData = data.user || {
                id: data.id,
                email: data.email,
                username: data.username,
                first_name: data.first_name,
                last_name: data.last_name,
            }
            
            const newAccessToken = data.access || data.accessToken
            const newRefreshToken = data.refresh || data.refreshToken

            setUser(userData)
            setAccessToken(newAccessToken)
            setRefreshToken(newRefreshToken)
            
            return userData
        } catch (error) {
            throw error
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
        } catch (error) {
            console.error('Logout error:', error)
            // Still logout even if API call fails
            setUser(null)
            setAccessToken(null)
            setRefreshToken(null)
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
            
            const newAccessToken = data.access || data.accessToken
            const newRefreshToken = data.refresh || data.refreshToken

            setUser(userData)
            setAccessToken(newAccessToken)
            setRefreshToken(newRefreshToken)
            
            return userData
        } catch (error) {
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const updateProfile = async (profileData) => {
        setIsLoading(true)
        try {
            const data = await authAPI.updateProfile(accessToken, profileData)
            setUser(prev => ({ ...prev, ...data }))
            return data
        } catch (error) {
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const changePassword = async (oldPassword, newPassword) => {
        setIsLoading(true)
        try {
            await authAPI.changePassword(accessToken, oldPassword, newPassword)
        } catch (error) {
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const value = {
        user,
        accessToken,
        refreshToken,
        isLoading,
        login,
        logout,
        register,
        updateProfile,
        changePassword,
        isAuthenticated: !!user && !!accessToken
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}
