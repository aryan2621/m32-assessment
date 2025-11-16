import mongoose from 'mongoose';
import { config } from './constants';
import { logger } from '../utils/logger';

const connectDB = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(config.mongoUri!);

        logger.info('MongoDB connected', {
            host: conn.connection.host,
            database: conn.connection.name,
        });

        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error', {
                error: err.message,
                stack: err.stack,
            });
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });

        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            process.exit(0);
        });
    } catch (error: any) {
        logger.error('Failed to connect to MongoDB', {
            error: error.message,
            stack: error.stack,
        });
        process.exit(1);
    }
};

export default connectDB;
