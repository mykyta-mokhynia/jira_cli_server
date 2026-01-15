import { prisma } from './db';
import * as JiraService from './jira';
const TARGET_GROUP_SUFFIX = 'group_user';

export const syncAssignee = async (projectKey: string, issueKey: string, currentAssigneeAccountId: string | null) => {
    const targetGroupName = `${projectKey}${TARGET_GROUP_SUFFIX}`;

    try {
        // 1. Get current assignee from DB
        const dbAssignee = await prisma.assignee.findFirst({
            where: { issueKey }
        });

        // 2. If same as current, do nothing
        if (dbAssignee?.accountId === currentAssigneeAccountId) {
            return;
        }

        // 3. Handle old assignee (if exists and changed)
        if (dbAssignee) {
            const oldAccountId = dbAssignee.accountId;
            await prisma.assignee.delete({ where: { id: dbAssignee.id } });

            // Check if user has other assignments in this project
            const otherTasksCount = await prisma.assignee.count({
                where: { projectKey, accountId: oldAccountId }
            });

            if (otherTasksCount === 0) {
                try {
                    await JiraService.removeUserFromGroup(oldAccountId, targetGroupName);
                    console.log(`[AssigneeService] Removed ${oldAccountId} from Group ${targetGroupName} (No more tasks)`);
                } catch (e) {
                    console.error(`[AssigneeService] Failed to remove ${oldAccountId} from Group ${targetGroupName}:`, e);
                }
            }
        }

        // 4. Handle new assignee
        if (currentAssigneeAccountId) {
            await prisma.assignee.create({
                data: {
                    issueKey,
                    projectKey,
                    accountId: currentAssigneeAccountId
                }
            });

            try {
                await JiraService.addUserToGroup(currentAssigneeAccountId, targetGroupName);
                console.log(`[AssigneeService] Added ${currentAssigneeAccountId} to Group ${targetGroupName}`);
            } catch (e) {
                console.error(`[AssigneeService] Failed to add ${currentAssigneeAccountId} to Group ${targetGroupName}:`, e);
            }
        }

    } catch (error) {
        console.error(`[AssigneeService] Error syncing assignee for ${issueKey}:`, error);
        throw error;
    }
};
