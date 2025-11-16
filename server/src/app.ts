import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { config } from './config/constants';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import './config/passport';
import authRoutes from './routes/authRoutes';
import chatRoutes from './routes/chatRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import expenseRoutes from './routes/expenseRoutes';
import userRoutes from './routes/userRoutes';
import settingsRoutes from './routes/settingsRoutes';

const app = express();

app.use(helmet());
app.use(mongoSanitize());

const limiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMaxRequests,
    message: 'Too many requests, please try again later',
});

app.use('/api', limiter);

const corsOptions = {
    origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void
    ) => {
        if (config.nodeEnv === 'development') {
            callback(null, true);
            return;
        }

        if (!config.clientUrl) {
            callback(new Error('CLIENT_URL is not configured'));
            return;
        }

        const allowedOrigins = Array.isArray(config.clientUrl)
            ? config.clientUrl
            : [config.clientUrl];

        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(passport.initialize());

app.use(requestLogger);

app.get('/', (_req: Request, res: Response) => {
    res.json({
        message: 'Welcome to Invoice Expense Collector',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            invoices: '/api/invoices',
            expenses: '/api/expenses',
            chat: '/api/chat',
            users: '/api/users',
            settings: '/api/settings',
        },
    });
});

app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);

app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

app.use(errorHandler);

export default app;
