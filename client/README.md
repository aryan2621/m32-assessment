# Invoice & Expense Copilot - Client

A modern React-based frontend application for managing invoices and expenses with AI-powered automation. This client application provides an intuitive interface for uploading invoices, tracking expenses, chatting with an AI assistant, and viewing analytics.

## Features

- **Automated Invoice Processing**: Upload PDF or image invoices and let AI extract all important details automatically
- **Expense Management**: Track and categorize expenses with detailed filtering and search capabilities
- **AI Chat Assistant**: Natural language interface to query expenses, invoices, and get insights
- **Analytics Dashboard**: Visualize spending patterns, vendor analytics, and financial trends
- **Google OAuth Integration**: Secure authentication with Google accounts
- **Real-time Updates**: Live data synchronization with the backend API
- **Responsive Design**: Modern UI built with Tailwind CSS and Radix UI components
- **Dark Mode Support**: Theme switching with next-themes

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Routing**: React Router DOM 7
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form (via components)
- **File Upload**: React Dropzone
- **Markdown Rendering**: React Markdown
- **Notifications**: Sonner

## Prerequisites

- Node.js 18+ and npm
- Backend server running (see server README)

## Installation

1. Navigate to the client directory:

```bash
cd client
```

2. Install dependencies:

```bash
npm install
```

## Environment Variables

Create a `.env` file in the client directory with the following variables:

```env
VITE_BACKEND_SERVER_URL=http://localhost:8000
```

For production, set the backend URL to your deployed server:

```env
VITE_BACKEND_SERVER_URL=https://your-backend-url.com
```

If `VITE_BACKEND_SERVER_URL` is not set, the app will:

- Use `/api` as a relative path in development
- Default to `https://m32-assessment-production.up.railway.app/api` in production

## Available Scripts

- `npm run dev` - Start development server (runs on http://localhost:5173)
- `npm run build` - Build for production (outputs to `dist/`)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint to check code quality

## Project Structure

```
client/
├── src/
│   ├── api/              # API client functions
│   │   ├── auth.ts       # Authentication endpoints
│   │   ├── axios.ts      # Axios instance configuration
│   │   ├── chat.ts       # Chat API endpoints
│   │   ├── expense.ts    # Expense API endpoints
│   │   ├── invoice.ts    # Invoice API endpoints
│   │   └── settings.ts   # Settings API endpoints
│   ├── components/       # React components
│   │   ├── auth/         # Authentication components
│   │   ├── chat/         # Chat interface components
│   │   ├── common/       # Shared/common components
│   │   ├── dashboard/    # Dashboard components
│   │   ├── expense/      # Expense management components
│   │   ├── invoice/      # Invoice management components
│   │   ├── layout/       # Layout components (Sidebar, Layout)
│   │   └── ui/           # Reusable UI components (Radix UI based)
│   ├── hooks/            # Custom React hooks
│   │   ├── useAuth.ts    # Authentication hook
│   │   ├── useChat.ts    # Chat functionality hook
│   │   ├── useExpenses.ts # Expense management hook
│   │   ├── useInvoices.ts # Invoice management hook
│   │   └── useAnalytics.ts # Analytics hook
│   ├── pages/            # Page components
│   │   ├── Landing.tsx   # Landing page
│   │   ├── Login.tsx     # Login page
│   │   ├── Signup.tsx    # Signup page
│   │   ├── Dashboard.tsx # Main dashboard
│   │   ├── Chat.tsx      # AI chat interface
│   │   ├── Invoices.tsx  # Invoice management page
│   │   ├── Expenses.tsx  # Expense management page
│   │   ├── Analytics.tsx # Analytics page
│   │   ├── Settings.tsx  # User settings page
│   │   └── GoogleCallback.tsx # OAuth callback handler
│   ├── store/            # Zustand stores
│   │   ├── authStore.ts  # Authentication state
│   │   ├── chatStore.ts  # Chat state
│   │   └── invoiceStore.ts # Invoice state
│   ├── utils/            # Utility functions
│   │   ├── apiConfig.ts  # API configuration
│   │   ├── cn.ts         # Class name utility
│   │   └── formatters.ts # Data formatting utilities
│   ├── App.tsx           # Main app component with routing
│   └── main.tsx          # Application entry point
├── public/               # Static assets
├── index.html            # HTML template
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## Development

1. Start the development server:

```bash
npm run dev
```

2. The application will be available at `http://localhost:5173`

3. The app will automatically reload when you make changes to the code

## Building for Production

1. Build the application:

```bash
npm run build
```

2. The production build will be in the `dist/` directory

3. Preview the production build:

```bash
npm run preview
```

## Deployment

### Vercel

The project includes a `vercel.json` configuration for deployment on Vercel:

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

The `vercel.json` includes SPA routing configuration to handle client-side routing.

### Other Platforms

For other platforms (Netlify, AWS S3, etc.):

1. Build the application: `npm run build`
2. Deploy the `dist/` directory
3. Configure the server to serve `index.html` for all routes (SPA routing)

## Key Features Implementation

### Authentication

- JWT-based authentication with httpOnly cookies
- Google OAuth integration
- Protected routes with automatic redirects
- Session persistence

### Invoice Management

- Drag-and-drop file upload
- PDF and image support
- Real-time processing status
- Invoice details view with extracted data
- Filtering and search capabilities

### Expense Management

- Manual expense entry
- Category-based organization
- Date range filtering
- Vendor tracking
- Export capabilities

### AI Chat

- Natural language queries
- Context-aware responses
- Multi-turn conversations
- Session management
- Markdown rendering

### Analytics

- Spending trends visualization
- Vendor analytics
- Category breakdowns
- Time-based filtering
- Interactive charts

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the existing code style
2. Use TypeScript for all new code
3. Ensure components are properly typed
4. Test your changes thoroughly
5. Run linting before committing: `npm run lint`
