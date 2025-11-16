// ANSI color codes for better readability
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
};

const formatTimestamp = () => {
    return new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
};

const formatObject = (obj: any): string => {
    if (obj === null || obj === undefined) return String(obj);
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);

    try {
        return JSON.stringify(obj, null, 2);
    } catch (error) {
        return String(obj);
    }
};

const sanitizeData = (data: any, seen = new WeakSet()): any => {
    // Handle primitives and null/undefined
    if (!data || typeof data !== 'object') return data;

    // Handle circular references
    if (seen.has(data)) return '[Circular]';
    seen.add(data);

    // Handle arrays
    if (Array.isArray(data)) {
        return data.map(item => sanitizeData(item, seen));
    }

    // Handle objects
    const sanitized: any = {};
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization'];

    Object.keys(data).forEach(key => {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            sanitized[key] = '***REDACTED***';
        } else if (typeof data[key] === 'object' && data[key] !== null) {
            sanitized[key] = sanitizeData(data[key], seen);
        } else {
            sanitized[key] = data[key];
        }
    });

    return sanitized;
};

export const logger = {
    info: (message: string, data?: any) => {
        const timestamp = formatTimestamp();
        console.log(
            `${colors.cyan}${colors.bright}[INFO]${colors.reset} ${colors.dim}${timestamp}${colors.reset} ${colors.white}${message}${colors.reset}`
        );
        if (data) {
            console.log(`${colors.cyan}${formatObject(sanitizeData(data))}${colors.reset}\n`);
        }
    },

    error: (message: string, data?: any) => {
        const timestamp = formatTimestamp();
        console.error(
            `${colors.red}${colors.bright}[ERROR]${colors.reset} ${colors.dim}${timestamp}${colors.reset} ${colors.red}${message}${colors.reset}`
        );
        if (data) {
            console.error(`${colors.red}${formatObject(sanitizeData(data))}${colors.reset}\n`);
        }
    },

    warn: (message: string, data?: any) => {
        const timestamp = formatTimestamp();
        console.warn(
            `${colors.yellow}${colors.bright}[WARN]${colors.reset} ${colors.dim}${timestamp}${colors.reset} ${colors.yellow}${message}${colors.reset}`
        );
        if (data) {
            console.warn(`${colors.yellow}${formatObject(sanitizeData(data))}${colors.reset}\n`);
        }
    },

    debug: (message: string, data?: any) => {
        if (process.env.NODE_ENV === 'development') {
            const timestamp = formatTimestamp();
            console.log(
                `${colors.magenta}${colors.bright}[DEBUG]${colors.reset} ${colors.dim}${timestamp}${colors.reset} ${colors.magenta}${message}${colors.reset}`
            );
            if (data) {
                console.log(`${colors.magenta}${formatObject(sanitizeData(data))}${colors.reset}\n`);
            }
        }
    },

    success: (message: string, data?: any) => {
        const timestamp = formatTimestamp();
        console.log(
            `${colors.green}${colors.bright}[SUCCESS]${colors.reset} ${colors.dim}${timestamp}${colors.reset} ${colors.green}${message}${colors.reset}`
        );
        if (data) {
            console.log(`${colors.green}${formatObject(sanitizeData(data))}${colors.reset}\n`);
        }
    },

    request: (method: string, path: string, data?: any) => {
        const timestamp = formatTimestamp();
        console.log(
            `${colors.blue}${colors.bright}[REQUEST]${colors.reset} ${colors.dim}${timestamp}${colors.reset} ${colors.bright}${method}${colors.reset} ${colors.blue}${path}${colors.reset}`
        );
        if (data) {
            console.log(`${colors.blue}${formatObject(sanitizeData(data))}${colors.reset}\n`);
        }
    },

    response: (method: string, path: string, statusCode: number, duration: string, data?: any) => {
        const timestamp = formatTimestamp();
        const statusColor = statusCode >= 500 ? colors.red : statusCode >= 400 ? colors.yellow : colors.green;
        console.log(
            `${statusColor}${colors.bright}[RESPONSE]${colors.reset} ${colors.dim}${timestamp}${colors.reset} ${colors.bright}${method}${colors.reset} ${colors.blue}${path}${colors.reset} ${statusColor}${statusCode}${colors.reset} ${colors.dim}(${duration})${colors.reset}`
        );
        if (data) {
            console.log(`${statusColor}${formatObject(sanitizeData(data))}${colors.reset}\n`);
        }
    },
};
