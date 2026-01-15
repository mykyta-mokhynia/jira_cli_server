import dotenv from 'dotenv';
import path from 'path';

const localEnv = path.resolve(process.cwd(), '.env');
const parentEnv = path.resolve(process.cwd(), '../.env');

dotenv.config({ path: parentEnv });
dotenv.config({ path: localEnv }); // Local .env overrides parent if exists

let jiraEmail = process.env.JIRA_EMAIL || '';
let jiraToken = process.env.JIRA_API_TOKEN || '';
const legacyAuth = process.env.JIRA_AUTH;

if ((!jiraEmail || !jiraToken) && legacyAuth && legacyAuth.includes(':')) {
    const [email, token] = legacyAuth.split(':');
    jiraEmail = email.trim();
    jiraToken = token.trim();
}

export const config = {
    PORT: process.env.SERVER_JIRA_PORT || 3001,
    DATABASE_URL: process.env.DATABASE_URL,
    JIRA: {
        HOST: process.env.JIRA_HOST || process.env.JIRA_BASE_URL || '',
        EMAIL: jiraEmail,
        API_TOKEN: jiraToken,
    },
    SECRETS: {
        JIRA_WEBHOOK: process.env.JIRA_WEBHOOK_SECRET,
        GAS_SCRIPT: process.env.GAS_SCRIPT_SECRET,
        ADMIN_API: process.env.ADMIN_API_KEY
    }
};

if (!config.JIRA.HOST || !config.JIRA.EMAIL || !config.JIRA.API_TOKEN) {
    console.warn("WARNING: JIRA credentials missing in server-jira.");
}
