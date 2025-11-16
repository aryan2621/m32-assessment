import { GoogleGenAI } from '@google/genai';
import { config } from './constants';

let aiInstance: GoogleGenAI | null = null;

function getAIInstance(): GoogleGenAI {
    if (!aiInstance) {
        aiInstance = new GoogleGenAI({ apiKey: config.geminiApiKey! });
    }
    return aiInstance;
}

export async function generateContent(
    prompt: string,
    options?: { temperature?: number }
): Promise<string> {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: options?.temperature ?? 0.3,
        },
    });
    return response.text || '';
}

export async function generateContentWithMultimodal(
    contents: any[],
    options?: { temperature?: number }
): Promise<string> {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
            temperature: options?.temperature ?? 0.1,
        },
    });
    return response.text || '';
}

export async function uploadFile(
    file: Blob | string,
    config?: { displayName?: string; mimeType?: string }
): Promise<{ name: string; uri?: string; mimeType?: string; state?: string }> {
    const ai = getAIInstance();
    const result = await ai.files.upload({
        file: file,
        config: config,
    });
    return {
        name: result.name || '',
        uri: result.uri,
        mimeType: result.mimeType,
        state: result.state,
    };
}

export async function getFile(name: string): Promise<{ state?: string }> {
    const ai = getAIInstance();
    const result = await ai.files.get({ name });
    return {
        state: result.state,
    };
}

export async function generateContentStrict(prompt: string): Promise<string> {
    return generateContent(prompt, { temperature: 0.1 });
}

export async function generateContentCreative(prompt: string): Promise<string> {
    return generateContent(prompt, { temperature: 0.5 });
}
