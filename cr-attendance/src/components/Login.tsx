import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Lock } from 'lucide-react';
import { api } from '../services/api';

export const Login: React.FC = () => {
    const { login } = useApp();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false); // Quick register toggle for demo

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegistering) {
                await api.auth.register({ email, password });
                alert('Registered! Please login.');
                setIsRegistering(false);
            } else {
                await login({ email, password });
            }
        } catch (err: any) {
            setError(err.message || 'Authentication Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-sm p-6 space-y-6 bg-white shadow-xl">
                <div className="text-center">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="text-indigo-600" size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Class Rep Login</h1>
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

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Processing...' : (isRegistering ? 'Register' : 'Login')}
                    </Button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="text-sm text-indigo-600 hover:underline"
                        >
                            {isRegistering ? 'Back to Login' : 'New User? Register here'}
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
