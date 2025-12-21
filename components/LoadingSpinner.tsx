
import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-5 h-5',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
    };

    return (
        <div 
            className={`animate-spin rounded-full border-t-2 border-b-2 border-white ${sizeClasses[size]}`}
            role="status"
            aria-live="polite"
        >
             <span className="sr-only">Loading...</span>
        </div>
    );
};
