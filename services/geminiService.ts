import { GoogleGenAI, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { SFL_ANALYSIS_SYSTEM_INSTRUCTION, SFL_ANALYSIS_USER_PROMPT_TEXT_PART, DIALOGUE_GENERATION_PROMPT, REFINE_LINE_PROMPT, GENERATE_NEXT_LINE_PROMPT, SHOW_CONTEXT_ANALYSIS_SYSTEM_INSTRUCTION, SHOW_CONTEXT_ANALYSIS_PROMPT } from '../constants';
import { Persona, SFLAnalysisResult, ShowStructure, SourceContent, ShowContextAnalysisResult } from '../types';

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
  sources: SourceContent[],
  model: string,
  thinkingBudget?: number
): Promise<SFLAnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  // Determine the best model for analysis based on source types, if strict adherence is required
  let analysisModel = model;
  const hasVideo = sources.some(s => s.type === 'video');
  const hasImage = sources.some(s => s.type === 'image');
  const hasAudio = sources.some(s => s.type === 'audio');
  const hasOnlyAudio = hasAudio && !hasVideo && !hasImage;

  if (hasVideo || hasImage) {
    analysisModel = 'gemini-3-pro-preview';
  } else if (hasOnlyAudio && model === 'gemini-2.5-flash') {
      // Keep user choice if 2.5 flash is selected for audio, as it's optimized for it
      analysisModel = 'gemini-2.5-flash';
  }
  
  // If user selected 2.5 flash but uploaded video/images, we override because 3-pro is requested for those
  if ((hasVideo || hasImage) && model !== 'gemini-3-pro-preview') {
      console.log('Switching to gemini-3-pro-preview for advanced multimodal analysis');
      analysisModel = 'gemini-3-pro-preview';
  }

  try {
    const config: any = {
        systemInstruction: SFL_ANALYSIS_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.2, // Keep analysis strict
        safetySettings,
    };

    if (thinkingBudget !== undefined && analysisModel !== 'gemini-2.5-flash') {
        // Thinking budget is generally safer on Pro models or when explicitly supported. 
        // 2.5 Flash supports it, but let's be careful with overrides.
        config.thinkingConfig = { thinkingBudget };
    }

    const parts: any[] = [];
    
    // Add instruction part
    parts.push({ text: SFL_ANALYSIS_USER_PROMPT_TEXT_PART });

    // Add content parts
    for (const source of sources) {
        if (source.type === 'text' || source.type === 'youtube') {
             // For YouTube, we just pass the link as text for now, assuming the model might have internal knowledge or treat it as metadata
             // If we had a transcript, we would pass that.
             parts.push({ text: `\nSource (${source.name}):\n${source.data}\n` });
        } else {
            // Audio, Video, Image
            parts.push({
                inlineData: {
                    mimeType: source.mimeType,
                    data: source.data
                }
            });
        }
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: analysisModel,
      contents: { parts },
      config: config,
    });
    
    const text = getApiResponseText(response, 'analysis');
    const jsonStr = cleanJsonString(text);
    const parsedData: SFLAnalysisResult = JSON.parse(jsonStr);
    return parsedData;

  } catch (error) {
    console.error("Error analyzing sources with Gemini:", error);
    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse the analysis from the AI. The model returned malformed JSON.");
    }
    throw new Error("Failed to analyze sources. Ensure your API key is valid and the file sizes are within limits.");
  }
};

export const analyzeShowContext = async (
    sources: SourceContent[],
    model: string,
    thinkingBudget?: number
): Promise<ShowContextAnalysisResult> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    let analysisModel = model;
    const hasMultimedia = sources.some(s => ['video', 'image'].includes(s.type));
    if (hasMultimedia) {
        analysisModel = 'gemini-3-pro-preview';
    }

    try {
        const config: any = {
            systemInstruction: SHOW_CONTEXT_ANALYSIS_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            temperature: 0.7,
            safetySettings,
        };

        if (thinkingBudget !== undefined && analysisModel !== 'gemini-2.5-flash') {
            config.thinkingConfig = { thinkingBudget };
        }

        const parts: any[] = [];
        parts.push({ text: SHOW_CONTEXT_ANALYSIS_PROMPT });

        for (const source of sources) {
            if (source.type === 'text' || source.type === 'youtube') {
                parts.push({ text: `\nShow Context Source (${source.name}):\n${source.data}\n` });
            } else {
                parts.push({
                    inlineData: {
                        mimeType: source.mimeType,
                        data: source.data
                    }
                });
            }
        }

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: analysisModel,
            contents: { parts },
            config: config,
        });

        const text = getApiResponseText(response, 'show context analysis');
        const jsonStr = cleanJsonString(text);
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error analyzing show context:", error);
        throw new Error("Failed to analyze show context materials.");
    }
}

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

    const promptText = DIALOGUE_GENERATION_PROMPT(personas, structure);
    
    // Check if we need to upgrade model due to context sources
    let generationModel = model;
    const hasMultimediaContext = structure.contextSources.some(s => ['video', 'image'].includes(s.type));
    if (hasMultimediaContext && generationModel !== 'gemini-3-pro-preview') {
        console.log('Switching to gemini-3-pro-preview for multimodal dialogue generation context');
        generationModel = 'gemini-3-pro-preview';
    }

    try {
        const config: any = {
            temperature: temperature,
            safetySettings,
        };

        if (thinkingBudget !== undefined && generationModel !== 'gemini-2.5-flash') {
            config.thinkingConfig = { thinkingBudget };
        }

        const parts: any[] = [];
        parts.push({ text: promptText });

        // Add show context sources as parts to the dialogue generation request
        if (structure.contextSources.length > 0) {
            for (const source of structure.contextSources) {
                if (source.type === 'text' || source.type === 'youtube') {
                    parts.push({ text: `\nContext Material (${source.name}):\n${source.data}\n` });
                } else {
                    parts.push({
                        inlineData: {
                            mimeType: source.mimeType,
                            data: source.data
                        }
                    });
                }
            }
        }

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: generationModel,
            contents: { parts },
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