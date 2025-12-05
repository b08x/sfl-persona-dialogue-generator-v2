import { Persona, ShowStructure, ModelConfig } from './types';

export const SFL_ANALYSIS_SYSTEM_INSTRUCTION = `You are an expert linguistics analyst specializing in Systemic Functional Linguistics (SFL). Your task is to analyze the provided sources (which may include text, audio, video, or images) and provide a detailed linguistic profile in a specific JSON format. When analyzing audio or video, pay close attention to the speaker's tone, pacing, hesitation, and emotional delivery to inform the 'Interpersonal Mapping'.`;

export const SFL_ANALYSIS_USER_PROMPT_TEXT_PART = `
Please analyze the provided content based on SFL principles and provide the output as a single, valid JSON object. Do not include any text or markdown formatting before or after the JSON object.

**REQUIRED JSON OUTPUT STRUCTURE:**
{
  "personaStyle": "string",
  "tone": "string",
  "explanationTendency": "string",
  "dialoguePattern": "string",
  "confidenceLevel": "string",
  "hedgingFrequency": "string",
  "statementStrength": "string",
  "informationPackaging": "string",
  "topicDevelopment": "string",
  "referenceStyle": "string",
  "processDistribution": {
    "material": number,
    "mental": number,
    "relational": number,
    "verbal": number
  },
  "technicalityLevel": number,
  "topics": ["string"]
}

**ANALYSIS GUIDELINES:**
1.  **Process Distribution**: Calculate the percentage (%) of Material, Mental, Relational, and Verbal processes. The sum should be 100.
2.  **Ideational Mapping**:
    - IF Relational Processes > 50%: SET personaStyle = "Definitional Expert", explanationTendency = "Classification-focused", dialoguePattern = "What X is/means/represents"
    - ELIF Material Processes > 40%: SET personaStyle = "Action-Oriented Practitioner", explanationTendency = "Process-focused", dialoguePattern = "How X works/happens/is done"
    - ELIF Mental Processes > 35%: SET personaStyle = "Reflective Analyst", explanationTendency = "Interpretation-focused", dialoguePattern = "What X means/implies/suggests"
    - ELIF Verbal Processes > 20%: SET personaStyle = "Research Communicator", explanationTendency = "Evidence-focused", dialoguePattern = "Studies show/experts say/research indicates"
    - ELSE: Use a best-fit description.
3.  **Tone**: Analyze the speaker's emotional and professional demeanor (e.g., "Authoritative", "Conversational", "Energetic", "Empathetic", "Formal", "Witty").
4.  **Interpersonal Mapping**: Analyze modality (e.g., certainty, obligation) and audio/visual cues if available.
    - If modality is strong/frequent or voice is firm: SET confidenceLevel = "Highly Certain", hedgingFrequency = "Low", statementStrength = "Definitive".
    - If modality is mixed: SET confidenceLevel = "Moderately Certain", hedgingFrequency = "Medium", statementStrength = "Qualified".
    - If modality is weak/questioning or voice is hesitant: SET confidenceLevel = "Cautious", hedgingFrequency = "High", statementStrength = "Tentative".
5.  **Textual Mapping**: Analyze cohesion.
    - If cohesion is high (many connectors, reference chains): SET informationPackaging = "Highly Integrated", topicDevelopment = "Cumulative Building", referenceStyle = "Complex Chains".
    - If cohesion is moderate: SET informationPackaging = "Moderately Connected", topicDevelopment = "Stepped Progression", referenceStyle = "Clear Links".
    - If cohesion is low: SET informationPackaging = "Discrete Segments", topicDevelopment = "Independent Points", referenceStyle = "Explicit Reference".
6.  **Technicality Level**: Score from 1 (conversational) to 10 (highly technical) based on lexical density and specialized terms.
7.  **Domain Knowledge & Topics**: Identify 5 key areas of domain expertise, specialized subjects, or core topics this speaker is knowledgeable about. These will be used as their primary knowledge base for dialogue generation.

Now, provide the JSON object for the content provided.
`;

export const SHOW_CONTEXT_ANALYSIS_SYSTEM_INSTRUCTION = `You are a creative show producer. Your task is to analyze the provided context materials (documents, audio, video) and outline the structure for a podcast episode.`;

export const SHOW_CONTEXT_ANALYSIS_PROMPT = `
Analyze the attached materials to determine the best structure for a podcast episode covering this content.
Output a single valid JSON object with the following structure:
{
  "title": "A catchy, relevant title for the episode",
  "intro": "A brief outline or script for the host's introduction (2-3 sentences)",
  "topics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"]
}
`;

export const DIALOGUE_GENERATION_PROMPT = (personas: Persona[], structure: ShowStructure) => `
You are a master podcast scriptwriter, an expert in generating natural, multi-speaker dialogue based on detailed Systemic Functional Linguistics (SFL) profiles.

**SHOW STRUCTURE:**
- Title: "${structure.title}"
- Primary Host: "${personas.find(p => p.id === structure.primaryHostId)?.name || 'N/A'}" (This person leads the intro and transitions)
- Generated Intro: "${structure.intro}"
- Key Topics: ${structure.topics.join(', ')}

**SHOW CONTEXT MATERIAL:**
Contextual materials (text, audio, video) have been provided for this episode. Use the information, themes, and facts from these materials as the PRIMARY grounding for the conversation content. The speakers should discuss these specific materials.

**SPEAKER PERSONAS & SFL PROFILES:**
${JSON.stringify(personas.map(p => ({
    name: p.name, 
    role: p.role, 
    speakingStyle: p.speakingStyle, 
    domainKnowledge: p.sflProfile?.topics,
    sflProfile: p.sflProfile
})), null, 2)}

**YOUR TASK:**
1.  Generate a complete, flowing dialogue script for a podcast episode.
2.  Each line MUST be prefixed with the speaker's name and a colon (e.g., "Jane Doe: ...").
3.  Each speaker's dialogue MUST strictly adhere to their SFL profile, role, and speaking style.
    -   A "Definitional Expert" (high relational) should define and classify concepts.
    -   An "Action-Oriented Practitioner" (high material) should talk about processes and implementation.
    -   A speaker with a "Highly Certain" confidence level should use definitive language.
4.  The Primary Host must guide the conversation, introduce topics, and create smooth transitions.
5.  **Domain Knowledge:** Draw heavily from each speaker's 'domainKnowledge' (topics) list. Treat these topics as their specific area of expertise which they primarily reference when discussing the show context.
6.  The script should feel authentic, with natural turn-taking.
7.  **Manage Conversational Dynamics for Realism:**
    -   **Pacing & Flow:** Match the 'Information Packaging' (Integrated vs Discrete) and 'Confidence Level' to the rhythm of speech.
    -   **Interruptions & Overlaps:** Introduce natural overlaps based on confidence levels (e.g., highly certain speakers interjecting).
8.  The output MUST be only the raw script text. Do not include any titles, headers, or other commentary.
`;

export const REFINE_LINE_PROMPT = (
  scriptHistory: string,
  lineToRefine: { speaker: string; line: string },
  instruction: string,
  personas: Persona[]
) => `
You are a master podcast scriptwriter. Your task is to refine a single line of dialogue based on user instructions, maintaining the speaker's SFL profile, role, and speaking style.

**SPEAKER PERSONAS & SFL PROFILES:**
${JSON.stringify(personas.map(p => ({
    name: p.name, 
    role: p.role, 
    speakingStyle: p.speakingStyle, 
    sflProfile: p.sflProfile
})), null, 2)}

**SCRIPT SO FAR (for context):**
${scriptHistory}

**LINE TO REFINE:**
${lineToRefine.speaker}: ${lineToRefine.line}

**USER INSTRUCTION:**
"${instruction}"

**YOUR TASK:**
Rewrite ONLY the "LINE TO REFINE" according to the instruction. The new line must strictly adhere to the speaker's SFL profile, their specified role, and their speaking style.
Output ONLY the new line of text for the speaker. Do NOT include the speaker's name, any prefix, or any other formatting.
`;

export const GENERATE_NEXT_LINE_PROMPT = (
    scriptHistory: string,
    personas: Persona[],
    lastSpeakerName: string
) => `
You are a master podcast scriptwriter. Your task is to generate the next line of dialogue in a podcast, ensuring a natural turn-taking flow.

**SPEAKER PERSONAS & SFL PROFILES:**
${JSON.stringify(personas.map(p => ({
    name: p.name, 
    role: p.role, 
    speakingStyle: p.speakingStyle, 
    sflProfile: p.sflProfile
})), null, 2)}

**SCRIPT SO FAR:**
${scriptHistory}

**YOUR TASK:**
Generate the next single line of dialogue. The previous speaker was "${lastSpeakerName}".
The new line should be for a different speaker, creating a natural conversation. The speaker's dialogue MUST strictly adhere to their SFL profile, role, and speaking style.
Output ONLY the speaker's name, a colon, and their line of dialogue (e.g., "Jane Doe: ..."). Do not include any other commentary.
`;

export const AVAILABLE_MODELS: ModelConfig[] = [
  { 
    id: 'gemini-2.5-flash', 
    name: 'Gemini 2.5 Flash', 
    hasThinking: true, 
    description: 'A fast and versatile model, adept at a wide range of tasks from analysis to creative generation. Great for audio transcription.' 
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro (Preview)',
    hasThinking: true, 
    description: 'Best-in-class reasoning and multimodal capabilities. Required for advanced video and image analysis.'
  }
];