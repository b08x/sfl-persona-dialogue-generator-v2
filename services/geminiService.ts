

import { GoogleGenAI, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { SFL_ANALYSIS_SYSTEM_INSTRUCTION, SFL_ANALYSIS_USER_PROMPT, DIALOGUE_GENERATION_PROMPT, REFINE_LINE_PROMPT, GENERATE_NEXT_LINE_PROMPT } from '../constants';
import { Persona, SFLAnalysisResult, ShowStructure } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
];


const cleanJsonString = (rawText: string): string => {
  let cleanedText = rawText.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = cleanedText.match(fenceRegex);
  if (match && match[2]) {
    cleanedText = match[2].trim();
  }
  return cleanedText;
};

const getApiResponseText = (response: GenerateContentResponse, errorContext: string): string => {
    const text = response.text;
    if (!text) {
        console.error(`Gemini ${errorContext} response was empty or blocked.`, response);
        throw new Error(`Failed to get a valid response from the AI for ${errorContext}. The response was empty, which could be due to content safety filters.`);
    }
    return text;
};

export const analyzeDocument = async (
  documentText: string,
  model: string,
  thinkingBudget?: number
): Promise<SFLAnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const MAX_INPUT_CHARS = 850000;
  let textToAnalyze = documentText;
  if (documentText.length > MAX_INPUT_CHARS) {
    console.warn(`Input text for analysis is too long (${documentText.length} chars). Truncating to ${MAX_INPUT_CHARS} characters to prevent token limit errors.`);
    textToAnalyze = documentText.substring(0, MAX_INPUT_CHARS);
  }

  try {
    const config: any = {
        systemInstruction: SFL_ANALYSIS_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.2, // Keep analysis strict
        safetySettings,
    };

    if (thinkingBudget !== undefined) {
        config.thinkingConfig = { thinkingBudget };
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: SFL_ANALYSIS_USER_PROMPT(textToAnalyze),
      config: config,
    });
    
    const text = getApiResponseText(response, 'analysis');
    const jsonStr = cleanJsonString(text);
    const parsedData: SFLAnalysisResult = JSON.parse(jsonStr);
    return parsedData;

  } catch (error) {
    console.error("Error analyzing document with Gemini:", error);
    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse the analysis from the AI. The model returned malformed JSON.");
    }
    throw new Error("Failed to analyze document. The model may have returned an invalid format or an error occurred.");
  }
};


export const generateDialogue = async (
    personas: Persona[], 
    structure: ShowStructure,
    model: string,
    thinkingBudget?: number,
    temperature: number = 0.7
): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    const prompt = DIALOGUE_GENERATION_PROMPT(personas, structure);
    
    try {
        const config: any = {
            temperature: temperature,
            safetySettings,
        };

        if (thinkingBudget !== undefined) {
            config.thinkingConfig = { thinkingBudget };
        }

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: config
        });
        return getApiResponseText(response, 'dialogue generation');
    } catch (error) {
        console.error("Error generating dialogue with Gemini:", error);
        throw new Error("Failed to generate dialogue.");
    }
};

export const refineDialogueLine = async (
    history: string, 
    lineToRefine: {speaker: string; line: string}, 
    instruction: string, 
    personas: Persona[],
    model: string,
    thinkingBudget?: number,
    temperature: number = 0.7
): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    const prompt = REFINE_LINE_PROMPT(history, lineToRefine, instruction, personas);
    
    try {
        const config: any = {
            temperature: temperature,
            safetySettings,
        };
        
        if (thinkingBudget !== undefined) {
            config.thinkingConfig = { thinkingBudget };
        }

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: config
        });
        return getApiResponseText(response, 'line refinement');
    } catch (error) {
        console.error("Error refining line with Gemini:", error);
        throw new Error("Failed to refine dialogue line.");
    }
};

export const generateNextDialogueLine = async (
    history: string, 
    personas: Persona[], 
    lastSpeakerName: string,
    model: string,
    thinkingBudget?: number,
    temperature: number = 0.75
): Promise<string> => {
     if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    const prompt = GENERATE_NEXT_LINE_PROMPT(history, personas, lastSpeakerName);

    try {
        const config: any = {
            temperature: temperature,
            safetySettings,
        };

        if (thinkingBudget !== undefined) {
            config.thinkingConfig = { thinkingBudget };
        }

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: config
        });
        return getApiResponseText(response, 'next line generation');
    } catch (error) {
        console.error("Error generating next line with Gemini:", error);
        throw new Error("Failed to generate next dialogue line.");
    }
};