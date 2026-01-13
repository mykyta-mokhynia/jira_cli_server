/**
 * jira-client.js
 * A wrapper for Jira REST API calls.
 */

class JiraClient {
    constructor() {
        this.baseUrl = getJiraBaseUrl();
        this.headers = {
            ...getJiraAuthHeader(),
            "Accept": "application/json",
            "Content-Type": "application/json"
        };
    }

    /**
     * Make a request to Jira API
     * @param {string} endpoint - API path (e.g. '/rest/api/3/user')
     * @param {Object} options - { method, payload, params }
     */
    fetch(endpoint, options = {}) {
        const method = options.method || "get";
        const params = options.params ? "?" + this._queryString(options.params) : "";
        const url = this.baseUrl + endpoint + params;

        const fetchOptions = {
            method: method,
            headers: this.headers,
            muteHttpExceptions: true
        };

        if (options.payload) {
            if (method.toLowerCase() === 'get') {
                console.warn("Payload provided for GET request, this might be ignored by UrlFetchApp");
            }
            fetchOptions.payload = JSON.stringify(options.payload);
        }

        console.log(`[JiraClient] ${method.toUpperCase()} ${url}`);
        const res = UrlFetchApp.fetch(url, fetchOptions);

        if (res.getResponseCode() >= 300) {
            const errBody = res.getContentText();
            console.error(`[JiraClient] Error ${res.getResponseCode()}: ${errBody}`);
            throw new Error(`Jira API Error ${res.getResponseCode()}: ${errBody}`);
        }

        // Some endpoints return 204 No Content
        if (res.getResponseCode() === 204) return {};

        try {
            return JSON.parse(res.getContentText());
        } catch (e) {
            return { raw: res.getContentText() };
        }
    }

    _queryString(params) {
        return Object.entries(params)
            .map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(v))
            .join("&");
    }

    /**
     * Find a user by email to get their accountId
     */
    findUserByEmail(email) {
        if (!email) throw new Error("Email is required to find user");

        const results = this.fetch("/rest/api/3/user/search", {
            params: { query: email }
        });

        if (Array.isArray(results) && results.length > 0) {
            // Find exact match if possible, or take first
            const exact = results.find(u => u.emailAddress && u.emailAddress.toLowerCase() === email.toLowerCase());
            return exact || results[0];
        }
        return null;
    }

    /**
     * Add a user to a group
     */
    addUserToGroup(accountId, groupName) {
        return this.fetch("/rest/api/3/group/user", {
            method: "post",
            params: { groupname: groupName },
            payload: { accountId: accountId }
        });
    }

    /**
     * Create a new group
     */
    createGroup(groupName) {
        return this.fetch("/rest/api/3/group", {
            method: "post",
            payload: { name: groupName }
        });
    }

    /**
     * Get Project Role ID/URL by name
     * @returns {string|null} The self URL of the role or null
     */
    getProjectRoleUrl(projectKey, roleName) {
        const roles = this.fetch(`/rest/api/3/project/${projectKey}/role`);
        // roles is a map: { "Administrators": "https://.../role/10002", ... }
        // Case-insensitive check
        const key = Object.keys(roles).find(k => k.toLowerCase() === roleName.toLowerCase());
        return key ? roles[key] : null;
    }

    /**
     * Get details of a project role (to check actors)
     * @param {string} roleUrl - The full URL returned by getProjectRoleUrl
     */
    getRoleDetails(roleUrl) {
        // Since it's a full URL, we need to extract the path or use absolute fetch.
        // Our fetch method prepends baseURL.
        // Let's parse the path from the URL.
        // URL format: https://site.atlassian.net/rest/api/3/project/PROJ/role/123
        const path = roleUrl.replace(this.baseUrl, "");
        return this.fetch(path);
    }

    /**
     * Add group to project role
     * @param {string} roleUrl - The full URL of the role
     * @param {string} groupName
     */
    addGroupToProjectRole(roleUrl, groupName) {
        const path = roleUrl.replace(this.baseUrl, "");
        return this.fetch(path, {
            method: "post",
            payload: {
                "group": [groupName]
            }
        });
    }
}
