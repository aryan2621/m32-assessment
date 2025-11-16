export const config = {
    backendUrl: process.env.BACKEND_URL,
    clientUrl: process.env.CLIENT_URL,
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRE,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseBucketName: process.env.SUPABASE_BUCKET_NAME,
    geminiApiKey: process.env.GEMINI_API_KEY,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS!, 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS!, 10),
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    chromaApiKey: process.env.CHROMA_API_KEY,
    chromaTenant: process.env.CHROMA_TENANT || 'a11b23af-d5d8-4351-ad30-4934ee441838',
    chromaDatabase: process.env.CHROMA_DATABASE || 'm32-assessment',
};

if (!config.mongoUri) {
    throw new Error('MONGO_URI is required');
}

if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is required');
}

if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error('Supabase configuration is required');
}

if (!config.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is required');
}
