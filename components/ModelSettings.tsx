

import React, { useState } from 'react';
import { AVAILABLE_MODELS } from '../constants';

interface ModelSettingsProps {
    selectedModel: string;
    onModelChange: (modelId: string) => void;
    thinkingBudget: string;
    onThinkingBudgetChange: (value: string) => void;
    temperature: number;
    onTemperatureChange: (value: number) => void;
    googleApiKey: string;
    onGoogleApiKeyChange: (value: string) => void;
    googleCseId: string;
    onGoogleCseIdChange: (value: string) => void;
}

const ModelSettings: React.FC<ModelSettingsProps> = ({
    selectedModel,
    onModelChange,
    thinkingBudget,
    onThinkingBudgetChange,
    temperature,
    onTemperatureChange,
    googleApiKey,
    onGoogleApiKeyChange,
    googleCseId,
    onGoogleCseIdChange
}) => {
    const selectedModelInfo = AVAILABLE_MODELS.find(m => m.id === selectedModel);
    const [showSearchSettings, setShowSearchSettings] = useState(false);

    return (
        <div className="bg-brand-surface p-6 rounded-xl shadow-lg border border-brand-border max-w-4xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-brand-text-primary mb-4">Model & App Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div>
                    <label htmlFor="model-select" className="block text-sm font-medium text-brand-text-secondary">
                        AI Model
                    </label>
                    <select
                        id="model-select"
                        value={selectedModel}
                        onChange={(e) => onModelChange(e.target.value)}
                        className="mt-1 block w-full bg-brand-bg border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-text-primary focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm"
                    >
                        {AVAILABLE_MODELS.map(model => (
                            <option key={model.id} value={model.id}>
                                {model.name}
                            </option>
                        ))}
                    </select>
                    {selectedModelInfo && (
                        <p className="text-sm text-brand-text-secondary mt-2">{selectedModelInfo.description}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="temperature" className="block text-sm font-medium text-brand-text-secondary flex justify-between">
                        <span>Creativity (Temperature)</span>
                        <span className="text-brand-accent">{temperature.toFixed(1)}</span>
                    </label>
                    <input
                        type="range"
                        id="temperature"
                        min="0"
                        max="2"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
                        className="mt-3 w-full h-2 bg-brand-bg rounded-lg appearance-none cursor-pointer accent-brand-accent"
                    />
                     <div className="flex justify-between text-xs text-brand-text-secondary mt-1">
                        <span>Precise</span>
                        <span>Balanced</span>
                        <span>Creative</span>
                    </div>
                </div>
                
                {selectedModelInfo?.hasThinking && (
                    <div className="md:col-span-2">
                        <label htmlFor="thinking-budget" className="block text-sm font-medium text-brand-text-secondary">
                            Thinking Budget (Tokens)
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                id="thinking-budget"
                                value={thinkingBudget}
                                onChange={(e) => onThinkingBudgetChange(e.target.value)}
                                min="0"
                                step="50"
                                className="mt-1 block w-32 bg-brand-bg border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-text-primary focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm"
                            />
                            <p className="text-sm text-brand-text-secondary mt-1">
                                Controls resources for reasoning. 0 disables it.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="pt-4 border-t border-brand-border">
                <button 
                    onClick={() => setShowSearchSettings(!showSearchSettings)}
                    className="text-brand-accent hover:text-brand-accent-hover text-sm font-medium flex items-center gap-2"
                >
                    <span>{showSearchSettings ? 'Hide' : 'Show'} Contextual Search Settings</span>
                    <svg className={`w-4 h-4 transform transition-transform ${showSearchSettings ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                
                {showSearchSettings && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div>
                            <label htmlFor="google-api-key" className="block text-sm font-medium text-brand-text-secondary">
                                Google Custom Search API Key
                            </label>
                            <input
                                type="password"
                                id="google-api-key"
                                value={googleApiKey}
                                onChange={(e) => onGoogleApiKeyChange(e.target.value)}
                                placeholder="Enter API Key"
                                className="mt-1 block w-full bg-brand-bg border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-text-primary focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm"
                            />
                             <p className="text-xs text-brand-text-secondary mt-1">Needed for "Contextual Resources" feature.</p>
                        </div>
                        <div>
                            <label htmlFor="google-cse-id" className="block text-sm font-medium text-brand-text-secondary">
                                Custom Search Engine ID (cx)
                            </label>
                            <input
                                type="text"
                                id="google-cse-id"
                                value={googleCseId}
                                onChange={(e) => onGoogleCseIdChange(e.target.value)}
                                placeholder="Enter Search Engine ID"
                                className="mt-1 block w-full bg-brand-bg border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-text-primary focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm"
                            />
                        </div>
                     </div>
                )}
            </div>
        </div>
    );
};

export default ModelSettings;