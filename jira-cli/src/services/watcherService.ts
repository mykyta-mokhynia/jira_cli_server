import { PrismaClient } from '@prisma/client';
import * as JiraService from './jira';

const prisma = new PrismaClient();
const GROUP_SUFFIX = 'group_watchers';
const WATCHERS_ROLE_NAME = 'Watchers';

export const syncWatchers = async (projectKey: string, issueKey: string, currentWatcherAccountIds: Set<string>) => {
    const targetGroupName = `${projectKey}${GROUP_SUFFIX}`;

    try {
        // 1. Get previous watchers for this issue from DB
        const previousWatchers = await prisma.watcher.findMany({
            where: { issueKey }
        });
        const previousAccountIds = new Set(previousWatchers.map(w => w.accountId));

        // 2. Determine Added and Removed users for THIS issue
        const addedUsers = [...currentWatcherAccountIds].filter(id => !previousAccountIds.has(id));
        const removedUsers = [...previousAccountIds].filter(id => !currentWatcherAccountIds.has(id));

        console.log(`[WatcherService] Issue ${issueKey}: Added: ${addedUsers.length}, Removed: ${removedUsers.length}`);

        // --- PHASE 1: Handle Additions ---
        if (addedUsers.length > 0) {
            // Ensure Group and Role exist (Idempotent-ish check)
            await ensureGroupAndRole(projectKey, targetGroupName);

            for (const accountId of addedUsers) {
                // Add to DB
                await prisma.watcher.create({
                    data: { issueKey, projectKey, accountId }
                });
                // Add to Jira Group
                try {
                    await JiraService.addUserToGroup(accountId, targetGroupName);
                    console.log(`[WatcherService] Added ${accountId} to Jira Group ${targetGroupName}`);
                } catch (e) {
                    console.error(`[WatcherService] Failed to add ${accountId} to Jira group:`, e);
                }
            }
        }

        // --- PHASE 2: Handle Removals ---
        for (const accountId of removedUsers) {
            // Remove from DB for THIS issue
            await prisma.watcher.deleteMany({
                where: {
                    issueKey: issueKey,
                    accountId: accountId
                }
            });

            // Check if user is watching ANY other issue in this project
            const otherIssuesCount = await prisma.watcher.count({
                where: {
                    projectKey: projectKey,
                    accountId: accountId
                }
            });

            if (otherIssuesCount === 0) {
                // User is not watching any other issues -> Remove from Jira Group
                try {
                    await JiraService.removeUserFromGroup(accountId, targetGroupName);
                    console.log(`[WatcherService] Removed ${accountId} from Jira Group ${targetGroupName} (No active watches)`);
                } catch (e) {
                    console.error(`[WatcherService] Failed to remove ${accountId} from Jira group:`, e);
                }
            } else {
                console.log(`[WatcherService] User ${accountId} removed from ${issueKey} but still watches ${otherIssuesCount} other issues. Kept in group.`);
            }
        }

    } catch (error) {
        console.error(`[WatcherService] Error syncing watchers for ${issueKey}:`, error);
        throw error;
    }
};

const ensureGroupAndRole = async (projectKey: string, groupName: string) => {
    // 1. Create Group if missing
    try {
        await JiraService.createGroup(groupName);
    } catch (e: any) {
        // Ignore "group already exists" errors
    }

    // 2. Add Group to Role
    try {
        const role = await JiraService.getProjectRoleByName(projectKey, WATCHERS_ROLE_NAME);
        if (role) {
            // We can just try adding it, assuming it handles "already added" gracefully or we catch it
            await JiraService.addGroupToProjectRole(projectKey, role.id, groupName);
        } else {
            console.warn(`[WatcherService] Role ${WATCHERS_ROLE_NAME} not found via name lookup.`);
        }
    } catch (e) {
        // Ignore if already in role
    }
};
