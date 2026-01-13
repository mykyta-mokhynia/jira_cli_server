"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySource = void 0;
// Extend config if needed or use process.env directly here for now to avoid circular deps if config is simple
const AUTHORIZED_KEYS = {
    'JIRA': process.env.JIRA_WEBHOOK_SECRET, // Define this in your .env
    'GAS': process.env.GAS_SCRIPT_SECRET, // Define this in your .env
    'ADMIN': process.env.ADMIN_API_KEY // Define this in your .env
};
/**
 * Middleware factory to verify if the request comes from an allowed source.
 * Checks 'x-api-key' header or 'Authorization' (Bearer token) or specific query param.
 * For Jira Webhooks, they often use a specific "Secret" sent as a query param or header?
 * Jira Cloud webhooks: actually you verify the JWT signature if it's a Connect app,
 * or for simple Automation rules you can just add a secret header or token to the URL.
 * We will assume the user adds ?token=SECRET or sends x-api-key header.
 */
const verifySource = (allowedSources) => {
    return (req, res, next) => {
        // 1. Extract token from Headers or Query
        const token = req.headers['x-api-key'] || req.query.token;
        if (!token) {
            res.status(401).json({ error: 'Missing authentication token' });
            return; // Explicit return
        }
        // 2. Validate against allowed sources
        let isValid = false;
        for (const source of allowedSources) {
            const secret = AUTHORIZED_KEYS[source];
            if (secret && token === secret) {
                isValid = true;
                break;
            }
        }
        if (!isValid) {
            res.status(403).json({ error: 'Invalid or unauthorized token' });
            return; // Explicit return
        }
        next();
    };
};
exports.verifySource = verifySource;
