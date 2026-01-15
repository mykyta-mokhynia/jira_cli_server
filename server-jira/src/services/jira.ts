import { Version3Client, AgileClient } from 'jira.js';
import { config } from '../config/env';

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

export const removeUserFromGroup = async (accountId: string, groupName: string) => {
    try {
        const result = await jira.groups.removeUserFromGroup({
            groupname: groupName,
            accountId: accountId
        });
        return result;
    } catch (error) {
        console.error(`Error removing user ${accountId} from group ${groupName}:`, error);
        throw error;
    }
};

export const addGroupToProjectRole = async (projectKeyOrId: string, roleId: number, groupName: string) => {
    try {
        // @ts-ignore
        const result = await jira.projectRoles.addActorsToProjectRole({
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
