import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';

export const SetupWizard: React.FC = () => {
    const { completeSetup } = useApp();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        degree: 'B.Tech',
        dept: 'CSE',
        section: 'A',
        yearOfStudy: '1',
        admissionYear: '23',
        collegeCode: 'PA',
        startRoll: '',
        endRoll: '',
        lateralDetails: {
            enabled: false,
            startRoll: '',
            endRoll: ''
        }
    });

    const updateLateral = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            lateralDetails: { ...prev.lateralDetails, [field]: value }
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await completeSetup(formData);
        } catch (err: any) {
            alert('Setup Failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const selectClass =
        "w-full border rounded p-2 bg-white text-gray-900 " +
        "dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 " +
        "focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400";

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg p-6 bg-white dark:bg-gray-900">
                <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                    Class Setup
                </h1>

                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                        Basic Info
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                Year of Study
                            </label>
                            <select
                                className={selectClass}
                                value={formData.yearOfStudy}
                                onChange={e =>
                                    setFormData({ ...formData, yearOfStudy: e.target.value })
                                }
                            >
                                <option value="1">1st Year</option>
                                <option value="2">2nd Year</option>
                                <option value="3">3rd Year</option>
                                <option value="4">4th Year</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                Degree
                            </label>
                            <select
                                className={selectClass}
                                value={formData.degree}
                                onChange={e =>
                                    setFormData({ ...formData, degree: e.target.value })
                                }
                            >
                                <option value="B.Tech">B.Tech</option>
                                <option value="M.Tech">M.Tech</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                Department
                            </label>
                            <select
                                className={selectClass}
                                value={formData.dept}
                                onChange={e =>
                                    setFormData({ ...formData, dept: e.target.value })
                                }
                            >
                                <option value="CSE">CSE</option>
                                <option value="ECE">ECE</option>
                                <option value="IT">IT</option>
                                <option value="AIML">AIML</option>
                                <option value="AIDS">AIDS</option>
                                <option value="CIVIL">CIVIL</option>
                                <option value="MECH">MECH</option>
                                <option value="EEE">EEE</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                Section
                            </label>
                            <select
                                className={selectClass}
                                value={formData.section}
                                onChange={e =>
                                    setFormData({ ...formData, section: e.target.value })
                                }
                            >
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                            </select>
                        </div>

                        <Input
                            label="Admission Batch (YY)"
                            value={formData.admissionYear}
                            onChange={e =>
                                setFormData({ ...formData, admissionYear: e.target.value })
                            }
                        />

                        <Input
                            label="College Code"
                            value={formData.collegeCode}
                            onChange={e =>
                                setFormData({ ...formData, collegeCode: e.target.value })
                            }
                        />
                    </div>

                    <h3 className="font-semibold text-gray-700 dark:text-gray-300 mt-4">
                        Regular Students
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Start Roll No"
                            placeholder="23PA1A0501"
                            value={formData.startRoll}
                            onChange={e =>
                                setFormData({ ...formData, startRoll: e.target.value })
                            }
                        />
                        <Input
                            label="End Roll No"
                            placeholder="23PA1A0560"
                            value={formData.endRoll}
                            onChange={e =>
                                setFormData({ ...formData, endRoll: e.target.value })
                            }
                        />
                    </div>

                    {formData.yearOfStudy !== '1' && (
                        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <label className="flex items-center gap-2 mb-4 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.lateralDetails.enabled}
                                    onChange={e =>
                                        updateLateral('enabled', e.target.checked)
                                    }
                                    className="w-4 h-4 accent-primary-600"
                                />
                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                    Include Lateral Entry Students?
                                </span>
                            </label>

                            {formData.lateralDetails.enabled && (
                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                    <Input
                                        label="Lateral Start Roll"
                                        placeholder="24PA5A0501"
                                        value={formData.lateralDetails.startRoll}
                                        onChange={e =>
                                            updateLateral('startRoll', e.target.value)
                                        }
                                    />
                                    <Input
                                        label="Lateral End Roll"
                                        placeholder="24PA5A0510"
                                        value={formData.lateralDetails.endRoll}
                                        onChange={e =>
                                            updateLateral('endRoll', e.target.value)
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <Button
                        onClick={handleSubmit}
                        className="w-full mt-6"
                        disabled={loading}
                    >
                        {loading ? 'Setting up...' : 'Complete Setup'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};