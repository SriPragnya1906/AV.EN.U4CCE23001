// Custom Logging Middleware to replace console.log
// Sends logs to the central evaluation service

const LOG_API_URL = "http://202.207.122.201/evaluation-service/logs";

/**
 * Custom logger
 * @param {string} stack - Must be "backend" or "frontend"
 * @param {string} level - "debug", "info", "warn", "error", "fatal"
 * @param {string} pkg - E.g. "api", "ui", "controller", "db", "auth"
 * @param {string|object} message - The message to log
 */
export const Log = async (stack, level, pkg, message) => {
    try {
        // Stringify message if it's an object to ensure clean transmission
        const logMessage = typeof message === 'string' ? message : JSON.stringify(message);

        // Making the API call using fetch
        const response = await fetch(LOG_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                stack: stack,
                level: level,
                package: pkg,
                message: logMessage,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            // Just swallowing the error silently so we don't cause recursive logging issues
            // in a real scenario we'd write to a fallback local file
        }
    } catch (err) {
        // We do not use console.log here to strictly adhere to the rules
    }
};
