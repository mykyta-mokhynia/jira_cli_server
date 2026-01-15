import { prisma } from './db';
import * as JiraService from './jira';
const GROUP_SUFFIX = 'group_watchers';
const WATCHERS_ROLE_NAME = 'Watchers';

export const syncWatchers = async (projectKey: string, issueKey: string, currentWatcherAccountIds: Set<string>) => {
    const targetGroupName = `${projectKey}${GROUP_SUFFIX}`;

    try {
        const previousWatchers = await prisma.watcher.findMany({
            where: { issueKey }
        });
        const previousAccountIds = new Set<string>(previousWatchers.map((w: any) => w.accountId));

        const addedUsers = [...currentWatcherAccountIds].filter(id => !previousAccountIds.has(id));
        const removedUsers = [...previousAccountIds].filter(id => !currentWatcherAccountIds.has(id));

        console.log(`[WatcherService] Issue ${issueKey}: Added: ${addedUsers.length}, Removed: ${removedUsers.length}`);

        if (addedUsers.length > 0) {
            // No more group/role checks, assuming they exist
            for (const accountId of addedUsers) {
                await prisma.watcher.create({
                    data: { issueKey, projectKey, accountId }
                });
                try {
                    await JiraService.addUserToGroup(accountId, targetGroupName);
                    console.log(`[WatcherService] Added ${accountId} to Jira Group ${targetGroupName}`);
                } catch (e) {
                    console.error(`[WatcherService] Failed to add ${accountId} to Jira group (it might already be there or missing):`, e);
                }
            }
        }

        for (const accountId of removedUsers) {
            await prisma.watcher.deleteMany({
                where: { issueKey, accountId }
            });

            const otherIssuesCount = await prisma.watcher.count({
                where: { projectKey, accountId }
            });

            if (otherIssuesCount === 0) {
                try {
                    await JiraService.removeUserFromGroup(accountId, targetGroupName);
                    console.log(`[WatcherService] Removed ${accountId} from Jira Group ${targetGroupName} (No active watches)`);
                } catch (e) {
                    console.error(`[WatcherService] Failed to remove ${accountId} from Jira group:`, e);
                }
            }
        }
    } catch (error) {
        console.error(`[WatcherService] Error syncing watchers for ${issueKey}:`, error);
        throw error;
    }
};
