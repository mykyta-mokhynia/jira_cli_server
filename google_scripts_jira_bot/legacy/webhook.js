// webhook.js - Handles incoming Webhook events from Jira

/**
 * Handle POST requests (Webhooks)
 * To use this:
 * 1. Deploy as Web App
 * 2. Set "Execute as: Me"
 * 3. Set "Who has access: Anyone" or "Anyone with Google Account" (depending on Jira's ability to auth, usually "Anyone" for simple webhooks)
 */
function doPost(e) {
    try {
        if (!e || !e.postData || !e.postData.contents) {
            return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "No data" }))
                .setMimeType(ContentService.MimeType.JSON);
        }

        const data = JSON.parse(e.postData.contents);

        // Log the incoming hook (optional, good for debugging)
        console.log("Received Webhook:", JSON.stringify(data));

        // Example logic: Check for a specific transition or event
        // You can customize this based on what Jira sends.
        // For "Add User to Group", we might expect the webhook to come from a Transition
        // and we might look for a custom field or simply the user in the issue.

        // For this example, let's assume we want to add the Reporter or Assignee to a group
        // OR the webhook is triggered by a specific automation rule that sends a custom JSON body like:
        // { "email": "user@example.com", "groupName": "jira-software-users" }

        let result = {};

        if (data.email && data.groupName) {
            // Direct mode (e.g. from Jira Automation "Send Web Request")
            result = addUserToGroup(data.email, data.groupName);

        } else if (data.issue && data.issue.fields) {
            // Issue Event mode (e.g. "issue_updated")
            // Example: Add assignee to "jira-developers" when moved to "In Progress"
            // This is just a placeholder example logic:
            /*
            const issue = data.issue;
            const assignee = issue.fields.assignee;
            if (assignee && assignee.emailAddress) {
               result = addUserToGroup(assignee.emailAddress, "jira-developers");
            }
            */
            result = { status: "ignored", message: "Issue event received but no logic defined yet." };
        } else {
            result = { status: "ignored", message: "Unknown payload format" };
        }

        return ContentService.createTextOutput(JSON.stringify(result))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (err) {
        console.error("Error in doPost:", err);
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * Add a user to a Jira group
 * @param {string} email - Content of the user
 * @param {string} groupName - Name of the group
 */
function addUserToGroup(email, groupName) {
    console.log(`Attempting to add ${email} to ${groupName}`);

    // 1. Resolve User to Account ID (Jira Cloud needs Account ID)
    // We can search for the user by email first
    const user = resolveUserByEmail_(email);
    if (!user || !user.accountId) {
        return { status: "error", message: `User with email ${email} not found` };
    }

    // 2. Add to Group
    try {
        // API: POST /rest/api/3/group/user?groupname=...
        // Body: { "accountId": "..." }
        const response = jiraFetch_("/rest/api/3/group/user", { groupname: groupName }, {
            method: "post",
            payload: { accountId: user.accountId }
        });

        return { status: "success", message: `Added ${email} to ${groupName}`, data: response };
    } catch (e) {
        console.error("Failed to add user to group:", e);
        return { status: "error", message: e.message };
    }
}

/**
 * Helper to find user by email since config.js only has resolveUserByAccountId_
 * This uses the user search API
 */
function resolveUserByEmail_(email) {
    try {
        // Search for user
        const users = jiraFetch_("/rest/api/3/user/search", { query: email });
        if (users && users.length > 0) {
            // Return the first match (exact match preference logic could be added)
            return {
                accountId: users[0].accountId,
                email: users[0].emailAddress,
                displayName: users[0].displayName
            };
        }
        return null;
    } catch (e) {
        console.error("Error searching user:", e);
        return null;
    }
}
