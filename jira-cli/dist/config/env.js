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
exports.config = {
    PORT: process.env.PORT || 3000,
    WEBAPP_URL: process.env.WEBAPP_URL, // Legacy support if needed
    JIRA: {
        HOST: process.env.JIRA_HOST || '', // e.g., 'https://your-domain.atlassian.net'
        EMAIL: process.env.JIRA_EMAIL || '',
        API_TOKEN: process.env.JIRA_API_TOKEN || '',
    }
};
if (!exports.config.JIRA.HOST || !exports.config.JIRA.EMAIL || !exports.config.JIRA.API_TOKEN) {
    console.warn("WARNING: JIRA_HOST, JIRA_EMAIL, or JIRA_API_TOKEN are missing in .env. Jira calls will fail.");
}
