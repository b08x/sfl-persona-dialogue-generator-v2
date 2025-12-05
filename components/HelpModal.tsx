import React, { useState } from 'react';
import { UserIcon, FileTextIcon, SparklesIcon, LightbulbIcon } from './icons';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'Overview' | 'Personas' | 'Structure' | 'Generation' | 'Output';

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  if (!isOpen) return null;

  const renderContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <div>
            <h3 className="text-2xl font-bold text-brand-accent mb-4">What is the SFL-Persona-Dialogue-Generator?</h3>
            <p className="text-brand-text-secondary mb-4">
              This tool is a sophisticated content creation assistant that bridges the gap between source material and authentic, character-driven dialogue. It uses principles from <strong>Systemic Functional Linguistics (SFL)</strong> to analyze text, build a linguistic "fingerprint" of a speaker, and then uses that profile to generate dialogue that sounds just like them.
            </p>
            <p className="text-brand-text-secondary">
              The core idea is that <strong>how</strong> someone talks is as important as <strong>what</strong> they talk about. By analyzing linguistic patterns—like the types of verbs they use, their sentence structure, and their level of certainty—we can create AI-powered personas that maintain a consistent and believable voice.
            </p>
            <div className="mt-6 p-4 bg-brand-bg rounded-lg border border-brand-border">
              <h4 className="font-semibold text-brand-text-primary mb-2 flex items-center gap-2"><LightbulbIcon className="w-5 h-5 text-brand-accent" />The Workflow</h4>
              <ol className="list-decimal list-inside text-brand-text-secondary space-y-2">
                <li><strong>Configure Personas:</strong> Upload documents for each speaker you want to create.</li>
                <li><strong>Analyze Profiles:</strong> The AI performs an SFL analysis to build a linguistic profile for each persona.</li>
                <li><strong>Define Show Structure:</strong> Set the title, host, and topics for your podcast episode.</li>
                <li><strong>Generate Dialogue:</strong> The AI writes a full script, with each persona speaking "in character."</li>
                <li><strong>Refine & Finalize:</strong> Edit the script line-by-line or generate more content, then export your final dialogue.</li>
              </ol>
            </div>
          </div>
        );
      case 'Personas':
        return (
          <div>
            <h3 className="text-2xl font-bold text-brand-accent mb-4">Step 1: Persona Configuration</h3>
            <p className="text-brand-text-secondary mb-6">This is the foundation of the entire process. The quality of your personas depends directly on the quality of the source documents you provide.</p>
            
            <h4 className="font-semibold text-brand-text-primary mb-2">Source Documents</h4>
            <p className="text-brand-text-secondary mb-4">Upload text files (.txt, .md) that are representative of how a specific person speaks or writes. This could be interview transcripts, articles they've written, or even emails. The more text you provide, the more accurate the SFL profile will be.</p>
            
            <h4 className="font-semibold text-brand-text-primary mb-2">The SFL Analysis Engine</h4>
            <p className="text-brand-text-secondary mb-4">When you click "Analyze," the content of the source documents is sent to the Gemini model with a highly specific set of instructions based on Systemic Functional Linguistics. The model doesn't just read the text; it deconstructs it. Here's what it looks for:</p>

            <ul className="space-y-4">
                <li className="p-3 bg-brand-bg rounded-md">
                    <strong className="text-brand-text-primary">Process Distribution:</strong> This is the core of the analysis. It categorizes the main verbs (processes) to understand the speaker's focus.
                    <ul className="list-disc list-inside mt-2 text-sm text-brand-text-secondary ml-4">
                        <li><strong>Material:</strong> Verbs of doing ('build', 'run', 'create'). High score = 'Action-Oriented Practitioner'.</li>
                        <li><strong>Mental:</strong> Verbs of thinking/feeling ('believe', 'know', 'feel'). High score = 'Reflective Analyst'.</li>
                        <li><strong>Relational:</strong> Verbs of being/having ('is', 'are', 'has', 'means'). High score = 'Definitional Expert'.</li>
                        <li><strong>Verbal:</strong> Verbs of saying ('say', 'claim', 'report'). High score = 'Research Communicator'.</li>
                    </ul>
                </li>
                <li className="p-3 bg-brand-bg rounded-md">
                    <strong className="text-brand-text-primary">Interpersonal Style:</strong> How does the speaker relate to others and their own statements? The AI analyzes modality (words like 'might', 'must', 'definitely') to determine <strong className="text-brand-text-primary/90">Confidence Level</strong>, <strong className="text-brand-text-primary/90">Hedging Frequency</strong>, and <strong className="text-brand-text-primary/90">Statement Strength</strong>.</li>
                <li className="p-3 bg-brand-bg rounded-md">
                    <strong className="text-brand-text-primary">Textual Organization:</strong> How is information structured? The AI looks at cohesive ties (like 'therefore', 'however', 'in addition') to determine <strong className="text-brand-text-primary/90">Information Packaging</strong> and <strong className="text-brand-text-primary/90">Topic Development</strong> style.</li>
                <li className="p-3 bg-brand-bg rounded-md">
                    <strong className="text-brand-text-primary">Technicality Level:</strong> A score from 1-10 based on lexical density and the use of specialized jargon.</li>
            </ul>

            <h4 className="font-semibold text-brand-text-primary mt-6 mb-2">Model Settings: Thinking Budget</h4>
            <p className="text-brand-text-secondary">This setting gives the AI extra capacity to pre-process the text before creating the final SFL profile. A higher budget can lead to a more nuanced analysis of complex documents but increases processing time. A budget of 0 disables this, resulting in a faster but potentially more superficial analysis.</p>
          </div>
        );
      case 'Structure':
        return (
          <div>
            <h3 className="text-2xl font-bold text-brand-accent mb-4">Step 2: Show Structure</h3>
            <p className="text-brand-text-secondary mb-4">
              After defining your speakers, this step lets you outline the "container" for their conversation. This provides the AI with the necessary context and constraints to generate a coherent episode.
            </p>
            <ul className="space-y-4 text-brand-text-secondary">
              <li className="p-3 bg-brand-bg rounded-md"><strong className="text-brand-text-primary">Episode Title:</strong> Sets the overall theme for the generated dialogue.</li>
              <li className="p-3 bg-brand-bg rounded-md"><strong className="text-brand-text-primary">Primary Host:</strong> This is a crucial role. The selected persona will be responsible for introducing the show, transitioning between topics, and generally guiding the conversation. Their SFL profile will still influence how they host.</li>
              <li className="p-3 bg-brand-bg rounded-md"><strong className="text-brand-text-primary">Intro Outline:</strong> Your notes here are given to the AI to flesh out the host's introduction. You can provide bullet points or a rough sentence.</li>
              <li className="p-3 bg-brand-bg rounded-md"><strong className="text-brand-text-primary">Topics:</strong> These are the key talking points for the episode. They are automatically seeded from the topics discovered during persona analysis but can be edited. The AI will ensure these topics are covered during the dialogue, with the host often initiating the transitions.</li>
            </ul>
          </div>
        );
      case 'Generation':
        return (
          <div>
            <h3 className="text-2xl font-bold text-brand-accent mb-4">Steps 3 & 4: Generation & Refinement</h3>
            <p className="text-brand-text-secondary mb-6">
              This is where the magic happens. The application synthesizes all your configuration into a powerful prompt for the AI, which then acts as a scriptwriter.
            </p>
            
            <h4 className="font-semibold text-brand-text-primary mb-2">The Generation Process</h4>
            <p className="text-brand-text-secondary mb-4">
              A comprehensive prompt is constructed, containing:
            </p>
            <ul className="list-disc list-inside space-y-2 text-brand-text-secondary mb-4 ml-4">
              <li>The detailed SFL profiles for every persona.</li>
              <li>The show structure (title, host, topics).</li>
              <li>A core instruction to generate a natural, flowing dialogue where each speaker strictly adheres to their linguistic profile.</li>
            </ul>
            <p className="text-brand-text-secondary mb-4">
              The AI then generates the entire script in one go, simulating turn-taking and conversational flow based on the roles and profiles provided.
            </p>

            <h4 className="font-semibold text-brand-text-primary mb-2">Refining the Script</h4>
            <p className="text-brand-text-secondary mb-4">No AI is perfect. The refinement stage gives you granular control over the output.</p>
            <ul className="space-y-3 text-brand-text-secondary">
              <li><strong>Refine Line:</strong> When you provide an instruction (e.g., "make this more concise" or "add a technical example"), the AI is given the script context, the original line, and your instruction. Its goal is to rewrite that single line while still honoring the speaker's SFL profile.</li>
              <li><strong>Generate Next Line:</strong> This feature sends the entire script so far to the AI and asks, "What comes next?" The AI chooses the most logical next speaker and generates a single new line for them, again, in character.</li>
            </ul>
             <h4 className="font-semibold text-brand-text-primary mt-6 mb-2">Contextual Resources</h4>
            <p className="text-brand-text-secondary">The sidebar uses the Google Search API to find relevant articles and videos based on your show's topics. This provides a quick way to fact-check the AI's output or find inspiration for refinement prompts.</p>
          </div>
        );
      case 'Output':
        return (
          <div>
            <h3 className="text-2xl font-bold text-brand-accent mb-4">Step 5: Using the Final Script</h3>
            <p className="text-brand-text-secondary mb-6">
              Once you're happy with your dialogue, the Final Review screen provides a clean, copy-paste-ready version of the entire script. Here are some ways you can integrate this output into your workflow:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-brand-bg rounded-lg">
                    <h4 className="font-semibold text-brand-text-primary mb-2">Direct-to-Audio Production</h4>
                    <p className="text-sm text-brand-text-secondary">Provide the script to human voice actors or podcast hosts for a table read. The natural language and clear turn-taking make it easy to perform.</p>
                </div>
                <div className="p-4 bg-brand-bg rounded-lg">
                    <h4 className="font-semibold text-brand-text-primary mb-2">AI Voice Generation</h4>
                    <p className="text-sm text-brand-text-secondary">Use the script with advanced Text-to-Speech (TTS) services to create a fully AI-generated audio version of the podcast.</p>
                </div>
                <div className="p-4 bg-brand-bg rounded-lg">
                    <h4 className="font-semibold text-brand-text-primary mb-2">Content Repurposing</h4>
                    <p className="text-sm text-brand-text-secondary">The dialogue can serve as the basis for a blog post, a Q&A article, a series of social media posts, or a video script.</p>
                </div>
                 <div className="p-4 bg-brand-bg rounded-lg">
                    <h4 className="font-semibold text-brand-text-primary mb-2">Guided Improvisation</h4>
                    <p className="text-sm text-brand-text-secondary">Use the script not as a word-for-word mandate, but as a detailed blueprint for a more improvised discussion. The key points, transitions, and character styles are already mapped out.</p>
                </div>
            </div>
          </div>
        );
    }
  };

  const tabs: { name: Tab; icon: React.ReactNode }[] = [
    { name: 'Overview', icon: <LightbulbIcon className="w-5 h-5 mr-2" /> },
    { name: 'Personas', icon: <UserIcon className="w-5 h-5 mr-2" /> },
    { name: 'Structure', icon: <FileTextIcon className="w-5 h-5 mr-2" /> },
    { name: 'Generation', icon: <SparklesIcon className="w-5 h-5 mr-2" /> },
    { name: 'Output', icon: <FileTextIcon className="w-5 h-5 mr-2" /> },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity" onClick={onClose}>
      <div className="bg-brand-surface w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col border border-brand-border overflow-hidden" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-brand-border flex-shrink-0">
          <h2 className="text-xl font-bold text-brand-text-primary">Help & Documentation</h2>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-white">&times;</button>
        </header>
        <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
          <nav className="w-full md:w-1/4 p-4 border-b md:border-b-0 md:border-r border-brand-border flex-shrink-0 overflow-y-auto">
            <ul className="space-y-1">
              {tabs.map(tab => (
                <li key={tab.name}>
                  <button
                    onClick={() => setActiveTab(tab.name)}
                    className={`w-full flex items-center text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.name
                        ? 'bg-brand-accent/20 text-brand-accent'
                        : 'text-brand-text-secondary hover:bg-brand-bg hover:text-brand-text-primary'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <main className="p-6 flex-grow overflow-y-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;