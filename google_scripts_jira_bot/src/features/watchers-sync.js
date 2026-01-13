/**
 * features/watchers-sync.js
 * Logic to sync users from a "Watchers" custom field to a project-specific group.
 * Replicates the logic of the provided Groovy script.
 */

const WATCHERS_FIELD_ID = "customfield_10170"; // From user's script

/**
 * Sync watchers to group based on webhook payload
 * @param {Object} data - The webhook JSON payload
 */
function syncWatchersToGroup(data) {
    const issue = data.issue;
    const eventType = data.issue_event_type_name;
    const changelog = data.changelog;

    if (!issue || !issue.fields || !issue.key) {
        return { status: "ignored", message: "No issue data found" };
    }

    const projectKey = issue.fields.project.key; // e.g. "PROJ"
    // Group name format: <ProjectKey>group_watchers
    const targetGroupName = `${projectKey}group_watchers`;

    let accountIdsToAdd = new Set();

    console.log(`[WatchersSync] Event: ${eventType} for ${issue.key}`);

    // 1. Handle Issue Created (Sync all values in field)
    if (eventType === "issue_created") {
        const fieldVal = issue.fields[WATCHERS_FIELD_ID];
        if (Array.isArray(fieldVal)) {
            fieldVal.forEach(user => {
                if (user.accountId) accountIdsToAdd.add(user.accountId);
            });
        }
        console.log(`[WatchersSync] Issue Created. Found ${accountIdsToAdd.size} users.`);
    }

    // 2. Handle Issue Updated (Check changelog for validation)
    // Logic: Only add users who were ADDED to the field.
    else if (eventType === "issue_updated" || eventType === "issue_generic") {
        if (changelog && changelog.items) {
            const watchersItem = changelog.items.find(item => item.fieldId === WATCHERS_FIELD_ID);

            if (watchersItem) {
                let rawTo = watchersItem.to;
                if (rawTo) {
                    const parts = String(rawTo).replace(/[\[\]]/g, '').split(',');
                    parts.forEach(p => {
                        const trimmed = p.trim();
                        if (trimmed) accountIdsToAdd.add(trimmed);
                    });
                }
                console.log(`[WatchersSync] Field Updated. Found ${accountIdsToAdd.size} users in new value.`);
            }
        }
    }

    if (accountIdsToAdd.size === 0) {
        return { status: "skipped", message: "No watchers to add found in payload." };
    }

    // 3. Add Users to Group
    const client = new JiraClient();
    const results = [];

    // --- Ensure Group has "Watchers" Role ---
    try {
        const roleName = "Watchers";
        const roleUrl = client.getProjectRoleUrl(projectKey, roleName);

        if (roleUrl) {
            const roleDetails = client.getRoleDetails(roleUrl);
            const isGroupInRole = (roleDetails.actors || []).some(
                actor => actor.type === 'atlassian-group-role-actor' && actor.name === targetGroupName
            );

            if (!isGroupInRole) {
                console.log(`[WatchersSync] Group ${targetGroupName} not in role ${roleName}. Adding...`);
                // Ensure group exists first (idempotent creation)
                try { client.createGroup(targetGroupName); } catch (e) { }

                client.addGroupToProjectRole(roleUrl, targetGroupName);
                console.log(`[WatchersSync] Added ${targetGroupName} to role ${roleName}`);
            } else {
                console.log(`[WatchersSync] Group ${targetGroupName} already in role ${roleName}`);
            }
        } else {
            console.warn(`[WatchersSync] Role '${roleName}' not found in project ${projectKey}`);
        }
    } catch (e) {
        console.error(`[WatchersSync] Failed to sync role: ${e.message}`);
    }
    // ----------------------------------------

    accountIdsToAdd.forEach(accountId => {
        console.log(`[WatchersSync] Adding ${accountId} to ${targetGroupName}`);

        try {
            client.addUserToGroup(accountId, targetGroupName);
            results.push({ accountId, success: true });
        } catch (e) {
            // Check if error is due to missing group
            // API usually returns 404 or specific message
            const isGroupMissing = e.message.includes("404") || e.message.toLowerCase().includes("group does not exist");

            if (isGroupMissing) {
                console.warn(`[WatchersSync] Group ${targetGroupName} missing. Creating it...`);
                try {
                    client.createGroup(targetGroupName);
                    // Retry add
                    console.log(`[WatchersSync] Retrying add ${accountId} to ${targetGroupName}`);
                    client.addUserToGroup(accountId, targetGroupName);
                    results.push({ accountId, success: true, retry: true });
                } catch (createErr) {
                    console.error(`[WatchersSync] Failed to create group or add user: ${createErr.message}`);
                    results.push({ accountId, success: false, error: createErr.message });
                }
            } else {
                console.warn(`[WatchersSync] Failed to add ${accountId}: ${e.message}`);
                results.push({ accountId, success: false, error: e.message });
            }
        }
    });

    return {
        status: "success",
        message: `Processed ${accountIdsToAdd.size} users for group ${targetGroupName}`,
        details: results
    };
}
