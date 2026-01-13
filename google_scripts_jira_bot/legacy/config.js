// Global configuration and shared functions for Jira/Confluence integration

const JIRA_BASE_URL = 'https://jarvisheart.atlassian.net/';
const CONF_REST_API = 'https://jarvisheart.atlassian.net/wiki/rest/api';

/**
 * Get authentication header for Jira/Confluence API requests
 * @returns {Object} Headers object with Authorization
 */
function jiraAuthHeader_() {
  const creds = PropertiesService.getScriptProperties().getProperty('JIRA_AUTH');
  if (!creds) throw new Error("JIRA_AUTH not set (email:token)");
  return { "Authorization": "Basic " + Utilities.base64Encode(creds) };
}

/**
 * Fetch data from Jira API using relative path
 * @param {string} path - API path (e.g., "/rest/api/3/project")
 * @param {Object} params - Query parameters object
 * @param {Object} options - Optional fetch options (method, payload)
 * @returns {Object} Parsed JSON response
 */
function jiraFetch_(path, params, options) {
  const qp = params ? "?" + Object.entries(params)
    .map(([k,v]) => k + "=" + encodeURIComponent(v)).join("&") : "";

  const url = JIRA_BASE_URL.replace(/\/+$/,"") + path + qp;

  const fetchOptions = {
    method: "get",
    headers: { ...jiraAuthHeader_(), "Accept": "application/json" },
    muteHttpExceptions: true
  };
  
  if (options) {
    if (options.method) fetchOptions.method = options.method;
    if (options.payload) {
      fetchOptions.payload = JSON.stringify(options.payload);
      fetchOptions.headers["Content-Type"] = "application/json";
    }
  }

  const res = UrlFetchApp.fetch(url, fetchOptions);

  if (res.getResponseCode() >= 300) {
    throw new Error("Jira error " + res.getResponseCode() + ": " + res.getContentText());
  }

  return JSON.parse(res.getContentText());
}

/**
 * Fetch data from Jira API using absolute URL
 * @param {string} url - Full API URL
 * @returns {Object} Parsed JSON response
 */
function jiraFetchAbsolute_(url) {
  const res = UrlFetchApp.fetch(url, {
    method: "get",
    headers: { ...jiraAuthHeader_(), "Accept": "application/json" },
    muteHttpExceptions: true
  });

  if (res.getResponseCode() >= 300) {
    throw new Error("Jira error: " + res.getContentText());
  }

  return JSON.parse(res.getContentText());
}

// User cache for resolving account IDs
const userCache_ = {};

/**
 * Resolve user information by account ID
 * @param {string} accountId - Jira account ID
 * @returns {Object|null} User object with name, surname, email, accountId
 */
function resolveUserByAccountId_(accountId) {
  if (!accountId) return null;
  if (userCache_[accountId]) return userCache_[accountId];

  try {
    const u = jiraFetch_("/rest/api/3/user", { accountId: accountId });
    const parts = (u.displayName || '').split(' ');
    const resolved = {
      name: parts.shift() || '',
      surname: parts.join(' '),
      email: u.emailAddress || '',
      accountId: accountId
    };
    userCache_[accountId] = resolved;
    return resolved;
  } catch (e) {
    const resolved = {
      name: accountId,
      surname: '',
      email: '',
      accountId: accountId
    };
    userCache_[accountId] = resolved;
    return resolved;
  }
}

