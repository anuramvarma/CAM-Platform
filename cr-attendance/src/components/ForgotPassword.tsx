import React, { useState } from 'react';
import { api } from '../services/api'; // Adjust path as needed
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { KeyRound, ArrowLeft } from 'lucide-react';

interface ForgotPasswordProps {
    onBack: () => void;
    onRegister: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack, onRegister }) => {
    const [step, setStep] = useState<'EMAIL' | 'PASSWORD'>('EMAIL');
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleCheckEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.auth.checkEmail(email);
            if (res.exists) {
                setStep('PASSWORD');
            } else {
                // Should not happen if API returns 404 for not found (handled in catch)
                setError('Email not found');
            }
        } catch (err: any) {
            if (err.statusCode === 404 || err.message === 'Email not found') {
                setError('Email not registered. Redirecting to Register...');
                setTimeout(() => {
                    onRegister();
                }, 1500);
            } else {
                setError(err.message || 'Error verifying email');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await api.auth.resetPassword({ email, newPassword });
            setMessage('Password reset successfully! Please log in.');
            setTimeout(() => {
                onBack(); // Go back to login
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (message) {
        return (
            <div className="text-center p-6 space-y-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <KeyRound className="text-green-600" size={24} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Success!</h2>
                <p className="text-green-600">{message}</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="text-center mb-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="text-indigo-600" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                    {step === 'EMAIL' ? 'Forgot Password?' : 'Reset Password'}
                </h2>
                <p className="text-gray-500 mt-2">
                    {step === 'EMAIL'
                        ? 'Enter your email to verify account'
                        : 'Enter your new password'}
                </p>
            </div>

            {error && (
                <div className={`p-3 rounded-lg text-sm text-center mb-4 ${error.includes('Sign Up') ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600'
                    }`}>
                    {error}
                </div>
            )}

            {step === 'EMAIL' ? (
                <form onSubmit={handleCheckEmail} className="space-y-4">
                    <Input
                        label="Registered Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="cr@example.com"
                        required
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Verifying...' : 'Next'}
                    </Button>
                </form>
            ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="bg-gray-50 p-2 rounded mb-2 text-sm text-gray-600 text-center">
                        Account found: <span className="font-semibold">{email}</span>
                    </div>
                    <Input
                        label="New Password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    <Input
                        label="Confirm Password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                </form>
            )}

            <div className="mt-6 text-center">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center mx-auto text-sm text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft size={16} className="mr-1" /> Back to Login
                </button>
            </div>
        </div>
    );
};
