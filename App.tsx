import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Persona, ShowStructure, AppStep, SFLAnalysisResult, DialogueLine, SearchResultItem, SourceContent, SourceType } from './types';
import { analyzeDocument, generateDialogue, refineDialogueLine, generateNextDialogueLine, analyzeShowContext } from './services/geminiService';
import { searchGoogle } from './services/googleSearchService';
import PersonaCard from './components/PersonaCard';
import StepIndicator from './components/StepIndicator';
import { SparklesIcon, LoaderIcon, FileTextIcon, QuestionMarkCircleIcon, MicrophoneIcon, VideoCameraIcon, TrashIcon } from './components/icons';
import RefineScript from './components/RefineScript';
import ResourceSidebar from './components/ResourceSidebar';
import ModelSettings from './components/ModelSettings';
import HelpModal from './components/HelpModal';
import { AVAILABLE_MODELS } from './constants';


const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.PERSONA_CONFIG);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [showStructure, setShowStructure] = useState<ShowStructure>({
    title: 'Untitled Episode',
    primaryHostId: null,
    intro: '',
    topics: [],
    contextSources: [],
  });
  const [dialogueLines, setDialogueLines] = useState<DialogueLine[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefiningLineId, setIsRefiningLineId] = useState<string | null>(null);
  const [isAddingNextLine, setIsAddingNextLine] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzingContext, setIsAnalyzingContext] = useState<boolean>(false);

  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Model configuration state
  const [selectedModel, setSelectedModel] = useState<string>(AVAILABLE_MODELS[0].id);
  const [thinkingBudgetString, setThinkingBudgetString] = useState<string>('100');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [googleApiKey, setGoogleApiKey] = useState<string>('');
  const [googleCseId, setGoogleCseId] = useState<string>('');
  
  const getModelConfig = useCallback(() => {
    const modelInfo = AVAILABLE_MODELS.find(m => m.id === selectedModel);
    const budget = parseInt(thinkingBudgetString, 10);
    const effectiveBudget = (modelInfo?.hasThinking && !isNaN(budget)) ? budget : undefined;

    return { model: selectedModel, budget: effectiveBudget, temperature };
  }, [selectedModel, thinkingBudgetString, temperature]);

  const handleAddPersona = () => {
    const newPersona: Persona = {
      id: `persona-${Date.now()}`,
      name: `Speaker ${personas.length + 1}`,
      role: '',
      speakingStyle: '',
      sources: [],
      sflProfile: null,
      isAnalyzing: false,
    };
    setPersonas([...personas, newPersona]);
  };

  const handleUpdatePersona = useCallback((id: string, updates: Partial<Persona>) => {
    setPersonas(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const handleDeletePersona = (id: string) => {
    setPersonas(prev => prev.filter(p => p.id !== id));
  };

  const handleAnalyzePersona = useCallback(async (id: string) => {
    const persona = personas.find(p => p.id === id);
    if (!persona || persona.sources.length === 0) return;

    handleUpdatePersona(id, { isAnalyzing: true });
    setError(null);

    try {
      const { model, budget } = getModelConfig();
      // Pass the full source objects to the service for multimodal analysis
      const analysisResult = await analyzeDocument(persona.sources, model, budget);
      
      // Auto-populate speaking style combining Tone and SFL Persona Style
      const autoStyle = `${analysisResult.tone}, ${analysisResult.personaStyle}`;

      handleUpdatePersona(id, { 
          sflProfile: analysisResult, 
          speakingStyle: autoStyle,
          isAnalyzing: false 
      });
    } catch (e) {
      setError((e as Error).message);
      handleUpdatePersona(id, { isAnalyzing: false });
    }
  }, [personas, handleUpdatePersona, getModelConfig]);

  const handleContextFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>, type: SourceType) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const newSources: SourceContent[] = [];
      let filesToProcess = files.length;

      files.forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target && typeof e.target.result === 'string') {
            let data = e.target.result;
            if (type !== 'text') {
                // Strip Data URL prefix for base64
                data = data.split(',')[1];
            }
            newSources.push({
                id: `ctx-source-${Date.now()}-${Math.random()}`,
                name: file.name,
                type: type,
                mimeType: file.type || 'text/plain',
                data: data
            });
          }
          filesToProcess--;
          if (filesToProcess === 0) {
            setShowStructure(prev => ({...prev, contextSources: [...prev.contextSources, ...newSources]}));
          }
        };
        reader.onerror = () => {
          filesToProcess--;
           if (filesToProcess === 0) {
            setShowStructure(prev => ({...prev, contextSources: [...prev.contextSources, ...newSources]}));
          }
        };
        
        if (type === 'text') {
            reader.readAsText(file);
        } else {
            reader.readAsDataURL(file);
        }
      });
    }
  }, []);

  const removeContextSource = (id: string) => {
      setShowStructure(prev => ({...prev, contextSources: prev.contextSources.filter(s => s.id !== id)}));
  };

  const handleAnalyzeShowContext = async () => {
    if (showStructure.contextSources.length === 0) return;
    setIsAnalyzingContext(true);
    setError(null);
    try {
        const { model, budget } = getModelConfig();
        const result = await analyzeShowContext(showStructure.contextSources, model, budget);
        setShowStructure(prev => ({
            ...prev,
            title: result.title,
            intro: result.intro,
            topics: result.topics
        }));
    } catch (e) {
        setError((e as Error).message);
    } finally {
        setIsAnalyzingContext(false);
    }
  };

  const parseScript = (scriptText: string, currentPersonas: Persona[]): DialogueLine[] => {
      const lines = scriptText.split('\n').filter(line => line.includes(':'));
      return lines.map((line, index) => {
        const [speakerName, ...rest] = line.split(':');
        const lineText = rest.join(':').trim();
        const persona = currentPersonas.find(p => p.name.trim().toLowerCase() === speakerName.trim().toLowerCase());
        return {
          id: `line-${Date.now()}-${index}`,
          speakerName: speakerName.trim(),
          personaId: persona ? persona.id : null,
          line: lineText,
        };
      });
    };

  const handleGenerateScript = async () => {
        if (personas.length === 0 || !showStructure.primaryHostId) {
            setError("Please configure at least one persona and select a primary host.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const { model, budget, temperature } = getModelConfig();
            const script = await generateDialogue(personas, showStructure, model, budget, temperature);
            const parsedLines = parseScript(script, personas);
            setDialogueLines(parsedLines);
            setStep(AppStep.REFINE_SCRIPT);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const getScriptHistory = (untilLineId?: string): string => {
        const historyLines: string[] = [];
        for (const line of dialogueLines) {
            if (line.id === untilLineId) break;
            historyLines.push(`${line.speakerName}: ${line.line}`);
        }
        return historyLines.join('\n');
    };

    const handleRefineLine = async (lineId: string, instruction: string) => {
        const lineToRefine = dialogueLines.find(l => l.id === lineId);
        if (!lineToRefine) return;

        setIsRefiningLineId(lineId);
        setError(null);
        try {
            const { model, budget, temperature } = getModelConfig();
            const history = getScriptHistory(lineId);
            const refinedLineText = await refineDialogueLine(history, { speaker: lineToRefine.speakerName, line: lineToRefine.line }, instruction, personas, model, budget, temperature);
            setDialogueLines(prev => prev.map(l => l.id === lineId ? {...l, line: refinedLineText.trim()} : l));
        } catch(e) {
            setError((e as Error).message);
        } finally {
            setIsRefiningLineId(null);
        }
    };

    const handleGenerateNextLine = async () => {
        setIsAddingNextLine(true);
        setError(null);
        try {
            const { model, budget, temperature } = getModelConfig();
            const history = getScriptHistory();
            const lastSpeaker = dialogueLines[dialogueLines.length - 1];
            const nextLineRaw = await generateNextDialogueLine(history, personas, lastSpeaker.speakerName, model, budget, temperature);
            
            const [speakerName, ...rest] = nextLineRaw.split(':');
            if (!speakerName || rest.length === 0) throw new Error("AI returned an invalid format for the next line.");
            
            const newLine = parseScript(nextLineRaw, personas)[0];
            if (newLine) {
                setDialogueLines(prev => [...prev, newLine]);
            }

        } catch(e) {
            setError((e as Error).message);
        } finally {
            setIsAddingNextLine(false);
        }
    };

  const handleSearch = useCallback(async () => {
    if (showStructure.topics.length === 0) return;
    
    setIsSearching(true);
    setSearchError(null);
    try {
        const query = showStructure.topics.join(' ');
        // Pass the user-provided keys if they exist, otherwise service falls back to env
        const results = await searchGoogle(query, googleApiKey, googleCseId);
        setSearchResults(results);
    } catch (e) {
        setSearchError((e as Error).message);
    } finally {
        setIsSearching(false);
    }
  }, [showStructure.topics, googleApiKey, googleCseId]);

  useEffect(() => {
    if (step === AppStep.REFINE_SCRIPT && dialogueLines.length > 0 && searchResults.length === 0 && !isSearching) {
      handleSearch();
    }
  }, [step, dialogueLines, searchResults, isSearching, handleSearch]);


  const handleNextStep = () => {
    const nextStep = step + 1;
    if (step === AppStep.PERSONA_CONFIG) {
        // If topics are empty, pre-populate with some default or extracted ones from personas IF showContext is empty
        // If showContext exists, the user likely used "Analyze Context" which populates topics.
        if (showStructure.topics.length === 0) {
             const allTopics = personas.flatMap(p => p.sflProfile?.topics || []);
             const uniqueTopics = [...new Set(allTopics)];
             if (uniqueTopics.length > 0) {
                setShowStructure(prev => ({ ...prev, topics: uniqueTopics.slice(0, 5) })); 
             } else {
                 setShowStructure(prev => ({ ...prev, topics: ['Main Topic'] }));
             }
        }
    }
    setStep(nextStep);
  };
  
  const handlePrevStep = () => {
    if (step > AppStep.PERSONA_CONFIG) {
        setStep(prevStep => prevStep - 1);
    }
  };

  const handleStepClick = (stepId: AppStep) => {
    if (stepId < step) {
        setStep(stepId);
    }
  };

  const handleExportJson = useCallback(() => {
    const exportData = {
        show: {
            title: showStructure.title,
            generatedAt: new Date().toISOString(),
            host: personas.find(p => p.id === showStructure.primaryHostId)?.name,
            intro: showStructure.intro,
            topics: showStructure.topics
        },
        personas: personas.map(p => ({
            name: p.name,
            role: p.role,
            style: p.speakingStyle,
            sflProfile: p.sflProfile
        })),
        script: dialogueLines.map(l => ({
            speaker: l.speakerName,
            text: l.line
        }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${showStructure.title.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'podcast'}_script.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [showStructure, personas, dialogueLines]);

  const isNextEnabled = useMemo(() => {
    if (step === AppStep.PERSONA_CONFIG) {
      return personas.length > 0 && personas.every(p => p.sflProfile !== null);
    }
    if (step === AppStep.SHOW_STRUCTURE) {
        return showStructure.title.trim() !== '' && showStructure.primaryHostId !== null && showStructure.topics.length > 0 && showStructure.topics.every(t => t.trim() !== '');
    }
    if (step === AppStep.REFINE_SCRIPT) {
        return dialogueLines.length > 0;
    }
    return true;
  }, [step, personas, showStructure, dialogueLines]);

  const showSidebar = step === AppStep.REFINE_SCRIPT || step === AppStep.FINAL_REVIEW;

  const renderContent = () => {
    switch (step) {
      case AppStep.PERSONA_CONFIG:
        return (
          <div>
            <ModelSettings
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              thinkingBudget={thinkingBudgetString}
              onThinkingBudgetChange={setThinkingBudgetString}
              temperature={temperature}
              onTemperatureChange={setTemperature}
              googleApiKey={googleApiKey}
              onGoogleApiKeyChange={setGoogleApiKey}
              googleCseId={googleCseId}
              onGoogleCseIdChange={setGoogleCseId}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
              {personas.map(p => (
                <PersonaCard
                  key={p.id}
                  persona={p}
                  onUpdate={handleUpdatePersona}
                  onDelete={handleDeletePersona}
                  onAnalyze={handleAnalyzePersona}
                />
              ))}
            </div>
            <div className="mt-8">
              <button
                onClick={handleAddPersona}
                className="w-full border-2 border-dashed border-brand-border rounded-lg py-6 text-brand-text-secondary hover:border-brand-accent hover:text-brand-accent transition-colors"
              >
                + Add Speaker
              </button>
            </div>
          </div>
        );
      case AppStep.SHOW_STRUCTURE:
        return (
            <div className="max-w-2xl mx-auto bg-brand-surface p-8 rounded-lg shadow-lg border border-brand-border">
                <div className="space-y-6">
                     <div>
                        <label className="block text-sm font-medium text-brand-text-secondary mb-2">Show Context (Optional)</label>
                        <p className="text-xs text-brand-text-secondary mb-3">Upload files to serve as the context/topic for the episode. The speakers will discuss this content.</p>
                        <div className="flex gap-2 mb-4">
                            <label className="cursor-pointer flex items-center px-3 py-2 border border-brand-border rounded-md text-brand-text-secondary hover:border-brand-accent hover:text-brand-accent transition-colors bg-brand-bg/50">
                                <FileTextIcon className="w-4 h-4 mr-2" />
                                <span className="text-xs">Text</span>
                                <input type="file" multiple className="hidden" onChange={(e) => handleContextFileChange(e, 'text')} accept=".txt,.md,.pdf,.csv" />
                            </label>
                            <label className="cursor-pointer flex items-center px-3 py-2 border border-brand-border rounded-md text-brand-text-secondary hover:border-brand-accent hover:text-brand-accent transition-colors bg-brand-bg/50">
                                <MicrophoneIcon className="w-4 h-4 mr-2" />
                                <span className="text-xs">Audio</span>
                                <input type="file" multiple className="hidden" onChange={(e) => handleContextFileChange(e, 'audio')} accept="audio/*" />
                            </label>
                            <label className="cursor-pointer flex items-center px-3 py-2 border border-brand-border rounded-md text-brand-text-secondary hover:border-brand-accent hover:text-brand-accent transition-colors bg-brand-bg/50">
                                <VideoCameraIcon className="w-4 h-4 mr-2" />
                                <span className="text-xs">Video</span>
                                <input type="file" multiple className="hidden" onChange={(e) => handleContextFileChange(e, 'video')} accept="video/*" />
                            </label>
                        </div>
                        
                         <div className="space-y-2 mb-4">
                            {showStructure.contextSources.map(source => (
                                <div key={source.id} className="flex items-center justify-between bg-brand-bg p-2 rounded-md text-sm">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="text-brand-text-secondary uppercase text-xs font-bold border border-brand-border px-1 rounded">{source.type}</span>
                                        <span className="text-brand-text-primary truncate">{source.name || 'Uploaded Content'}</span>
                                    </div>
                                    <button onClick={() => removeContextSource(source.id)} className="text-brand-text-secondary hover:text-red-500 ml-2">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                         </div>
                         
                         {showStructure.contextSources.length > 0 && (
                             <button 
                                onClick={handleAnalyzeShowContext} 
                                disabled={isAnalyzingContext}
                                className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-brand-accent text-brand-accent rounded-md hover:bg-brand-accent hover:text-white transition-colors text-sm font-medium disabled:opacity-50"
                             >
                                {isAnalyzingContext ? <LoaderIcon className="w-4 h-4 animate-spin"/> : <SparklesIcon className="w-4 h-4"/>}
                                Analyze Context & Extract Topics
                             </button>
                         )}
                    </div>
                    
                    <div className="border-t border-brand-border pt-6">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-brand-text-secondary">Episode Title</label>
                            <input type="text" name="title" id="title" value={showStructure.title} onChange={e => setShowStructure({...showStructure, title: e.target.value})} className="mt-1 block w-full bg-brand-bg border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-text-primary focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm" />
                        </div>
                        <div className="mt-4">
                            <label htmlFor="host" className="block text-sm font-medium text-brand-text-secondary">Primary Host</label>
                            <select id="host" name="host" value={showStructure.primaryHostId || ''} onChange={e => setShowStructure({...showStructure, primaryHostId: e.target.value})} className="mt-1 block w-full bg-brand-bg border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-text-primary focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm">
                                <option value="" disabled>Select a host</option>
                                {personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="mt-4">
                            <label htmlFor="intro" className="block text-sm font-medium text-brand-text-secondary">Intro Outline/Notes</label>
                            <textarea id="intro" name="intro" rows={3} value={showStructure.intro} onChange={e => setShowStructure({...showStructure, intro: e.target.value})} className="mt-1 block w-full bg-brand-bg border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-text-primary focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm" placeholder="e.g., Welcome everyone. Today we're discussing... with our experts..."></textarea>
                        </div>
                         <div className="mt-4">
                            <label className="block text-sm font-medium text-brand-text-secondary">Topics</label>
                            {showStructure.topics.map((topic, index) => (
                               <div key={index} className="flex items-center mt-1">
                                    <input type="text" value={topic} onChange={e => {
                                        const newTopics = [...showStructure.topics];
                                        newTopics[index] = e.target.value;
                                        setShowStructure({...showStructure, topics: newTopics});
                                    }} className="block w-full bg-brand-bg border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-text-primary focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm" />
                                    <button onClick={() => setShowStructure({...showStructure, topics: showStructure.topics.filter((_, i) => i !== index)})} className="ml-2 text-red-500 hover:text-red-400 transition-colors p-1 rounded-full">&times;</button>
                               </div>
                            ))}
                            <button onClick={() => setShowStructure({...showStructure, topics: [...showStructure.topics, '']})} className="mt-2 text-sm text-brand-accent hover:text-brand-accent-hover">+ Add Topic</button>
                        </div>
                    </div>
                </div>
            </div>
        );
     case AppStep.GENERATE_DIALOGUE:
        return (
            <div className="text-center max-w-lg mx-auto">
                <h2 className="text-2xl font-bold text-brand-text-primary">Ready to Generate Dialogue</h2>
                <p className="mt-2 text-brand-text-secondary">Review your configuration below. When you're ready, click the button to generate the podcast script.</p>
                <div className="mt-6 bg-brand-surface p-6 rounded-lg text-left space-y-4 border border-brand-border">
                    <p><strong className="text-brand-text-secondary">Title:</strong> {showStructure.title}</p>
                    <p><strong className="text-brand-text-secondary">Host:</strong> {personas.find(p=>p.id === showStructure.primaryHostId)?.name}</p>
                    <p><strong className="text-brand-text-secondary">Speakers:</strong> {personas.map(p => p.name).join(', ')}</p>
                    <p><strong className="text-brand-text-secondary">Model:</strong> {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name}</p>
                    {showStructure.contextSources.length > 0 && (
                        <p><strong className="text-brand-text-secondary">Context Sources:</strong> {showStructure.contextSources.length} files attached</p>
                    )}
                </div>
                 <button onClick={handleGenerateScript} disabled={isLoading} className="mt-8 w-full flex items-center justify-center gap-2 px-6 py-4 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-button hover:bg-brand-button-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-button disabled:bg-brand-border transition-colors">
                    {isLoading ? <><LoaderIcon className="w-6 h-6 animate-spin"/> Generating...</> : <><SparklesIcon className="w-6 h-6"/>Generate Script</>}
                </button>
            </div>
        );
      case AppStep.REFINE_SCRIPT:
            return <RefineScript 
                        dialogueLines={dialogueLines} 
                        personas={personas}
                        onRefineLine={handleRefineLine}
                        onGenerateNextLine={handleGenerateNextLine}
                        isRefiningLineId={isRefiningLineId}
                        isAddingNextLine={isAddingNextLine}
                    />;
      case AppStep.FINAL_REVIEW:
            const finalScript = dialogueLines.map(l => `${l.speakerName}: ${l.line}`).join('\n');
            return (
                 <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-3xl font-bold text-brand-text-primary flex items-center gap-3"><FileTextIcon className="w-8 h-8 text-brand-accent"/>Final Script</h2>
                         <div className="flex gap-4">
                            <button onClick={() => setStep(AppStep.REFINE_SCRIPT)} className="px-4 py-2 bg-brand-surface text-brand-text-primary rounded-md hover:bg-brand-surface/80 transition-colors">&larr; Back to Refine</button>
                            <button onClick={handleExportJson} className="px-4 py-2 bg-brand-surface border border-brand-border text-brand-text-primary rounded-md hover:bg-brand-surface/80 hover:text-brand-accent transition-colors">Export JSON</button>
                            <button onClick={() => navigator.clipboard.writeText(finalScript)} className="px-4 py-2 bg-brand-button text-white rounded-md hover:bg-brand-button-hover transition-opacity">Copy to Clipboard</button>
                            <button onClick={() => setStep(AppStep.PERSONA_CONFIG)} className="px-4 py-2 bg-brand-surface text-brand-text-primary rounded-md hover:bg-brand-surface/80 transition-colors">Start Over</button>
                        </div>
                    </div>
                    <textarea 
                        value={finalScript}
                        readOnly
                        className="w-full h-[60vh] bg-brand-surface border border-brand-border rounded-md p-4 text-brand-text-primary font-mono text-sm leading-6 focus:ring-brand-accent focus:border-brand-accent"
                    />
                </div>
            )
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
            <div className="relative flex items-center justify-center">
                 <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">SFL-Persona-Dialogue-Generator</h1>
                 <button
                    onClick={() => setIsHelpModalOpen(true)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-brand-text-secondary hover:text-brand-accent transition-colors"
                    aria-label="Open help menu"
                >
                    <QuestionMarkCircleIcon className="w-8 h-8" />
                </button>
            </div>
            <p className="mt-4 text-xl text-brand-text-secondary">Transform documents, audio, and video into authentic, multi-speaker dialogues.</p>
        </header>

        <div className="mb-12 flex justify-center">
            <StepIndicator currentStep={step} onStepClick={handleStepClick} />
        </div>
        
        {error && <div className="bg-red-600/20 border border-brand-error-border text-brand-error-text px-4 py-3 rounded-lg relative mb-6 max-w-4xl mx-auto" role="alert">{error}</div>}

        <div className={showSidebar ? "grid grid-cols-1 lg:grid-cols-3 gap-8 items-start" : ""}>
            <main className={showSidebar ? "lg:col-span-2" : "w-full"}>
                {renderContent()}
            </main>
            {showSidebar && (
                <aside className="lg:col-span-1 hidden lg:block">
                   <ResourceSidebar results={searchResults} isLoading={isSearching} error={searchError} />
                </aside>
            )}
        </div>

        <footer className="mt-12 text-center">
            <div className="flex items-center justify-center gap-4">
                 {step > AppStep.PERSONA_CONFIG && step < AppStep.FINAL_REVIEW && (
                    <button
                        onClick={handlePrevStep}
                        className="px-8 py-3 border border-brand-border text-base font-medium rounded-md shadow-sm text-brand-text-primary bg-brand-surface hover:bg-brand-surface/80 transition-colors"
                    >
                        &larr; Back
                    </button>
                 )}
                {step < AppStep.GENERATE_DIALOGUE && (
                    <button
                    onClick={handleNextStep}
                    disabled={!isNextEnabled}
                    className="px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-button hover:bg-brand-button-hover disabled:bg-brand-border disabled:text-brand-text-secondary disabled:cursor-not-allowed transition-colors"
                    >
                    {step === AppStep.PERSONA_CONFIG ? 'Next: Show Structure' : 'Proceed to Generation'} &rarr;
                    </button>
                )}
                {step === AppStep.REFINE_SCRIPT && (
                    <button
                    onClick={() => setStep(AppStep.FINAL_REVIEW)}
                    disabled={!isNextEnabled || isRefiningLineId !== null || isAddingNextLine}
                    className="px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-button hover:bg-brand-button-hover disabled:bg-brand-border disabled:text-brand-text-secondary disabled:cursor-not-allowed transition-colors"
                    >
                    Finalize Script &rarr;
                    </button>
                )}
            </div>
        </footer>

      </div>
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </div>
  );
};

export default App;