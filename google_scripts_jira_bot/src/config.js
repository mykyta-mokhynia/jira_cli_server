/**
 * config.js
 * Central configuration and helper functions.
 */

const CONFIG = {
    // Add defaults or fallbacks here if necessary
    DEFAULT_JIRA_URL: 'https://jarvisheart.atlassian.net' // Fallback
};

/**
 * Get the Jira Base URL from script properties or fallback
 */
function getJiraBaseUrl() {
    const url = PropertiesService.getScriptProperties().getProperty('JIRA_BASE_URL');
    return (url || CONFIG.DEFAULT_JIRA_URL).replace(/\/+$/, "");
}

/**
 * Get authentication header for Jira API
 */
function getJiraAuthHeader() {
    const creds = PropertiesService.getScriptProperties().getProperty('JIRA_AUTH');
    if (!creds) {
        throw new Error("JIRA_AUTH property not set. Please set 'email:token' in Script Properties.");
    }
    return { "Authorization": "Basic " + Utilities.base64Encode(creds) };
}
