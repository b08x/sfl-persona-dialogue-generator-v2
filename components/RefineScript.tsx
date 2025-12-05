import React, { useState } from 'react';
import { DialogueLine, Persona } from '../types';
import { UserIcon, EditIcon, SparklesIcon, PlusIcon, LoaderIcon } from './icons';

interface DialogueLineEditProps {
    line: DialogueLine;
    persona: Persona | undefined;
    onRefineLine: (lineId: string, instruction: string) => void;
    isRefining: boolean;
}

const DialogueLineEdit: React.FC<DialogueLineEditProps> = ({ line, persona, onRefineLine, isRefining }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [prompt, setPrompt] = useState('');

    const handleRefineClick = () => {
        if (prompt.trim()) {
            onRefineLine(line.id, prompt);
        }
    }

    return (
        <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-10 h-10 bg-brand-surface rounded-full flex items-center justify-center border-2 border-brand-border">
                <UserIcon className="w-5 h-5 text-brand-text-secondary" />
            </div>
            <div className="flex-grow bg-brand-surface p-4 rounded-lg border border-brand-border">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold text-brand-text-primary">{line.speakerName}</p>
                        <p className="mt-2 text-brand-text-primary leading-relaxed">{line.line}</p>
                    </div>
                    <button onClick={() => setIsEditing(!isEditing)} className="text-brand-text-secondary hover:text-brand-accent transition-colors p-1">
                        <EditIcon className="w-5 h-5" />
                    </button>
                </div>
                {isEditing && (
                    <div className="mt-4 pt-4 border-t border-brand-border">
                        <label className="text-sm font-medium text-brand-text-secondary">Refinement Prompt</label>
                        <div className="mt-1 flex gap-2">
                             <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={`e.g., "Make this sound more assertive"`}
                                className="block w-full bg-brand-bg border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-text-primary focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm"
                            />
                            <button 
                                onClick={handleRefineClick}
                                disabled={isRefining || !prompt.trim()}
                                className="flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-button hover:bg-brand-button-hover disabled:bg-brand-border disabled:cursor-not-allowed"
                            >
                                {isRefining ? <LoaderIcon className="w-5 h-5 animate-spin"/> : <SparklesIcon className="w-5 h-5" />}
                                <span>Refine</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


interface RefineScriptProps {
    dialogueLines: DialogueLine[];
    personas: Persona[];
    onRefineLine: (lineId: string, instruction: string) => void;
    onGenerateNextLine: () => void;
    isRefiningLineId: string | null;
    isAddingNextLine: boolean;
}

const RefineScript: React.FC<RefineScriptProps> = ({
    dialogueLines,
    personas,
    onRefineLine,
    onGenerateNextLine,
    isRefiningLineId,
    isAddingNextLine,
}) => {
    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-brand-text-primary mb-2">Refine Your Script</h2>
            <p className="text-brand-text-secondary mb-8">Use the edit button on any line to refine it with an AI prompt, or add to the conversation.</p>
            
            <div className="space-y-6">
                {dialogueLines.map(line => {
                    const persona = personas.find(p => p.id === line.personaId);
                    return <DialogueLineEdit 
                                key={line.id} 
                                line={line}
                                persona={persona} 
                                onRefineLine={onRefineLine}
                                isRefining={isRefiningLineId === line.id}
                            />
                })}
            </div>

            <div className="mt-8 flex justify-center">
                 <button 
                    onClick={onGenerateNextLine}
                    disabled={isAddingNextLine || isRefiningLineId !== null}
                    className="flex items-center justify-center gap-2 px-6 py-3 border border-brand-border text-sm font-medium rounded-md shadow-sm text-brand-text-primary bg-brand-surface hover:bg-brand-accent/20 hover:border-brand-accent disabled:bg-brand-border disabled:cursor-not-allowed transition-all"
                >
                    {isAddingNextLine ? <LoaderIcon className="w-5 h-5 animate-spin"/> : <PlusIcon className="w-5 h-5" />}
                    <span>Generate Next Line</span>
                </button>
            </div>
        </div>
    );
};

export default RefineScript;