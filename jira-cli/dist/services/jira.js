"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateIssue = exports.createIssue = exports.searchIssues = exports.getIssue = exports.jira = void 0;
const jira_js_1 = require("jira.js");
const env_1 = require("../config/env");
if (!env_1.config.JIRA.HOST || !env_1.config.JIRA.EMAIL || !env_1.config.JIRA.API_TOKEN) {
    console.error("Missing Jira credentials. Please check your .env file.");
}
exports.jira = new jira_js_1.Version3Client({
    host: env_1.config.JIRA.HOST,
    authentication: {
        basic: {
            email: env_1.config.JIRA.EMAIL,
            apiToken: env_1.config.JIRA.API_TOKEN,
        },
    },
});
const getIssue = async (issueIdOrKey) => {
    try {
        const issue = await exports.jira.issues.getIssue({ issueIdOrKey });
        return issue;
    }
    catch (error) {
        console.error(`Error fetching issue ${issueIdOrKey}:`, error);
        throw error;
    }
};
exports.getIssue = getIssue;
const searchIssues = async (jql) => {
    try {
        const search = await exports.jira.issueSearch.searchForIssuesUsingJql({
            jql,
            maxResults: 50 // Default limit
        });
        return search;
    }
    catch (error) {
        console.error(`Error searching issues with JQL "${jql}":`, error);
        throw error;
    }
};
exports.searchIssues = searchIssues;
const createIssue = async (issueDetails) => {
    try {
        const issue = await exports.jira.issues.createIssue(issueDetails);
        return issue;
    }
    catch (error) {
        console.error("Error creating issue:", error);
        throw error;
    }
};
exports.createIssue = createIssue;
const updateIssue = async (issueIdOrKey, issueUpdate) => {
    try {
        await exports.jira.issues.editIssue({
            issueIdOrKey,
            ...issueUpdate
        });
        return { success: true, key: issueIdOrKey };
    }
    catch (error) {
        console.error(`Error updating issue ${issueIdOrKey}:`, error);
        throw error;
    }
};
exports.updateIssue = updateIssue;
