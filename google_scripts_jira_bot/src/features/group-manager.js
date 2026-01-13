/**
 * features/group-manager.js
 * Logic for managing Jira groups.
 */

/**
 * Handle the "Add User to Group" action.
 * @param {string} email - User email address
 * @param {string} groupName - Target group name
 */
function addUserToGroupAction(email, groupName) {
    if (!email || !groupName) {
        throw new Error("Missing email or groupName");
    }

    const client = new JiraClient();

    // 1. Resolve User
    console.log(`[GroupManager] Looking up user: ${email}`);
    const user = client.findUserByEmail(email);

    if (!user || !user.accountId) {
        throw new Error(`User not found: ${email}`);
    }

    // 2. Add to Group
    console.log(`[GroupManager] Adding ${user.accountId} to group ${groupName}`);
    const result = client.addUserToGroup(user.accountId, groupName);

    return {
        success: true,
        message: `Added user ${email} to group ${groupName}`,
        data: result
    };
}
