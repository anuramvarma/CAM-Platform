import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Lock, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { ForgotPassword } from './ForgotPassword';

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT';

export const Login: React.FC = () => {
    const { login } = useApp();
    const [mode, setMode] = useState<AuthMode>('LOGIN');

    // Login/Register Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'REGISTER') {
                await api.auth.register({ email, password });
                setSuccessMessage('Registration successful! Redirecting to login...');
                setTimeout(() => {
                    setSuccessMessage('');
                    setMode('LOGIN');
                }, 2000);
            } else {
                await login({ email, password });
            }
        } catch (err: any) {
            setError(err.message || 'Authentication Failed');
        } finally {
            setLoading(false);
        }
    };

    if (mode === 'FORGOT') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-sm p-6 space-y-6 bg-white shadow-xl">
                    <ForgotPassword
                        onBack={() => {
                            setMode('LOGIN');
                            setError('');
                        }}
                        onRegister={() => {
                            setMode('REGISTER');
                            setError('');
                        }}
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-sm p-6 space-y-6 bg-white shadow-xl">
                {successMessage ? (
                    <div className="text-center p-6 space-y-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="text-green-600" size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Success!</h2>
                        <p className="text-green-600">{successMessage}</p>
                    </div>
                ) : (
                    <>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="text-indigo-600" size={24} />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {mode === 'REGISTER' ? 'Register as a CR' : 'Class Rep Login'}
                            </h1>
                            <p className="text-gray-500 mt-2">Enter credentials to continue</p>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="cr@example.com"
                                required
                            />
                            <Input
                                label="Password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />

                            <div className="flex items-center justify-end">
                                <button
                                    type="button"
                                    onClick={() => setMode('FORGOT')}
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                    Forgot Password?
                                </button>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Processing...' : (mode === 'REGISTER' ? 'Register' : 'Login')}
                            </Button>


                            <div className="text-center space-y-2">
                                <button
                                    type="button"
                                    onClick={() => setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
                                    className="text-sm text-indigo-600 hover:underline block w-full"
                                >
                                    {mode === 'REGISTER' ? 'Already have an account? Login' : 'New User? Register here'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </Card>
        </div>
    );
};
