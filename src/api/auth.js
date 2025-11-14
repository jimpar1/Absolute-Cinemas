/**
 * Authentication API calls to Django backend
 * Backend should be running at VITE_API_URL (default: http://localhost:8000)
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const authAPI = {
    /**
     * Login user with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<{access, refresh, user}>} Tokens and user data
     */
    login: async (email, password) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
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
                const error = await response.json()
                throw new Error(error.detail || error.message || 'Registration failed')
            }

            const data = await response.json()
            return data
        } catch (error) {
            throw new Error(error.message || 'Failed to connect to server')
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
