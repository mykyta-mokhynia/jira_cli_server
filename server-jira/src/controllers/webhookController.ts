import { Request, Response } from 'express';
import * as WatcherService from '../services/watcherService';
import * as AssigneeService from '../services/assigneeService';
import * as JiraService from '../services/jira';

const WATCHERS_FIELD_ID = process.env.WATCHERS_FIELD_ID || "customfield_10170";

export const handleIssueWebhook = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const issue = data.issue;
        const eventType = data.issue_event_type_name;

        if (!issue || !issue.fields || !issue.key) {
            res.status(200).send('Ignored: No issue data');
            return;
        }

        const projectKey = issue.fields.project.key;
        const interestedEvents = ['issue_created', 'issue_updated', 'issue_generic'];

        if (!interestedEvents.includes(eventType)) {
            res.status(200).send('Ignored event type');
            return;
        }

        console.log(`[Webhook] Processing ${eventType} for ${issue.key}`);

        // 1. Sync Watchers
        const fieldVal = issue.fields[WATCHERS_FIELD_ID];
        const currentWatcherAccountIds = new Set<string>();

        if (Array.isArray(fieldVal)) {
            fieldVal.forEach((user: any) => {
                if (user.accountId) currentWatcherAccountIds.add(user.accountId);
            });
        }

        await WatcherService.syncWatchers(projectKey, issue.key, currentWatcherAccountIds);

        // 2. Sync Assignee (Full sync with DB tracking)
        const assignee = issue.fields.assignee;
        const currentAssigneeAccountId = assignee?.accountId || null;

        await AssigneeService.syncAssignee(projectKey, issue.key, currentAssigneeAccountId);

        res.status(200).send('Processed');

    } catch (error: any) {
        console.error('[Webhook] Error processing:', error);
        res.status(500).send('Error');
    }
};
