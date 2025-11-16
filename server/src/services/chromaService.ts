import { CloudClient, Collection } from 'chromadb';
import { config } from '../config/constants';
import { logger } from '../utils/logger';

let client: CloudClient | null = null;

const getChromaClient = (): CloudClient => {
    if (!client) {
        if (!config.chromaApiKey) {
            throw new Error('CHROMA_API_KEY is required for memory functionality');
        }

        client = new CloudClient({
            apiKey: config.chromaApiKey,
            tenant: config.chromaTenant,
            database: config.chromaDatabase,
        });
    }

    return client;
};

const COLLECTION_NAME = 'user_memories';

const chromaCollectionPromise = getChromaClient().getOrCreateCollection({
    name: COLLECTION_NAME,
});

export const getCollection = async (): Promise<Collection> => {
    try {
        return await chromaCollectionPromise;
    } catch (error: any) {
        logger.error('Error getting Chroma collection', {
            collectionName: COLLECTION_NAME,
            error: error.message,
        });
        throw error;
    }
};

export default chromaCollectionPromise;
