import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Tab, ControlSettings } from '../types';

const geminiSchemaMetadata = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        category: { type: Type.STRING }
    },
    required: ["title", "description", "keywords", "category"]
};

const geminiSchemaPrompt = {
    type: Type.OBJECT,
    properties: {
        description: { type: Type.STRING }
    },
    required: ["description"]
};

export const createPrompt = (settings: ControlSettings, mode: Tab): string => {
    const { 
        customPromptSelect, customPromptEntry,
        promptSwitches, customPromptEntryPrompt,
        descWords
    } = settings;

    // Handle custom prompts first
    if (mode === 'prompt' && promptSwitches.customPrompt && customPromptEntryPrompt.trim()) {
        return `Analyze this image based on the following instructions:\n${customPromptEntryPrompt.trim()}\n\nProvide JSON object with only 'description'.`;
    }
    if (mode === 'metadata' && customPromptSelect === 'set_custom' && customPromptEntry.trim()) {
        return `Analyze this image based on the following instructions:\n${customPromptEntry.trim()}\n\nProvide JSON object with 'title', 'description', 'keywords', and a relevant 'category'.`;
    }

    if (mode === 'prompt') {
        let prompt = `Act as an expert metadata generator specializing in stock media requirements.\nAnalyze this image.\nIMPORTANT: If the subject is isolated, assume it's on a white or transparent background. Do NOT mention "black background", "dark background", or similar phrases.\n`;
        prompt += `Generate only a compelling description.\nTarget Description Length: MUST BE EXACTLY ${descWords} words. Provide the exact word count requested.\n`;
        if (promptSwitches.silhouette) prompt += "Style: Silhouette. Emphasize this.\n";
        if (promptSwitches.whiteBg) prompt += "Background: Plain white. Mention 'white background', 'isolated'.\n";
        if (promptSwitches.transparentBg) prompt += "Background: Transparent. Mention 'transparent background', 'isolated'.\n";
        prompt += "Focus on facts and concepts, avoiding subjective words (e.g., beautiful, amazing).\n\nProvide JSON object with only 'description'.";
        return prompt;
    } else { // metadata mode
        return `I will give you images. You have to:
1. Write detailed prompt for each images (populate the 'description' field).
2. Write title for each images as per instructions and guide.
3. Write keywords for each images as per instructions and guide.
4. Select a relevant Category.

Instructions: Analyze this image and generate content based on the following exact and strict requirements. Please give keywords separated by comma also give single word keyword and prefer singular keyword. please give single word keyword and give at maximum 30 keywords also give a title and title character will be around 75 -130 character, also give title in sentence case means only first letter will be in capital.

Provide JSON object with 'title', 'description', 'keywords', and 'category'.`;
    }
};

export const callApiWithBackoff = async (
    ai: GoogleGenAI,
    modelName: string,
    prompt: string,
    apiData: { base64Data: string; mimeType: string } | null,
    settings: ControlSettings,
    mode: Tab,
    onRetry: (delay: number) => void
): Promise<any> => {
    if (!apiData) throw new Error("API data is missing.");
    
    const schema = (mode === 'prompt') ? geminiSchemaPrompt : geminiSchemaMetadata;
    let delay = 1000;
    const maxDelay = 30000; // 30-second maximum delay

    while (true) {
        try {
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: modelName,
                contents: {
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: apiData.mimeType, data: apiData.base64Data } }
                    ]
                },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema
                }
            });
            
            const resultText = response.text;
            if (!resultText) {
                 const safetyReason = response.candidates?.[0]?.finishReason;
                 if (safetyReason === 'SAFETY') {
                    console.warn("API Debug (Safety Block):", JSON.stringify(response, null, 2));
                    throw new Error("Blocked by safety settings.");
                 }
                 console.warn("API Debug (No Text):", JSON.stringify(response, null, 2));
                 throw new Error("Invalid API response structure.");
            }
            
            let metadata = JSON.parse(resultText);
            
            if (mode === 'metadata') {
                 const { advanceTitle, keywordsCount } = settings;
                 let baseTitle = metadata.title ? metadata.title.charAt(0).toUpperCase() + metadata.title.slice(1).toLowerCase() : "";
                 
                 const opts = [];
                 if (advanceTitle.transparentBg) opts.push("isolated on transparent background");
                 if (advanceTitle.whiteBg) opts.push("isolated on white background");
                 if (advanceTitle.vector) opts.push("Vector");
                 if (advanceTitle.illustration) opts.push("illustration");
                 const toggleText = opts.length > 0 ? " " + opts.join(', ') : "";

                 metadata.title = baseTitle + toggleText;

                 let combinedKeywords = (metadata.keywords || []).map((kw: string) => kw.trim().toLowerCase()).filter(Boolean);
                 const toggleKeywordsLower = opts.map(kw => kw.toLowerCase());
                 toggleKeywordsLower.forEach((tk) => {
                     if (!combinedKeywords.includes(tk)) combinedKeywords.push(tk);
                 });
                 
                 metadata.keywords = [...new Set(combinedKeywords)].slice(0, keywordsCount);
            }

            return metadata;

        } catch (error: any) {
            console.warn(`API call failed. Retrying in ${delay / 1000}s...`, error.message);
            onRetry(delay);
            await new Promise(res => setTimeout(res, delay));
            delay = Math.min(delay * 2, maxDelay); // Exponential backoff with a cap
        }
    }
};