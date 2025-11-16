# Invoice & Expense Copilot - Server

A robust Node.js/Express backend server for managing invoices and expenses with AI-powered automation. This server provides RESTful APIs, AI chat functionality, invoice processing, and expense management capabilities.

## Features

- **AI-Powered Invoice Processing**: Extract data from PDF and image invoices using Google Gemini AI
- **Expense Management**: CRUD operations for expense tracking with advanced querying
- **AI Chat Assistant**: LangChain-based conversational AI with tool calling capabilities
- **Google Drive Integration**: Sync invoices from Google Drive automatically
- **Vector Database**: ChromaDB integration for semantic search and memory
- **Authentication**: JWT-based auth with Google OAuth support
- **File Storage**: Supabase storage for invoice files
- **Rate Limiting**: API rate limiting for security
- **Security**: Helmet, CORS, MongoDB sanitization, and input validation
- **Logging**: Comprehensive request and error logging

## Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **AI/ML**:
    - Google Gemini AI (via @google/genai and LangChain)
    - LangChain for agent orchestration
- **Vector Database**: ChromaDB
- **File Storage**: Supabase Storage
- **Authentication**: Passport.js with JWT and Google OAuth
- **Validation**: Joi and Zod
- **Security**: Helmet, CORS, express-rate-limit, express-mongo-sanitize
- **File Processing**: Multer, pdf-parse
- **Logging**: Custom logger utility

## Prerequisites

- Node.js 20+
- MongoDB database (local or cloud)
- Google Cloud account (for Gemini API and OAuth)
- Supabase account (for file storage)
- ChromaDB instance (for vector storage)

## Installation

1. Navigate to the server directory:

```bash
cd server
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the server directory (see Environment Variables section)

4. Build the TypeScript code:

```bash
npm run build
```

## Environment Variables

Create a `.env` file in the server directory with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=8000
CLIENT_URL=http://localhost:5173

# Database
MONGO_URI=mongodb://localhost:27017/invoice-copilot

# JWT Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Supabase Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_BUCKET_NAME=invoices

# ChromaDB
CHROMA_API_KEY=your-chroma-api-key
CHROMA_TENANT=your-tenant-id
CHROMA_DATABASE=m32-assessment

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Required Environment Variables

- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `GEMINI_API_KEY` - Google Gemini API key
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

## Available Scripts

- `npm run dev` - Start development server with hot reload (ts-node-dev)
- `npm start` - Start production server (requires build first)
- `npm run build` - Compile TypeScript to JavaScript
- `npm test` - Run tests (placeholder)
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run release` - Build and push Docker image

## Project Structure

```
server/
├── src/
│   ├── agents/           # AI agents and tools
│   │   ├── analyticsAgent.ts    # Analytics generation agent
│   │   ├── driveSyncAgent.ts    # Google Drive sync agent
│   │   ├── invoiceAgent.ts      # Invoice processing agent
│   │   ├── orchestrator.ts      # Main AI orchestrator
│   │   ├── queryAgent.ts        # Query processing agent
│   │   └── tools.ts             # LangChain tools definition
│   ├── config/           # Configuration files
│   │   ├── constants.ts  # Environment variables and config
│   │   ├── database.ts   # MongoDB connection
│   │   ├── gemini.ts     # Gemini AI configuration
│   │   ├── passport.ts   # Passport.js strategies
│   │   └── supabase.ts   # Supabase client configuration
│   ├── controllers/      # Route controllers
│   │   ├── authController.ts    # Authentication endpoints
│   │   ├── chatController.ts    # Chat endpoints
│   │   ├── expenseController.ts # Expense endpoints
│   │   ├── invoiceController.ts # Invoice endpoints
│   │   ├── settingsController.ts # Settings endpoints
│   │   └── userController.ts    # User endpoints
│   ├── dto/              # Data Transfer Objects
│   │   ├── auth.dto.ts
│   │   ├── chat.dto.ts
│   │   ├── expense.dto.ts
│   │   └── invoice.dto.ts
│   ├── middleware/       # Express middleware
│   │   ├── authMiddleware.ts    # JWT authentication
│   │   ├── errorHandler.ts      # Error handling
│   │   ├── requestLogger.ts     # Request logging
│   │   ├── uploadMiddleware.ts  # File upload handling
│   │   └── validateRequest.ts   # Request validation
│   ├── models/           # Mongoose models
│   │   ├── User.ts
│   │   ├── Invoice.ts
│   │   ├── Expense.ts
│   │   ├── ChatSession.ts
│   │   ├── ChatMessage.ts
│   │   └── Settings.ts
│   ├── routes/           # Express routes
│   │   ├── authRoutes.ts
│   │   ├── chatRoutes.ts
│   │   ├── expenseRoutes.ts
│   │   ├── invoiceRoutes.ts
│   │   ├── settingsRoutes.ts
│   │   └── userRoutes.ts
│   ├── services/         # Business logic services
│   │   ├── chromaService.ts     # ChromaDB operations
│   │   ├── googleDriveService.ts # Google Drive integration
│   │   ├── memoryService.ts     # Memory/context management
│   │   └── supabaseService.ts   # Supabase storage operations
│   ├── types/            # TypeScript type definitions
│   │   ├── express.d.ts  # Express type extensions
│   │   └── index.ts      # Shared types
│   ├── utils/            # Utility functions
│   │   ├── apiResponse.ts       # Standardized API responses
│   │   ├── asyncHandler.ts      # Async error handler wrapper
│   │   ├── generateToken.ts     # JWT token generation
│   │   └── logger.ts            # Logging utility
│   ├── app.ts            # Express app configuration
│   └── server.ts         # Server entry point
├── dist/                 # Compiled JavaScript (generated)
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose configuration
└── tsconfig.json         # TypeScript configuration
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback

### Invoices

- `GET /api/invoices` - Get all invoices (with filters)
- `POST /api/invoices` - Upload and process invoice
- `GET /api/invoices/:id` - Get invoice by ID
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `POST /api/invoices/:id/process` - Reprocess invoice

### Expenses

- `GET /api/expenses` - Get all expenses (with filters)
- `POST /api/expenses` - Create expense
- `GET /api/expenses/:id` - Get expense by ID
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Chat

- `GET /api/chat/sessions` - Get all chat sessions
- `POST /api/chat/sessions` - Create new chat session
- `GET /api/chat/sessions/:id` - Get chat session
- `POST /api/chat/sessions/:id/messages` - Send message
- `DELETE /api/chat/sessions/:id` - Delete chat session

### Settings

- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

### Users

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Health Check

- `GET /health` - Server health check

## Development

1. Start MongoDB (if running locally):

```bash
mongod
```

2. Start the development server:

```bash
npm run dev
```

3. The server will be available at `http://localhost:8000`

4. The server will automatically reload when you make changes to the code

## Building for Production

1. Build the TypeScript code:

```bash
npm run build
```

2. Start the production server:

```bash
npm start
```

## Docker Deployment

### Build Docker Image

```bash
docker build -t invoice-copilot-server .
```

### Run with Docker

```bash
docker run -p 8000:8000 --env-file .env invoice-copilot-server
```

### Docker Compose

```bash
docker-compose up -d
```

The Dockerfile uses a multi-stage build:

- Builder stage: Installs dependencies and compiles TypeScript
- Production stage: Minimal image with only production dependencies

## Database Setup

### MongoDB

1. Install MongoDB locally or use MongoDB Atlas (cloud)

2. Create a database (e.g., `invoice-copilot`)

3. Update `MONGO_URI` in `.env`:
    - Local: `mongodb://localhost:27017/invoice-copilot`
    - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/invoice-copilot`

### ChromaDB

1. Set up a ChromaDB instance (local or cloud)

2. Configure in `.env`:
    - `CHROMA_API_KEY` - Your ChromaDB API key
    - `CHROMA_TENANT` - Your tenant ID
    - `CHROMA_DATABASE` - Database name

## Security Features

- **Helmet**: Sets various HTTP headers for security
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents API abuse
- **MongoDB Sanitization**: Prevents NoSQL injection attacks
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Joi and Zod schemas for request validation
- **Password Hashing**: bcryptjs for secure password storage

## Error Handling

The server includes comprehensive error handling:

- Centralized error handler middleware
- Standardized error response format
- Request logging for debugging
- Graceful error recovery

## Logging

The server uses a custom logger utility that:

- Logs all incoming requests
- Logs errors with stack traces
- Supports different log levels (info, warn, error)
- Includes timestamps and context

## AI Features

### Invoice Processing

- Extracts data from PDF and image invoices
- Uses Google Gemini Vision API for image processing
- Extracts vendor info, amounts, dates, line items
- Stores extracted data in structured format

### Chat Assistant

- LangChain-based conversational AI
- Tool calling for expense queries, analytics, invoice operations
- Context-aware responses using ChromaDB
- Multi-turn conversation support

### Analytics

- Generates spending insights
- Category-based analysis
- Time-based trends
- Vendor analytics

## Contributing

1. Follow TypeScript best practices
2. Use async/await for asynchronous operations
3. Implement proper error handling
4. Add input validation for all endpoints
5. Write descriptive commit messages
6. Test your changes thoroughly

## License

ISC
