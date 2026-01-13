"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env from project root (one level up from jira-cli if that's where it is, or root of jira-cli)
// Original code had path: '../.env'. Let's support both or just ../.env as per existing setup
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
// Note: __dirname is src/config, so ../../../.env would be project root if jira-cli is inside a project
// Wait, the original was `dotenv.config({ path: '../.env' });` relative to `index.ts` in root.
// So if we run from `jira-cli` (cwd), `../.env` is the parent dir of `jira-cli`.
// Let's stick to the user's existing pattern but make it robust.
const envPath = path_1.default.resolve(process.cwd(), '../.env');
dotenv_1.default.config({ path: envPath });
// Support legacy JIRA_AUTH (email:token)
let jiraEmail = process.env.JIRA_EMAIL || '';
let jiraToken = process.env.JIRA_API_TOKEN || '';
const legacyAuth = process.env.JIRA_AUTH;
if ((!jiraEmail || !jiraToken) && legacyAuth && legacyAuth.includes(':')) {
    const [email, token] = legacyAuth.split(':');
    jiraEmail = email.trim();
    jiraToken = token.trim();
}
exports.config = {
    PORT: process.env.PORT || 3000,
    WEBAPP_URL: process.env.WEBAPP_URL, // Legacy support if needed
    JIRA: {
        HOST: process.env.JIRA_HOST || process.env.JIRA_BASE_URL || '',
        EMAIL: jiraEmail,
        API_TOKEN: jiraToken,
    }
};
if (!exports.config.JIRA.HOST || !exports.config.JIRA.EMAIL || !exports.config.JIRA.API_TOKEN) {
    console.warn("WARNING: JIRA credentials missing. Checked JIRA_HOST/JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, and JIRA_AUTH.");
}
