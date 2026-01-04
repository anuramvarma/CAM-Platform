import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Trash2, Plus } from 'lucide-react';

export const Subjects: React.FC = () => {
    const { subjects, addSubject, deleteSubject } = useApp();
    const [newSubject, setNewSubject] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSubject.trim()) {
            addSubject(newSubject.trim());
            setNewSubject('');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Subjects</h1>
                <span className="text-sm text-gray-500 dark:text-gray-400">{subjects.length} Total</span>
            </div>

            <Card className="p-4 bg-gray-50 dark:bg-gray-900 border-dashed border-gray-200 dark:border-gray-800">
                <form onSubmit={handleAdd} className="flex gap-2">
                    <Input
                        placeholder="Enter subject name (e.g., Data Structures)"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        className="bg-white dark:bg-gray-800"
                    />
                    <Button type="submit" disabled={!newSubject.trim()}>
                        <Plus size={20} />
                        Add
                    </Button>
                </form>
            </Card>

            <div className="grid gap-3">
                {subjects.map((subject) => (
                    <Card key={subject.id} className="p-4 flex items-center justify-between group dark:bg-gray-900 dark:border-gray-800">
                        <span className="font-medium text-gray-900 dark:text-white">{subject.name}</span>
                        <button
                            onClick={() => deleteSubject(subject.id)}
                            className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2"
                            title="Delete Subject"
                        >
                            <Trash2 size={18} />
                        </button>
                    </Card>
                ))}

                {subjects.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">No subjects added yet.</p>
                )}
            </div>
        </div>
    );
};
