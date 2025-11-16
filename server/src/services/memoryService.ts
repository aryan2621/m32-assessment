import { getCollection } from './chromaService';
import { logger } from '../utils/logger';

interface MemoryItem {
    key?: string;
    value: string;
    description?: string;
    type?: string;
    metadata?: Record<string, any>;
}

export const saveMemory = async (userId: string, memory: MemoryItem): Promise<void> => {
    try {
        const collection = await getCollection();

        const text = memory.key
            ? `${memory.key}: ${memory.value}${memory.description ? ` - ${memory.description}` : ''}`
            : memory.value;

        const metadata = {
            userId,
            key: memory.key || '',
            type: memory.type || 'general',
            description: memory.description || '',
            ...memory.metadata,
            createdAt: new Date().toISOString(),
        };

        await collection.add({
            ids: [`${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`],
            metadatas: [metadata],
            documents: [text],
        });
    } catch (error: any) {
        logger.error('Error saving memory', { userId, error: error.message });
        throw error;
    }
};

export const searchMemories = async (
    userId: string,
    query: string,
    limit: number = 5
): Promise<Array<{ text: string; metadata: Record<string, any>; distance: number }>> => {
    try {
        const collection = await getCollection();

        const results = await collection.query({
            queryTexts: [query],
            nResults: limit,
            where: { userId },
        });

        if (
            !results.metadatas ||
            !results.metadatas[0] ||
            !results.documents ||
            !results.documents[0]
        ) {
            return [];
        }

        const memories = results.metadatas[0]
            .map((metadata: any, index: number) => {
                const doc = results.documents![0][index];
                if (!doc) return null;
                return {
                    text: doc,
                    metadata,
                    distance: results.distances?.[0]?.[index] || 0,
                };
            })
            .filter(
                (item): item is { text: string; metadata: Record<string, any>; distance: number } =>
                    item !== null
            );

        return memories;
    } catch (error: any) {
        logger.error('Error searching memories', { userId, error: error.message });
        return [];
    }
};

export const getMemoryByKey = async (userId: string, key: string): Promise<string | null> => {
    try {
        const collection = await getCollection();

        const results = await collection.get({
            where: { userId, key },
        });

        if (results.documents && results.documents.length > 0) {
            return results.documents[0];
        }

        return null;
    } catch (error: any) {
        logger.error('Error getting memory by key', { userId, key, error: error.message });
        return null;
    }
};

export const deleteMemoryByKey = async (userId: string, key: string): Promise<void> => {
    try {
        const collection = await getCollection();

        const results = await collection.get({
            where: { userId, key },
        });

        if (results.ids && results.ids.length > 0) {
            await collection.delete({
                ids: results.ids,
            });
        }
    } catch (error: any) {
        logger.error('Error deleting memory', { userId, key, error: error.message });
        throw error;
    }
};

export const getAllMemories = async (
    userId: string
): Promise<Array<{ text: string; metadata: Record<string, any> }>> => {
    try {
        const collection = await getCollection();

        const results = await collection.get({
            where: { userId },
        });

        if (!results.documents || !results.metadatas) {
            return [];
        }

        return results.documents
            .map((doc: string | null, index: number) => {
                if (!doc) return null;
                return {
                    text: doc,
                    metadata: results.metadatas![index],
                };
            })
            .filter(
                (item): item is { text: string; metadata: Record<string, any> } => item !== null
            );
    } catch (error: any) {
        logger.error('Error getting all memories', { userId, error: error.message });
        return [];
    }
};

export const loadRelevantMemories = async (
    userId: string,
    context: string,
    limit: number = 5
): Promise<string> => {
    try {
        const memories = await searchMemories(userId, context, limit);

        if (memories.length === 0) {
            return '';
        }

        const memoryText = memories.map((mem) => `- ${mem.text}`).join('\n');

        return `Relevant user information:\n${memoryText}\n`;
    } catch (error: any) {
        logger.error('Error loading relevant memories', { userId, error: error.message });
        return '';
    }
};
