import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
    return (
        <div
            className={cn(
                "bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};
