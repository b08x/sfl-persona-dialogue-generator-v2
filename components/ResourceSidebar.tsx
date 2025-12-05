import React from 'react';
import { SearchResultItem } from '../types';
import { LightbulbIcon, LoaderIcon } from './icons';

interface ResourceSidebarProps {
    results: SearchResultItem[];
    isLoading: boolean;
    error: string | null;
}

const ResourceSidebar: React.FC<ResourceSidebarProps> = ({ results, isLoading, error }) => {
    return (
        <div className="bg-brand-surface p-6 rounded-xl shadow-lg border border-brand-border h-full sticky top-8">
            <h3 className="text-xl font-bold text-brand-accent flex items-center gap-2 mb-6">
                <LightbulbIcon className="w-6 h-6" />
                <span>Contextual Resources</span>
            </h3>

            {isLoading && (
                <div className="flex flex-col items-center justify-center h-64 text-brand-text-secondary">
                    <LoaderIcon className="w-8 h-8 animate-spin mb-4" />
                    <p>Fetching resources...</p>
                </div>
            )}
            
            {error && !isLoading && (
                <div className="text-brand-error-text text-center p-4 bg-brand-error-text/10 rounded-md">
                    <p><strong>Failed to load resources.</strong></p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            )}
            
            {!isLoading && !error && results.length === 0 && (
                <div className="text-brand-text-secondary text-center h-64 flex items-center justify-center">
                    <p>No resources found for the current topics.</p>
                </div>
            )}

            {!isLoading && !error && results.length > 0 && (
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {results.map((item, index) => (
                        <a 
                            href={item.link} 
                            key={index} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="block p-4 bg-brand-bg rounded-lg border border-brand-border hover:border-brand-accent transition-all duration-200"
                        >
                            <div className="flex gap-4">
                                {item.thumbnail && (
                                    <div className="w-24 h-24 flex-shrink-0">
                                        <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover rounded-md" />
                                    </div>
                                )}
                                <div className="flex-grow">
                                    <h4 className="font-semibold text-brand-text-primary hover:text-brand-accent transition-colors">{item.title}</h4>
                                    <p className="text-sm text-brand-text-secondary mt-1 leading-snug">{item.snippet}</p>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ResourceSidebar;
