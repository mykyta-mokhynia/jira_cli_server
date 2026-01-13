/**
 * webhook-handler.js
 * Main entry point for Jira Webhooks.
 */

function doPost(e) {
    try {
        if (!e || !e.postData) {
            return _jsonResponse({ status: "error", message: "No post data received" });
        }

        const jsonString = e.postData.contents;
        console.log("Webhook received:", jsonString);

        let data;
        try {
            data = JSON.parse(jsonString);
        } catch (err) {
            return _jsonResponse({ status: "error", message: "Invalid JSON format" });
        }

        // --- Router Logic ---
        // Decide what to do based on payload content.

        // Case 1: Direct "Add User to Group" command
        // Expected Payload: { "action": "addUserToGroup", "email": "...", "groupName": "..." }
        // Case 1: Direct "Add User to Group" command
        if (data.action === "addUserToGroup") {
            const result = addUserToGroupAction(data.email, data.groupName);
            return _jsonResponse(result);
        }

        // Case 1.5: Run One-Time Script
        // Expected Payload: { "action": "runScript", "name": "echo", "params": { ... } }
        if (data.action === "runScript") {
            const result = outputScriptResult(data.name, data.params);
            return _jsonResponse(result);
        }

        // Case 2: Flexible/Legacy payload handling
        // If just email and groupName are present, assume add user
        if (data.email && data.groupName) {
            const result = addUserToGroupAction(data.email, data.groupName);
            return _jsonResponse(result);
        }

        // Case 3: Jira Issue Event (e.g. Issue Transition, Created, Updated)
        // We check for event keys or changelog to decide.
        if (data.issue_event_type_name === 'issue_created' ||
            data.issue_event_type_name === 'issue_updated' ||
            data.issue_event_type_name === 'issue_generic') {

            // Route to Watchers Sync
            const result = syncWatchersToGroup(data);
            return _jsonResponse(result);
        }

        // Catch-all for other issue events if needed
        if (data.issue) {
            return _jsonResponse({ status: "ignored", message: "Issue event received but not processed." });
        }

        return _jsonResponse({ status: "ignored", message: "Unknown payload structure" });

    } catch (err) {
        console.error("Handler Error:", err);
        return _jsonResponse({ status: "error", message: err.toString() });
    }
}

/**
 * Helper to return JSON ContentService
 */
function _jsonResponse(obj) {
    return ContentService.createTextOutput(JSON.stringify(obj))
        .setMimeType(ContentService.MimeType.JSON);
}
