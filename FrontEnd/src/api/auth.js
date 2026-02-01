/**
 * Authentication API calls to Django backend
 * Backend should be running at VITE_API_URL (default: http://localhost:8000)
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function safeReadJson(response) {
    const text = await response.text()
    if (!text) return null
    try {
        return JSON.parse(text)
    } catch {
        return null
    }
}

function extractErrorMessage(data) {
    if (!data) return null
    if (typeof data === 'string') return data
    if (typeof data?.detail === 'string') return data.detail
    if (typeof data?.message === 'string') return data.message

    if (typeof data === 'object') {
        for (const value of Object.values(data)) {
            if (typeof value === 'string') return value
            if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
        }
    }

    return null
}

export const authAPI = {
    /**
     * Login user with username and password
     * @param {string} username - Username
     * @param {string} password - User password
     * @returns {Promise<{access, refresh, user}>} Tokens and user data
     */
    login: async (username, password) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    password,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.detail || error.message || 'Login failed')
            }

            const data = await response.json()
            return data
        } catch (error) {
            throw new Error(error.message || 'Failed to connect to server')
        }
    },

    /**
     * Register new user
     * @param {object} userData - {username, email, password, password2, first_name, last_name, phone}
     * @returns {Promise<{user, access, refresh}>}
     */
    register: async (userData) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            })

            if (!response.ok) {
                let errorData = null
                try {
                    errorData = await response.json()
                } catch {
                    // Non-JSON response
                }

                const extractMessage = (data) => {
                    if (!data) return null
                    if (typeof data === 'string') return data
                    if (typeof data?.detail === 'string') return data.detail
                    if (typeof data?.message === 'string') return data.message

                    if (typeof data === 'object') {
                        for (const value of Object.values(data)) {
                            if (typeof value === 'string') return value
                            if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
                        }
                    }

                    return null
                }

                const message = extractMessage(errorData) || 'Registration failed'
                const err = new Error(message)
                err.data = errorData
                throw err
            }

            const data = await response.json()
            return data
        } catch (error) {
            if (error instanceof Error) {
                throw error
            }
            throw new Error('Failed to connect to server')
        }
    },

    /**
     * Logout user
     * @param {string} refreshToken - Refresh token for blacklisting
     * @returns {Promise<void>}
     */
    logout: async (refreshToken) => {
        try {
            await fetch(`${API_URL}/api/auth/logout/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refresh: refreshToken,
                }),
            })
        } catch (error) {
            console.error('Logout error:', error)
        }
    },

    /**
     * Get current user profile
     * @param {string} accessToken - JWT access token
     * @returns {Promise<{user}>}
     */
    getProfile: async (accessToken) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/profile/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                throw new Error('Failed to fetch profile')
            }

            const data = await response.json()
            return data
        } catch (error) {
            throw new Error(error.message || 'Failed to fetch profile')
        }
    },

    /**
     * Update user profile
     * @param {string} accessToken - JWT access token
     * @param {object} profileData - {first_name, last_name, phone, etc.}
     * @returns {Promise<{user}>}
     */
    updateProfile: async (accessToken, profileData) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/profile/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.detail || error.message || 'Failed to update profile')
            }

            const data = await response.json()
            return data
        } catch (error) {
            throw new Error(error.message || 'Failed to update profile')
        }
    },

    /**
     * Change user password
     * @param {string} accessToken - JWT access token
     * @param {string} oldPassword
     * @param {string} newPassword
     * @param {string} [confirmPassword]
     * @returns {Promise<{message}>}
     */
    changePassword: async (accessToken, oldPassword, newPassword, confirmPassword) => {
        try {
            if (!accessToken) {
                throw new Error('You must be logged in to change your password')
            }

            const headers = {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            }

            const endpoints = [
                // Preferred (per your backend): /api/auth/change-password/
                `${API_URL}/api/auth/change-password/`,
                // Fallback (some setups): /api/auth/password/change/
                `${API_URL}/api/auth/password/change/`,
            ]

            const attempts = [
                // Common custom backend format
                {
                    old_password: oldPassword,
                    new_password: newPassword,
                    new_password2: confirmPassword ?? newPassword,
                },
                // Some backends accept only one new password field
                {
                    old_password: oldPassword,
                    new_password: newPassword,
                },
                // Common Django auth libs (dj-rest-auth/djoser) format
                {
                    old_password: oldPassword,
                    new_password1: newPassword,
                    new_password2: confirmPassword ?? newPassword,
                },
            ]

            let lastError = null
            for (const endpoint of endpoints) {
                for (const body of attempts) {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(body),
                    })

                    if (response.ok) {
                        // Many Django endpoints return 204 No Content here.
                        const data = await safeReadJson(response)
                        return data || { message: 'Password changed' }
                    }

                    const errorData = await safeReadJson(response)
                    const message = extractErrorMessage(errorData)
                    lastError = new Error(message || 'Failed to change password')
                }
            }

            throw lastError || new Error('Failed to change password')
        } catch (error) {
            throw new Error(error.message || 'Failed to change password')
        }
    },

    /**
     * Refresh JWT token
     * @param {string} refreshToken - Refresh token
     * @returns {Promise<{access}>}
     */
    refreshToken: async (refreshToken) => {
        try {
            const response = await fetch(`${API_URL}/api/token/refresh/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refresh: refreshToken,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to refresh token')
            }

            const data = await response.json()
            return data
        } catch (error) {
            throw new Error(error.message || 'Failed to refresh token')
        }
    },
}
