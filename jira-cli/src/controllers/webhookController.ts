import { Request, Response } from 'express';
import * as WatcherService from '../services/watcherService';

const WATCHERS_FIELD_ID = "customfield_10170"; // Change if needed based on user config

export const handleIssueWebhook = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const issue = data.issue;
        const eventType = data.issue_event_type_name;
        // We use full details from 'issue', not just changelog, to get *current* state.
        // Webhook usually sends the full issue object with current field values.

        if (!issue || !issue.fields || !issue.key) {
            console.log('Ignored webhook: No issue data');
            res.status(200).send('Ignored');
            return;
        }

        const projectKey = issue.fields.project.key;

        // Filter events we care about
        const interestedEvents = ['issue_created', 'issue_updated', 'issue_generic'];
        if (!interestedEvents.includes(eventType)) {
            res.status(200).send('Ignored event type');
            return;
        }

        console.log(`[Webhook] Processing ${eventType} for ${issue.key}`);

        // Get CURRENT watchers from the issue payload
        const fieldVal = issue.fields[WATCHERS_FIELD_ID];
        const currentWatcherAccountIds = new Set<string>();

        if (Array.isArray(fieldVal)) {
            fieldVal.forEach((user: any) => {
                if (user.accountId) currentWatcherAccountIds.add(user.accountId);
            });
        }

        // Delegate to Service to diff with DB and sync
        await WatcherService.syncWatchers(projectKey, issue.key, currentWatcherAccountIds);

        res.status(200).send('Processed');

    } catch (error: any) {
        console.error('[Webhook] Error processing:', error);
        res.status(500).send('Error');
    }
};
