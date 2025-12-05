

import { Persona, ShowStructure, ModelConfig } from './types';

export const SFL_ANALYSIS_SYSTEM_INSTRUCTION = `You are an expert linguistics analyst specializing in Systemic Functional Linguistics (SFL). Your task is to analyze a given text and provide a detailed linguistic profile in a specific JSON format.`;

export const SFL_ANALYSIS_USER_PROMPT = (documentText: string) => `
Please analyze the following document based on SFL principles and provide the output as a single, valid JSON object. Do not include any text or markdown formatting before or after the JSON object.

**DOCUMENT FOR ANALYSIS:**
---
${documentText}
---

**REQUIRED JSON OUTPUT STRUCTURE:**
{
  "personaStyle": "string",
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
1.  **Process Distribution**: Calculate the percentage (%) of Material, Mental, Relational, and Verbal processes in the text. The sum should be 100.
2.  **Ideational Mapping**:
    - IF Relational Processes > 50%: SET personaStyle = "Definitional Expert", explanationTendency = "Classification-focused", dialoguePattern = "What X is/means/represents"
    - ELIF Material Processes > 40%: SET personaStyle = "Action-Oriented Practitioner", explanationTendency = "Process-focused", dialoguePattern = "How X works/happens/is done"
    - ELIF Mental Processes > 35%: SET personaStyle = "Reflective Analyst", explanationTendency = "Interpretation-focused", dialoguePattern = "What X means/implies/suggests"
    - ELIF Verbal Processes > 20%: SET personaStyle = "Research Communicator", explanationTendency = "Evidence-focused", dialoguePattern = "Studies show/experts say/research indicates"
    - ELSE: Use a best-fit description.
3.  **Interpersonal Mapping**: Analyze modality (e.g., certainty, obligation).
    - If modality is strong and frequent: SET confidenceLevel = "Highly Certain", hedgingFrequency = "Low", statementStrength = "Definitive".
    - If modality is mixed: SET confidenceLevel = "Moderately Certain", hedgingFrequency = "Medium", statementStrength = "Qualified".
    - If modality is weak or questioning: SET confidenceLevel = "Cautious", hedgingFrequency = "High", statementStrength = "Tentative".
4.  **Textual Mapping**: Analyze cohesion.
    - If cohesion is high (many connectors, reference chains): SET informationPackaging = "Highly Integrated", topicDevelopment = "Cumulative Building", referenceStyle = "Complex Chains".
    - If cohesion is moderate: SET informationPackaging = "Moderately Connected", topicDevelopment = "Stepped Progression", referenceStyle = "Clear Links".
    - If cohesion is low: SET informationPackaging = "Discrete Segments", topicDevelopment = "Independent Points", referenceStyle = "Explicit Reference".
5.  **Technicality Level**: Score from 1 (conversational) to 10 (highly technical) based on lexical density and use of specialized terms.
6.  **Topic Extraction**: Identify and list up to 5 main topics, keywords, or key phrases from the document.

Now, provide the JSON object for the document provided above.
`;


export const DIALOGUE_GENERATION_PROMPT = (personas: Persona[], structure: ShowStructure) => `
You are a master podcast scriptwriter, an expert in generating natural, multi-speaker dialogue based on detailed Systemic Functional Linguistics (SFL) profiles.

**SHOW STRUCTURE:**
- Title: "${structure.title}"
- Primary Host: "${personas.find(p => p.id === structure.primaryHostId)?.name || 'N/A'}" (This person leads the intro and transitions)
- Generated Intro: "${structure.intro}"
- Key Topics: ${structure.topics.join(', ')}

**SPEAKER PERSONAS & SFL PROFILES:**
${JSON.stringify(personas.map(p => ({
    name: p.name, 
    role: p.role, 
    speakingStyle: p.speakingStyle, 
    sflProfile: p.sflProfile
})), null, 2)}

**YOUR TASK:**
1.  Generate a complete, flowing dialogue script for a podcast episode.
2.  Each line MUST be prefixed with the speaker's name and a colon (e.g., "Jane Doe: ...").
3.  Each speaker's dialogue MUST strictly adhere to their SFL profile, role, and speaking style. The speaking style (e.g., "Energetic") is a direct instruction that should strongly influence the tone, word choice, and pacing of their lines.
    -   A "Definitional Expert" (high relational) should define and classify concepts.
    -   An "Action-Oriented Practitioner" (high material) should talk about processes and implementation.
    -   A speaker with a "Highly Certain" confidence level should use definitive language. A "Cautious" one should use hedging.
4.  The Primary Host must guide the conversation, introduce topics, and create smooth transitions.
5.  Incorporate the knowledge from the speakers' domains (implied by their profiles and topics).
6.  The script should feel authentic, with natural turn-taking.
7.  **Manage Conversational Dynamics for Realism:**
    -   **Pacing & Flow:**
        -   **Information Packaging:** This is your primary guide for pacing. A "Highly Integrated" speaker should have longer, more complex sentences that connect multiple ideas. A "Discrete Segments" speaker should use shorter, more direct sentences, like they are listing points.
        -   **Confidence Level:** Let this influence speech rhythm. A "Highly Certain" speaker should be fluid and direct. A "Cautious" speaker's lines should include more pauses, hesitations, or filler words (e.g., "Well, I suppose...", "It's sort of like..."), reflecting a more deliberate or uncertain thought process.
        -   **Dialogue Pattern:** Use this to shape the *purpose* of the speech. A "What X is/means" pattern should lead to more explanatory, methodical pacing. A "How X works" pattern can be more energetic and sequential.

    -   **Interruptions & Overlaps:** The dialogue should NOT be a simple turn-by-turn exchange. Introduce natural overlaps.
        -   A speaker with a "Highly Certain" \`confidenceLevel\` is a prime candidate to interject, especially if they are also an "Action-Oriented Practitioner." They might cut someone off to correct a detail or to pivot the conversation. (e.g., "Right, but the key thing is...")
        -   A speaker with a "Cautious" \`confidenceLevel\` is more likely to be interrupted or to yield when someone else starts talking. They might also have false starts. (e.g., Speaker A: "So the framework is..." Speaker B (Cautious): "And I think... oh, sorry, go ahead.")
        -   Use overlaps to show agreement or excitement, where one speaker finishes another's thought.
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
    description: 'A fast and versatile model, adept at a wide range of tasks from analysis to creative generation.' 
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro (Preview)',
    hasThinking: true,
    description: 'Excellent for complex reasoning and nuanced persona emulation.'
  }
];