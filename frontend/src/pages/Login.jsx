import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isLogin && password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        let success;
        if (isLogin) {
            success = await login(email, password);
        } else {
            success = await register(email, password);
        }

        if (success) {
            navigate('/');
        } else {
            setError('Authentication failed. Please check your credentials.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-dark text-brand-text">
            <div className="bg-brand-card p-8 rounded-lg shadow-lg w-full max-w-md border border-white/10">
                <h2 className="text-2xl font-bold mb-6 text-center text-brand-accent">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>

                {error && (
                    <div className="bg-red-500/20 text-red-300 p-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-brand-muted">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 rounded bg-black/30 border border-white/10 focus:border-brand-accent focus:outline-none text-brand-text"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-brand-muted">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 rounded bg-black/30 border border-white/10 focus:border-brand-accent focus:outline-none text-brand-text"
                            required
                        />
                    </div>
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium mb-1 text-brand-muted">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-2 rounded bg-black/30 border border-white/10 focus:border-brand-accent focus:outline-none text-brand-text"
                                required
                            />
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full py-2 px-4 bg-brand-accent hover:bg-opacity-90 text-white rounded font-medium transition-colors"
                    >
                        {isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-4 text-center text-sm text-brand-muted">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-brand-accent hover:underline"
                    >
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
