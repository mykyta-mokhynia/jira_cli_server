import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export const verifySource = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'] as string;
    const token = req.query.token as string;

    const validSecrets = [
        config.SECRETS.JIRA_WEBHOOK,
        config.SECRETS.GAS_SCRIPT,
        config.SECRETS.ADMIN_API
    ].filter(Boolean);

    if (validSecrets.includes(apiKey) || validSecrets.includes(token)) {
        return next();
    }

    console.warn(`[Auth] Unauthorized access attempt from ${req.ip}`);
    res.status(401).json({ error: 'Unauthorized' });
};
