import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    useEffect(() => {
        if (token) {
            // Verify token or decode it? 
            // For now just assume it's valid if present, or call a /me endpoint if we had one.
            // We can decode the JWT to get the email.
            setUser({ email: "User" }); // Placeholder
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
        }
        setLoading(false);
    }, [token]);

    const login = async (email, password) => {
        try {
            const formData = new URLSearchParams();
            formData.append('username', email); // OAuth2PasswordRequestForm expects username
            formData.append('password', password);

            // Actually our backend expects JSON UserCreate for /login? 
            // Wait, in auth.py: def login(user: UserCreate...
            // It expects JSON body {email, password}.

            const response = await axios.post(`${API_URL}/auth/login`, {
                email,
                password
            });

            const { access_token } = response.data;
            localStorage.setItem('token', access_token);
            setToken(access_token);
            return true;
        } catch (error) {
            console.error("Login failed", error);
            return false;
        }
    };

    const register = async (email, password) => {
        try {
            await axios.post(`${API_URL}/auth/register`, {
                email,
                password
            });
            return await login(email, password);
        } catch (error) {
            console.error("Registration failed", error);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
