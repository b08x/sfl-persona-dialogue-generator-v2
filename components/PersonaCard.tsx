import React, { useCallback } from 'react';
import { Persona, ProcessDistribution } from '../types';
import { UserIcon, UploadIcon, TrashIcon, LoaderIcon, SparklesIcon } from './icons';
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
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const newDocuments: { name: string, content: string }[] = [];
      let filesToProcess = files.length;

      // Fix: Explicitly type 'file' as File to resolve type inference issues.
      files.forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target && typeof e.target.result === 'string') {
            newDocuments.push({ name: file.name, content: e.target.result });
          }
          filesToProcess--;
          if (filesToProcess === 0) {
            onUpdate(persona.id, { sourceDocuments: [...persona.sourceDocuments, ...newDocuments] });
          }
        };
        reader.onerror = () => {
          filesToProcess--;
           if (filesToProcess === 0) {
            onUpdate(persona.id, { sourceDocuments: [...persona.sourceDocuments, ...newDocuments] });
          }
        };
        reader.readAsText(file);
      });
    }
  }, [persona.id, persona.sourceDocuments, onUpdate]);

  const removeDocument = (docName: string) => {
    const updatedDocs = persona.sourceDocuments.filter(doc => doc.name !== docName);
    onUpdate(persona.id, { sourceDocuments: updatedDocs });
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
          <label className="block text-sm font-medium text-brand-text-secondary mb-2">Source Documents</label>
          <div className="space-y-2 mb-4">
             {persona.sourceDocuments.map(doc => (
                 <div key={doc.name} className="flex items-center justify-between bg-brand-bg p-2 rounded-md text-sm">
                     <span className="text-brand-text-primary truncate">{doc.name}</span>
                     <button onClick={() => removeDocument(doc.name)} className="text-brand-text-secondary hover:text-red-500 ml-2">
                         <TrashIcon className="w-4 h-4" />
                     </button>
                 </div>
             ))}
          </div>
          <label htmlFor={`file-upload-${persona.id}`} className="w-full cursor-pointer flex items-center justify-center px-4 py-2 border-2 border-dashed border-brand-border rounded-md text-brand-text-secondary hover:border-brand-accent hover:text-brand-accent transition-colors">
            <UploadIcon className="w-5 h-5 mr-2" />
            <span>Upload Document(s)</span>
          </label>
          <input id={`file-upload-${persona.id}`} type="file" multiple className="hidden" onChange={handleFileChange} accept=".txt,.md,.pdf" />
        </div>

        <div className="mt-6">
          <button
            onClick={() => onAnalyze(persona.id)}
            disabled={persona.sourceDocuments.length === 0 || persona.isAnalyzing}
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