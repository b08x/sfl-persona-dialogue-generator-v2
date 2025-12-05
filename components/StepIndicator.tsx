import React from 'react';
import { AppStep } from '../types';
import { CheckCircleIcon } from './icons';

interface StepIndicatorProps {
  currentStep: AppStep;
  onStepClick: (step: AppStep) => void;
}

const steps = [
  { id: AppStep.PERSONA_CONFIG, name: 'Personas' },
  { id: AppStep.SHOW_STRUCTURE, name: 'Structure' },
  { id: AppStep.GENERATE_DIALOGUE, name: 'Generate' },
  { id: AppStep.REFINE_SCRIPT, name: 'Refine' },
  { id: AppStep.FINAL_REVIEW, name: 'Final Script' },
];

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, onStepClick }) => {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
            {currentStep > step.id ? (
              // Completed step: make it a button
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-brand-accent" />
                </div>
                <button
                  type="button"
                  onClick={() => onStepClick(step.id)}
                  className="relative group text-center focus:outline-none"
                  aria-label={`Go to step ${step.name}`}
                >
                  <div className="flex h-8 w-8 items-center justify-center bg-brand-accent rounded-full transition-colors group-hover:bg-brand-accent-hover">
                    <CheckCircleIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className="block mt-2 text-sm font-medium text-brand-text-primary">{step.name}</span>
                </button>
              </>
            ) : currentStep === step.id ? (
              // Current step
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-brand-border" />
                </div>
                <div className="relative text-center" aria-current="step">
                  <div className="mx-auto flex h-8 w-8 items-center justify-center bg-brand-surface border-2 border-brand-accent rounded-full">
                    <span className="h-2.5 w-2.5 bg-brand-accent rounded-full" />
                  </div>
                 <span className="block mt-2 text-sm font-medium text-brand-accent">{step.name}</span>
                </div>
              </>
            ) : (
              // Future step
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-brand-border" />
                </div>
                <div className="relative text-center">
                  <div className="mx-auto flex h-8 w-8 items-center justify-center bg-brand-surface border-2 border-brand-border rounded-full" />
                  <span className="block mt-2 text-sm font-medium text-brand-text-secondary">{step.name}</span>
                </div>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default StepIndicator;
