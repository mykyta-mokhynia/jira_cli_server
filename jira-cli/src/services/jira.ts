import { Version3Client, AgileClient } from 'jira.js';
import { config } from '../config/env';

if (!config.JIRA.HOST || !config.JIRA.EMAIL || !config.JIRA.API_TOKEN) {
    console.error("Missing Jira credentials. Please check your .env file.");
}

export const jira = new Version3Client({
    host: config.JIRA.HOST,
    authentication: {
        basic: {
            email: config.JIRA.EMAIL,
            apiToken: config.JIRA.API_TOKEN,
        },
    },
});

export const agile = new AgileClient({
    host: config.JIRA.HOST,
    authentication: {
        basic: {
            email: config.JIRA.EMAIL,
            apiToken: config.JIRA.API_TOKEN,
        },
    },
});

export const getIssue = async (issueIdOrKey: string) => {
    try {
        const issue = await jira.issues.getIssue({ issueIdOrKey });
        return issue;
    } catch (error) {
        console.error(`Error fetching issue ${issueIdOrKey}:`, error);
        throw error;
    }
};

export const searchIssues = async (jql: string) => {
    try {
        const search = await jira.issueSearch.searchForIssuesUsingJql({
            jql,
            maxResults: 50 // Default limit
        });
        return search;
    } catch (error) {
        console.error(`Error searching issues with JQL "${jql}":`, error);
        throw error;
    }
};

export const createIssue = async (issueDetails: any) => {
    try {
        const issue = await jira.issues.createIssue(issueDetails);
        return issue;
    } catch (error) {
        console.error("Error creating issue:", error);
        throw error;
    }
};

export const updateIssue = async (issueIdOrKey: string, issueUpdate: any) => {
    try {
        await jira.issues.editIssue({
            issueIdOrKey,
            ...issueUpdate
        });
        return { success: true, key: issueIdOrKey };
    } catch (error) {
        console.error(`Error updating issue ${issueIdOrKey}:`, error);
        throw error;
    }
};

export const getProjects = async () => {
    try {
        const projects = await jira.projects.searchProjects({});
        return projects;
    } catch (error) {
        console.error("Error fetching projects:", error);
        throw error;
    }
};

export const getBoards = async () => {
    try {
        const boards = await agile.board.getAllBoards();
        return boards;
    } catch (error) {
        console.error("Error fetching boards:", error);
        throw error;
    }
};

export const getProjectDetails = async (projectKeyOrId: string) => {
    try {
        const project = await jira.projects.getProject({
            projectIdOrKey: projectKeyOrId,
            expand: ['issueSecurityScheme', 'permissionScheme', 'description', 'lead', 'url']
        });
        return project;
    } catch (error) {
        console.error(`Error fetching project details for ${projectKeyOrId}:`, error);
        throw error;
    }
};

export const getProjectRoles = async (projectKeyOrId: string) => {
    try {
        // 1. Get all roles URLs
        const rolesUrls = await jira.projectRoles.getProjectRoles({ projectIdOrKey: projectKeyOrId });

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

                if (isNaN(id)) return null;

                const roleDetails = await jira.projectRoles.getProjectRole({
                    projectIdOrKey: projectKeyOrId,
                    id: id
                });
                return roleDetails;
            } catch (e) {
                console.warn(`Failed to fetch role ${roleName}`, e);
                return null;
            }
        });

        const roles = await Promise.all(rolesPromises);
        return roles.filter(r => r !== null);
    } catch (error) {
        console.error(`Error fetching roles for ${projectKeyOrId}:`, error);
        throw error;
    }
};

export const createGroup = async (groupName: string) => {
    try {
        const group = await jira.groups.createGroup({ name: groupName });
        return group;
    } catch (error) {
        console.error(`Error creating group ${groupName}:`, error);
        throw error;
    }
};

export const addUserToGroup = async (accountId: string, groupName: string) => {
    try {
        const result = await jira.groups.addUserToGroup({
            groupname: groupName,
            accountId: accountId
        });
        return result;
    } catch (error) {
        console.error(`Error adding user ${accountId} to group ${groupName}:`, error);
        throw error;
    }
};

export const addGroupToProjectRole = async (projectKeyOrId: string, roleId: number, groupName: string) => {
    try {
        // @ts-ignore: Method exists in V3 client but types might be mismatching or I am missing exact signature
        const result = await jira.projectRoles.addActorsToProjectRole({ // Correct method name based on search
            projectIdOrKey: projectKeyOrId,
            id: roleId,
            actors: [groupName]
        });
        return result;
    } catch (error) {
        console.error(`Error adding group ${groupName} to role ${roleId} in ${projectKeyOrId}:`, error);
        throw error;
    }
};

export const getProjectRoleByName = async (projectKeyOrId: string, roleName: string) => {
    try {
        const rolesUrls = await jira.projectRoles.getProjectRoles({ projectIdOrKey: projectKeyOrId });
        // rolesUrls is { "Role Name": "URL" } changes based on version, but typically V3 returns this map

        if (rolesUrls[roleName]) {
            const parts = rolesUrls[roleName].split('/');
            const id = parseInt(parts[parts.length - 1], 10);
            return { name: roleName, id: id, self: rolesUrls[roleName] };
        }
        return null;
    } catch (error) {
        console.error(`Error finding role ${roleName} in ${projectKeyOrId}:`, error);
        throw error;
    }
};
