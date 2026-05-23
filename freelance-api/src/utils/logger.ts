type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

const LEVELS: Record<LogLevel, number> = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
};

const COLORS: Record<LogLevel | 'RESET', string> = {
    ERROR: '\x1b[31m', // Red
    WARN:  '\x1b[33m', // Yellow
    INFO:  '\x1b[32m', // Green
    DEBUG: '\x1b[36m', // Cyan
    RESET: '\x1b[0m',
};

const LOG_LEVEL = (process.env.NODE_ENV === 'production' ? LEVELS.INFO : LEVELS.DEBUG) as number;

function formatMessage(level: LogLevel, message: string, meta: any = ''): string {
    const timestamp = new Date().toISOString();
    const color = COLORS[level] || COLORS.RESET;
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${color}${level.padEnd(5)}${COLORS.RESET} : ${message}${metaStr}`;
}

const logger = {
    error: (msg: string, meta?: any) => {
        if (LEVELS.ERROR <= LOG_LEVEL) {
            console.error(formatMessage('ERROR', msg, meta));
        }
    },
    warn: (msg: string, meta?: any) => {
        if (LEVELS.WARN <= LOG_LEVEL) {
            console.warn(formatMessage('WARN', msg, meta));
        }
    },
    info: (msg: string, meta?: any) => {
        if (LEVELS.INFO <= LOG_LEVEL) {
            console.log(formatMessage('INFO', msg, meta));
        }
    },
    debug: (msg: string, meta?: any) => {
        if (LEVELS.DEBUG <= LOG_LEVEL) {
            console.debug(formatMessage('DEBUG', msg, meta));
        }
    },
};

export default logger;
