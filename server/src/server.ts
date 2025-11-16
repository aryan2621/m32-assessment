import dotenv from 'dotenv';

dotenv.config();

import app from './app';
import connectDB from './config/database';
import { config } from './config/constants';
import { logger } from './utils/logger';

connectDB();

const PORT = config.port;

const server = app.listen(PORT, () => {
    logger.info('Server started', {
        port: PORT,
        environment: config.nodeEnv,
    });
});

process.on('unhandledRejection', (err: Error) => {
    logger.error('UNHANDLED REJECTION - Shutting down server', {
        errorName: err.name,
        errorMessage: err.message,
        stack: err.stack,
    });
    server.close(() => {
        process.exit(1);
    });
});

process.on('SIGTERM', () => {
    logger.warn('SIGTERM received - Shutting down gracefully');
    server.close(() => {
        logger.info('Server terminated successfully');
    });
});
