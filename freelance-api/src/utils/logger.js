/**
 * A simple, structured logger that mimics the behavior of the Python logging module.
 * Provides levels (ERROR, WARN, INFO, DEBUG), timestamps, and colorized output.
 */

const LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
};

// ANSI color codes for terminal output
const COLORS = {
    ERROR: '\x1b[31m', // Red
    WARN:  '\x1b[33m', // Yellow
    INFO:  '\x1b[32m', // Green
    DEBUG: '\x1b[36m', // Cyan
    RESET: '\x1b[0m',
};

const LOG_LEVEL = process.env.NODE_ENV === 'production' ? LEVELS.INFO : LEVELS.DEBUG;

function formatMessage(level, message, meta = '') {
    const timestamp = new Date().toISOString();
    const color = COLORS[level] || COLORS.RESET;
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${color}${level.padEnd(5)}${COLORS.RESET} : ${message}${metaStr}`;
}

const logger = {
    error: (msg, meta) => {
        if (LEVELS.ERROR <= LOG_LEVEL) {
            console.error(formatMessage('ERROR', msg, meta));
        }
    },
    warn: (msg, meta) => {
        if (LEVELS.WARN <= LOG_LEVEL) {
            console.warn(formatMessage('WARN', msg, meta));
        }
    },
    info: (msg, meta) => {
        if (LEVELS.INFO <= LOG_LEVEL) {
            console.log(formatMessage('INFO', msg, meta));
        }
    },
    debug: (msg, meta) => {
        if (LEVELS.DEBUG <= LOG_LEVEL) {
            console.debug(formatMessage('DEBUG', msg, meta));
        }
    },
};

export default logger;
