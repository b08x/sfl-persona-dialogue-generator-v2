import React, { useCallback, useState } from 'react';
import { Persona, ProcessDistribution, SourceContent, SourceType } from '../types';
import { UserIcon, UploadIcon, TrashIcon, LoaderIcon, SparklesIcon, VideoCameraIcon, MicrophoneIcon, PhotoIcon, FileTextIcon } from './icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PersonaCardProps {
  persona: Persona;
  onUpdate: (id: string, updates: Partial<Persona>) => void;
  onDelete: (id: string) => void;
  onAnalyze: (id: string) => void;
}

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

const ProcessDistributionChart: React.FC<{ data: ProcessDistribution }> = ({ data }) => {
    const chartData = [
        { name: 'Material', value: data.material },
        { name: 'Mental', value: data.mental },
        { name: 'Relational', value: data.relational },
        { name: 'Verbal', value: data.verbal },
    ];

    return (
        <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={70} tick={{ fill: '#95aac0' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} contentStyle={{ backgroundColor: '#333e48', border: '1px solid #5c6f7e' }} />
                    <Bar dataKey="value" barSize={20} radius={[0, 10, 10, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};


const PersonaCard: React.FC<PersonaCardProps> = ({ persona, onUpdate, onDelete, onAnalyze }) => {
  const [youtubeLink, setYoutubeLink] = useState('');

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>, type: SourceType) => {
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
                id: `source-${Date.now()}-${Math.random()}`,
                name: file.name,
                type: type,
                mimeType: file.type || 'text/plain',
                data: data
            });
          }
          filesToProcess--;
          if (filesToProcess === 0) {
            onUpdate(persona.id, { sources: [...persona.sources, ...newSources] });
          }
        };
        reader.onerror = () => {
          filesToProcess--;
           if (filesToProcess === 0) {
            onUpdate(persona.id, { sources: [...persona.sources, ...newSources] });
          }
        };
        
        if (type === 'text') {
            reader.readAsText(file);
        } else {
            reader.readAsDataURL(file);
        }
      });
    }
  }, [persona.id, persona.sources, onUpdate]);

  const addYoutubeLink = () => {
      if (!youtubeLink.trim()) return;
      const newSource: SourceContent = {
          id: `source-${Date.now()}`,
          name: 'YouTube Link',
          type: 'youtube',
          mimeType: 'text/plain',
          data: youtubeLink
      };
      onUpdate(persona.id, { sources: [...persona.sources, newSource] });
      setYoutubeLink('');
  };

  const removeSource = (sourceId: string) => {
    const updatedSources = persona.sources.filter(s => s.id !== sourceId);
    onUpdate(persona.id, { sources: updatedSources });
  };

  const getIconForType = (type: SourceType) => {
      switch(type) {
          case 'audio': return <MicrophoneIcon className="w-4 h-4" />;
          case 'video': return <VideoCameraIcon className="w-4 h-4" />;
          case 'image': return <PhotoIcon className="w-4 h-4" />;
          case 'youtube': return <div className="w-4 h-4 font-bold text-xs flex items-center justify-center">YT</div>;
          default: return <FileTextIcon className="w-4 h-4" />;
      }
  };

  return (
    <div className="bg-brand-surface rounded-xl shadow-lg overflow-hidden transition-all duration-300 ease-in-out border border-brand-border hover:border-brand-accent flex flex-col">
      <div className="p-6 flex-grow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-accent/20 rounded-full">
              <UserIcon className="w-6 h-6 text-brand-accent" />
            </div>
            <input
              type="text"
              value={persona.name}
              onChange={(e) => onUpdate(persona.id, { name: e.target.value })}
              placeholder="Persona Name"
              className="text-xl font-bold text-brand-text-primary bg-transparent focus:outline-none w-full"
            />
          </div>
          <button onClick={() => onDelete(persona.id)} className="text-brand-text-secondary hover:text-red-500 transition-colors">
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor={`role-${persona.id}`} className="block text-sm font-medium text-brand-text-secondary mb-1">
              Role
            </label>
            <input
              type="text"
              id={`role-${persona.id}`}
              value={persona.role}
              onChange={(e) => onUpdate(persona.id, { role: e.target.value })}
              placeholder="e.g., Lead Engineer, Product Manager"
              className="block w-full bg-brand-bg border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-text-primary focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor={`style-${persona.id}`} className="block text-sm font-medium text-brand-text-secondary mb-1">
              Speaking Style (Tone)
            </label>
            <input
              type="text"
              id={`style-${persona.id}`}
              value={persona.speakingStyle}
              onChange={(e) => onUpdate(persona.id, { speakingStyle: e.target.value })}
              placeholder="e.g., Energetic, Calm, Authoritative"
              className="block w-full bg-brand-bg border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-text-primary focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-brand-text-secondary mb-2">Sources (Text, Audio, Video, Image)</label>
          <div className="space-y-2 mb-4">
             {persona.sources.map(source => (
                 <div key={source.id} className="flex items-center justify-between bg-brand-bg p-2 rounded-md text-sm">
                     <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-brand-text-secondary">{getIconForType(source.type)}</span>
                        <span className="text-brand-text-primary truncate">{source.name || source.data.substring(0, 30)}</span>
                     </div>
                     <button onClick={() => removeSource(source.id)} className="text-brand-text-secondary hover:text-red-500 ml-2">
                         <TrashIcon className="w-4 h-4" />
                     </button>
                 </div>
             ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
               <label className="cursor-pointer flex items-center justify-center px-3 py-2 border border-brand-border rounded-md text-brand-text-secondary hover:border-brand-accent hover:text-brand-accent transition-colors bg-brand-bg/50">
                    <FileTextIcon className="w-4 h-4 mr-2" />
                    <span className="text-xs">Text/PDF</span>
                    <input type="file" multiple className="hidden" onChange={(e) => handleFileChange(e, 'text')} accept=".txt,.md,.pdf,.csv" />
                </label>
                <label className="cursor-pointer flex items-center justify-center px-3 py-2 border border-brand-border rounded-md text-brand-text-secondary hover:border-brand-accent hover:text-brand-accent transition-colors bg-brand-bg/50">
                    <MicrophoneIcon className="w-4 h-4 mr-2" />
                    <span className="text-xs">Audio</span>
                    <input type="file" multiple className="hidden" onChange={(e) => handleFileChange(e, 'audio')} accept="audio/*" />
                </label>
                <label className="cursor-pointer flex items-center justify-center px-3 py-2 border border-brand-border rounded-md text-brand-text-secondary hover:border-brand-accent hover:text-brand-accent transition-colors bg-brand-bg/50">
                    <VideoCameraIcon className="w-4 h-4 mr-2" />
                    <span className="text-xs">Video</span>
                    <input type="file" multiple className="hidden" onChange={(e) => handleFileChange(e, 'video')} accept="video/*" />
                </label>
                 <label className="cursor-pointer flex items-center justify-center px-3 py-2 border border-brand-border rounded-md text-brand-text-secondary hover:border-brand-accent hover:text-brand-accent transition-colors bg-brand-bg/50">
                    <PhotoIcon className="w-4 h-4 mr-2" />
                    <span className="text-xs">Image</span>
                    <input type="file" multiple className="hidden" onChange={(e) => handleFileChange(e, 'image')} accept="image/*" />
                </label>
          </div>
          
          <div className="flex gap-2">
              <input 
                type="text" 
                value={youtubeLink}
                onChange={(e) => setYoutubeLink(e.target.value)}
                placeholder="YouTube URL..."
                className="flex-grow bg-brand-bg border-brand-border rounded-md px-3 py-1 text-sm focus:outline-none focus:border-brand-accent"
              />
              <button onClick={addYoutubeLink} className="text-xs bg-brand-surface border border-brand-border px-3 py-1 rounded-md hover:bg-brand-accent hover:text-white transition-colors">Add</button>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => onAnalyze(persona.id)}
            disabled={persona.sources.length === 0 || persona.isAnalyzing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-button hover:bg-brand-button-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-button disabled:bg-brand-border disabled:cursor-not-allowed transition-colors"
          >
            {persona.isAnalyzing ? <><LoaderIcon className="w-5 h-5 animate-spin" /> Analyzing...</> : <><SparklesIcon className="w-5 h-5"/>Analyze & Build Profile</>}
          </button>
        </div>
      </div>
      
      {persona.sflProfile && (
        <div className="bg-brand-surface/50 p-6 border-t border-brand-border">
          <h3 className="text-lg font-semibold text-brand-accent mb-4">SFL Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-brand-text-primary mb-2">Process Distribution</h4>
              <ProcessDistributionChart data={persona.sflProfile.processDistribution} />
            </div>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-brand-text-secondary">Style:</span> <span className="text-brand-text-primary font-semibold">{persona.sflProfile.personaStyle}</span></div>
                <div className="flex justify-between"><span className="text-brand-text-secondary">Tone:</span> <span className="text-brand-text-primary font-semibold">{persona.sflProfile.tone}</span></div>
                <div className="flex justify-between"><span className="text-brand-text-secondary">Confidence:</span> <span className="text-brand-text-primary font-semibold">{persona.sflProfile.confidenceLevel}</span></div>
                <div className="flex justify-between"><span className="text-brand-text-secondary">Packaging:</span> <span className="text-brand-text-primary font-semibold">{persona.sflProfile.informationPackaging}</span></div>
                <div className="flex justify-between"><span className="text-brand-text-secondary">Reference:</span> <span className="text-brand-text-primary font-semibold">{persona.sflProfile.referenceStyle}</span></div>
                <div className="flex justify-between items-center">
                    <span className="text-brand-text-secondary">Technicality:</span> 
                    <div className="w-1/2 bg-brand-border rounded-full h-2.5">
                        <div className="bg-brand-accent h-2.5 rounded-full" style={{width: `${persona.sflProfile.technicalityLevel*10}%`}}></div>
                    </div>
                </div>
            </div>
          </div>
           {persona.sflProfile.topics?.length > 0 && (
              <div className="mt-4">
                  <h4 className="text-md font-medium text-brand-text-primary mb-2">Key Topics</h4>
                  <div className="flex flex-wrap gap-2">
                      {persona.sflProfile.topics.map((topic, index) => (
                          <span key={index} className="px-2.5 py-1 text-xs font-medium text-brand-accent bg-brand-accent/20 rounded-full">{topic}</span>
                      ))}
                  </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default PersonaCard;