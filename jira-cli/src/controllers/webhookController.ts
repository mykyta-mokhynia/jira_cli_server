import { Request, Response } from 'express';
import * as JiraService from '../services/jira';

const WATCHERS_FIELD_ID = "customfield_10170"; // Change if needed based on user config

export const handleIssueWebhook = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const issue = data.issue;
        const eventType = data.issue_event_type_name;
        const changelog = data.changelog;

        if (!issue || !issue.fields || !issue.key) {
            console.log('Ignored webhook: No issue data');
            res.status(200).send('Ignored');
            return;
        }

        const projectKey = issue.fields.project.key;
        const targetGroupName = `${projectKey}group_watchers`;
        // const watchersRoleId = 10002; // Example ID, we should find by name "Watchers"

        console.log(`[Webhook] Event: ${eventType} for ${issue.key}`);

        let accountIdsToAdd: Set<string> = new Set();

        // 1. Handle Issue Created
        if (eventType === 'issue_created') {
            const fieldVal = issue.fields[WATCHERS_FIELD_ID];
            if (Array.isArray(fieldVal)) {
                fieldVal.forEach((user: any) => {
                    if (user.accountId) accountIdsToAdd.add(user.accountId);
                });
            }
        }
        // 2. Handle Issue Updated
        else if (eventType === 'issue_updated' || eventType === 'issue_generic') {
            if (changelog && changelog.items) {
                const watchersItem = changelog.items.find((item: any) => item.fieldId === WATCHERS_FIELD_ID);
                if (watchersItem) {
                    let rawTo = watchersItem.to; // The 'to' field usually contains the raw value or array
                    // Jira Webhook changelog for multi-user picker 'to' is usually null/string? 
                    // 'toString' often has display names, 'to' might be keys.
                    // But looking at previous code, it parses `rawTo`.
                    // Actually, for multi-select, it might be granular additions?
                    // Let's stick to previous logic:
                    if (rawTo) {
                        // Previous logic: String(rawTo).split(',')
                        const parts = String(rawTo).replace(/[\[\]]/g, '').split(',');
                        parts.forEach(p => {
                            const trimmed = p.trim();
                            if (trimmed) accountIdsToAdd.add(trimmed);
                        });
                    }
                }
            }
        }

        if (accountIdsToAdd.size === 0) {
            console.log('[Webhook] No watchers to add.');
            res.status(200).send('No changes');
            return;
        }

        // 3. Process Sync
        // Ensure Group Exists (Idempotent check by trying to create and ignoring error, or check existence?)
        // Jira API doesn't have "check group exists" easily without error. 
        // We will try to create it if we hit a 404 later, or just try to create it now.
        // Best approach: try to get group or create.
        // Since we don't have getGroup, let's just try creation in a catch block or try adding user and catch 404.

        // Let's follow the previous logic: Try adding to role, if role doesn't have it, ensure group exists.

        // Find Watchers Role ID
        const roleName = "Watchers";
        const role = await JiraService.getProjectRoleByName(projectKey, roleName);

        if (role) {
            // Check if group is in role?
            // Since API to get role details might be expensive, we can just try adding it.
            // But we need to ensure group exists first.

            // Try creating group first (swallow error if exists)
            try {
                await JiraService.createGroup(targetGroupName);
                console.log(`[Webhook] Created group ${targetGroupName}`);
            } catch (e: any) {
                // Ignore if group already exists
            }

            // Add group to role
            try {
                await JiraService.addGroupToProjectRole(projectKey, role.id, targetGroupName);
                console.log(`[Webhook] Added ${targetGroupName} to role ${roleName}`);
            } catch (e) {
                console.error(`[Webhook] Failed to add group to role:`, e);
            }

        } else {
            console.warn(`[Webhook] Role ${roleName} not found in project ${projectKey}`);
        }

        // Add Users to Group
        for (const accountId of accountIdsToAdd) {
            try {
                await JiraService.addUserToGroup(accountId, targetGroupName);
                console.log(`[Webhook] Added ${accountId} to ${targetGroupName}`);
            } catch (e: any) {
                console.error(`[Webhook] Failed to add user ${accountId}:`, e);
            }
        }

        res.status(200).send('Processed');

    } catch (error: any) {
        console.error('[Webhook] Error processing:', error);
        res.status(500).send('Error');
    }
};
