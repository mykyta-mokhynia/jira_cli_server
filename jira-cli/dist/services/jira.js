"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectRoleByName = exports.addGroupToProjectRole = exports.removeUserFromGroup = exports.addUserToGroup = exports.createGroup = exports.getProjectRoles = exports.getProjectDetails = exports.getBoards = exports.getProjects = exports.updateIssue = exports.createIssue = exports.searchIssues = exports.getIssue = exports.agile = exports.jira = void 0;
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
exports.agile = new jira_js_1.AgileClient({
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
const getProjects = async () => {
    try {
        const projects = await exports.jira.projects.searchProjects({});
        return projects;
    }
    catch (error) {
        console.error("Error fetching projects:", error);
        throw error;
    }
};
exports.getProjects = getProjects;
const getBoards = async () => {
    try {
        const boards = await exports.agile.board.getAllBoards();
        return boards;
    }
    catch (error) {
        console.error("Error fetching boards:", error);
        throw error;
    }
};
exports.getBoards = getBoards;
const getProjectDetails = async (projectKeyOrId) => {
    try {
        const project = await exports.jira.projects.getProject({
            projectIdOrKey: projectKeyOrId,
            expand: ['issueSecurityScheme', 'permissionScheme', 'description', 'lead', 'url']
        });
        return project;
    }
    catch (error) {
        console.error(`Error fetching project details for ${projectKeyOrId}:`, error);
        throw error;
    }
};
exports.getProjectDetails = getProjectDetails;
const getProjectRoles = async (projectKeyOrId) => {
    try {
        // 1. Get all roles URLs
        const rolesUrls = await exports.jira.projectRoles.getProjectRoles({ projectIdOrKey: projectKeyOrId });
        // 2. Fetch details for each role to get actors
        // rolesUrls is an object { "Role Name": "URL" }
        const roleNames = Object.keys(rolesUrls);
        const rolesPromises = roleNames.map(async (roleName) => {
            try {
                // We can't use the URL directly easily with the client, but we can use getProjectRole
                // Note: getProjectRole requires id, but here we have names. 
                // Actually Version3Client.projectRoles.getProjectRole takes { projectIdOrKey, id } where id is the role ID.
                // But getProjectRoles returns names -> URLs. The URL contains the ID.
                // Alternative: Use getProjectRoleDetails (?) - check if it exists.
                // Verify: usually we traverse the map.
                // Let's try to extract ID from URL or just use the name if getProjectRole supports name?
                // The library usually needs the ID.
                // URL example: .../role/10002
                const parts = rolesUrls[roleName].split('/');
                const id = parseInt(parts[parts.length - 1], 10);
                if (isNaN(id))
                    return null;
                const roleDetails = await exports.jira.projectRoles.getProjectRole({
                    projectIdOrKey: projectKeyOrId,
                    id: id
                });
                return roleDetails;
            }
            catch (e) {
                console.warn(`Failed to fetch role ${roleName}`, e);
                return null;
            }
        });
        const roles = await Promise.all(rolesPromises);
        return roles.filter(r => r !== null);
    }
    catch (error) {
        console.error(`Error fetching roles for ${projectKeyOrId}:`, error);
        throw error;
    }
};
exports.getProjectRoles = getProjectRoles;
const createGroup = async (groupName) => {
    try {
        const group = await exports.jira.groups.createGroup({ name: groupName });
        return group;
    }
    catch (error) {
        console.error(`Error creating group ${groupName}:`, error);
        throw error;
    }
};
exports.createGroup = createGroup;
const addUserToGroup = async (accountId, groupName) => {
    try {
        const result = await exports.jira.groups.addUserToGroup({
            groupname: groupName,
            accountId: accountId
        });
        return result;
    }
    catch (error) {
        console.error(`Error adding user ${accountId} to group ${groupName}:`, error);
        throw error;
    }
};
exports.addUserToGroup = addUserToGroup;
const removeUserFromGroup = async (accountId, groupName) => {
    try {
        const result = await exports.jira.groups.removeUserFromGroup({
            groupname: groupName,
            accountId: accountId
        });
        return result;
    }
    catch (error) {
        console.error(`Error removing user ${accountId} from group ${groupName}:`, error);
        throw error;
    }
};
exports.removeUserFromGroup = removeUserFromGroup;
const addGroupToProjectRole = async (projectKeyOrId, roleId, groupName) => {
    try {
        // @ts-ignore: Method exists in V3 client but types might be mismatching or I am missing exact signature
        const result = await exports.jira.projectRoles.addActorsToProjectRole({
            projectIdOrKey: projectKeyOrId,
            id: roleId,
            actors: [groupName]
        });
        return result;
    }
    catch (error) {
        console.error(`Error adding group ${groupName} to role ${roleId} in ${projectKeyOrId}:`, error);
        throw error;
    }
};
exports.addGroupToProjectRole = addGroupToProjectRole;
const getProjectRoleByName = async (projectKeyOrId, roleName) => {
    try {
        const rolesUrls = await exports.jira.projectRoles.getProjectRoles({ projectIdOrKey: projectKeyOrId });
        // rolesUrls is { "Role Name": "URL" } changes based on version, but typically V3 returns this map
        if (rolesUrls[roleName]) {
            const parts = rolesUrls[roleName].split('/');
            const id = parseInt(parts[parts.length - 1], 10);
            return { name: roleName, id: id, self: rolesUrls[roleName] };
        }
        return null;
    }
    catch (error) {
        console.error(`Error finding role ${roleName} in ${projectKeyOrId}:`, error);
        throw error;
    }
};
exports.getProjectRoleByName = getProjectRoleByName;
