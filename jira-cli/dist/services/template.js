"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyProjectTemplate = exports.auditProject = void 0;
const jira_1 = require("./jira");
const auditProject = async (projectKey, projectType) => {
    // 1. Define Template Groups
    const templateGroups = [
        `${projectKey}group`,
        `${projectKey}group_admin`,
        `${projectKey}group_executor`,
        `${projectKey}group_user`,
        `${projectKey}group_watchers`,
        'audit',
        'org-admins'
    ];
    // 2. Check Groups
    // Search for project specific groups
    const projectGroupsSearch = await jira_1.jira.groups.findGroups({ query: projectKey });
    const projectGroupsList = projectGroupsSearch.groups || projectGroupsSearch || [];
    const projectGroupNames = projectGroupsList.map((g) => g.name || '');
    const existingGroupNames = [];
    // Check strict existence for each template group
    // This is safer because global groups like 'org-admins' won't match 'query: projectKey'
    for (const tg of templateGroups) {
        if (projectGroupNames.includes(tg)) {
            existingGroupNames.push(tg);
        }
        else {
            // Fallback search for specific group if not found in project prefix search
            // or if it is a global group
            const exactSearch = await jira_1.jira.groups.findGroups({ query: tg });
            const exactList = exactSearch.groups || exactSearch || [];
            if (exactList.some((g) => g.name === tg)) {
                existingGroupNames.push(tg);
            }
        }
    }
    const missingGroups = templateGroups.filter(tg => !existingGroupNames.includes(tg));
    const existingTemplateGroups = templateGroups.filter(tg => existingGroupNames.includes(tg));
    // 3. Check Schemes
    const project = await jira_1.jira.projects.getProject({
        projectIdOrKey: projectKey,
        expand: 'issueSecurityScheme,permissionScheme'
    });
    console.log(`[Audit] Project Fetched Keys:`, Object.keys(project));
    console.log(`[Audit] Project Style:`, project.style);
    // Fallback: Fetch Permission Scheme and Security Scheme explicitly
    if (!project.permissionScheme) {
        try {
            const permSchemeResponse = await jira_1.jira.projectPermissionSchemes.getAssignedPermissionScheme({ projectKeyOrId: projectKey });
            if (permSchemeResponse) {
                project.permissionScheme = permSchemeResponse;
            }
        }
        catch (e) {
            console.log(`[Audit] Could not fetch assigned permission scheme separately.`);
        }
    }
    if (!project.issueSecurityScheme) {
        try {
            const secSchemeResponse = await jira_1.jira.projectPermissionSchemes.getProjectIssueSecurityScheme({ projectKeyOrId: projectKey });
            // Check correct response mapping. Typically returns SecurityScheme directly or wrapped?
            // Based on types, it returns SecurityScheme directly or inside? Let's assume standard response.
            if (secSchemeResponse) {
                project.issueSecurityScheme = secSchemeResponse;
            }
        }
        catch (e) {
            // console.log(`[Audit] Could not fetch assigned security scheme separately:`, e); 
            // Silent catch to avoid noise if 404
        }
    }
    console.log(`[Audit] Project ${projectKey} fetched. PermScheme:`, project.permissionScheme ? project.permissionScheme.name : 'Missing');
    console.log(`[Audit] SecurityScheme:`, project.issueSecurityScheme ? project.issueSecurityScheme.name : 'Missing');
    // Permission Scheme
    const currentPermSchemeName = project.permissionScheme ? project.permissionScheme.name : 'Default Permission Scheme';
    const targetPermSchemeName = projectKey.toUpperCase(); // Requirement: {PROJECT_KEY} (UPPERCASE)
    let permAction = 'create-copy';
    if (currentPermSchemeName === targetPermSchemeName) {
        permAction = 'ok';
    }
    else {
        // Check if target exists? (Additional API call, acceptable for audit)
        // We will assume if it's not current, we might need to link or create.
        // For simple audit, just showing mismatch is enough. Logic in Apply will be robust.
        // Let's verify if scheme exists to provide better "action"
        const schemes = await jira_1.jira.permissionSchemes.getAllPermissionSchemes();
        const targetExists = schemes.permissionSchemes?.some((s) => s.name === targetPermSchemeName);
        if (targetExists)
            permAction = 'link-existing';
    }
    // Security Scheme
    const currentSecSchemeName = project.issueSecurityScheme ? project.issueSecurityScheme.name : 'None';
    let targetSecSchemeName = '';
    if (projectType === 'non-team') {
        targetSecSchemeName = 'R_A_W';
    }
    else {
        targetSecSchemeName = `${projectKey.toUpperCase()}`; // Requirement: Renamed to {PROJECT_KEY}
    }
    let secAction = 'create-copy';
    if (currentSecSchemeName === targetSecSchemeName) {
        secAction = 'ok';
    }
    else {
        // Similar check for existence (Harder for Security Schemes, no simple search usually? getAllIssueSecuritySchemes exists)
        const secSchemes = await jira_1.jira.issueSecuritySchemes.getIssueSecuritySchemes();
        const targetSecExists = secSchemes.issueSecuritySchemes?.some(s => s.name === targetSecSchemeName);
        if (targetSecExists)
            secAction = 'link-existing';
    }
    return {
        projectKey,
        groups: {
            missing: missingGroups,
            existing: existingTemplateGroups,
            incorrect: []
        },
        permissionScheme: {
            current: currentPermSchemeName,
            target: targetPermSchemeName,
            action: permAction
        },
        securityScheme: {
            current: currentSecSchemeName,
            target: targetSecSchemeName,
            action: secAction
        }
    };
};
exports.auditProject = auditProject;
const applyProjectTemplate = async (projectKey, projectType) => {
    // 1. Create Groups
    const templateGroups = [
        `${projectKey}group`,
        `${projectKey}group_admin`,
        `${projectKey}group_executor`,
        `${projectKey}group_user`,
        `${projectKey}group_watchers`,
        'audit',
        'org-admins'
    ];
    for (const groupName of templateGroups) {
        // Skip specific global groups creation if logic dictates, but generally createGroup handles 'exists' error gracefuly?
        // Actually, user said org-admins exists 100%. We should NOT try to create it to be safe.
        // Let's rely on check.
        if (groupName === 'org-admins' || groupName === 'audit') {
            continue; // Assume they exist, or at least don't auto-create global system groups via this script
        }
        try {
            // Check existence first
            const groupSearch = await jira_1.jira.groups.findGroups({ query: groupName });
            const groupsList = groupSearch.groups || groupSearch || [];
            const exists = groupsList.some((g) => g.name === groupName);
            if (!exists) {
                await jira_1.jira.groups.createGroup({ name: groupName });
                console.log(`Created group: ${groupName}`);
            }
        }
        catch (e) {
            console.warn(`Error ensuring group ${groupName}:`, e);
        }
    }
    const roleMapping = {
        [`${projectKey}group`]: 'Service Desk Team',
        [`${projectKey}group_admin`]: 'Administrators',
        [`${projectKey}group_executor`]: 'Executor',
        [`${projectKey}group_user`]: 'User',
        [`${projectKey}group_watchers`]: 'Watchers',
        'audit': 'Viewer',
        'org-admins': 'Administrators'
    };
    // Get all project roles
    const projectRoles = await jira_1.jira.projectRoles.getProjectRoles({ projectIdOrKey: projectKey });
    // projectRoles is { "Role Name": "URL" }
    for (const [groupName, roleName] of Object.entries(roleMapping)) {
        if (!projectRoles[roleName]) {
            console.warn(`Role '${roleName}' not found in project ${projectKey}. Skipping group assignment.`);
            continue;
        }
        // URL format: .../role/10002
        const parts = projectRoles[roleName].split('/');
        const roleId = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(roleId)) {
            try {
                await jira_1.jira.projectRoleActors.addActorUsers({
                    projectIdOrKey: projectKey,
                    id: roleId,
                    group: [groupName]
                });
                console.log(`Assigned ${groupName} to role ${roleName}`);
            }
            catch (e) {
                const errorMsg = e?.response?.data?.errorMessages?.[0] || '';
                if (errorMsg.includes('already a member')) {
                    console.log(`[Info] ${groupName} is already a member of ${roleName}. Skipping.`);
                }
                else {
                    console.error(`Failed to assign ${groupName} to ${roleName}`, e?.response?.data || e.message);
                }
            }
        }
    }
    // 2. Permission Scheme
    const targetPermSchemeName = projectKey.toUpperCase();
    let targetPermSchemeId;
    // Check if target exists
    const permSchemes = await jira_1.jira.permissionSchemes.getAllPermissionSchemes();
    const existingPermScheme = permSchemes.permissionSchemes?.find((s) => s.name === targetPermSchemeName);
    if (existingPermScheme) {
        targetPermSchemeId = existingPermScheme.id;
    }
    else {
        // Create new scheme
        const newScheme = await jira_1.jira.permissionSchemes.createPermissionScheme({
            name: targetPermSchemeName,
            description: `Generated for project ${projectKey}`
        });
        targetPermSchemeId = newScheme.id;
    }
    if (targetPermSchemeId) {
        await jira_1.jira.projects.updateProject({
            projectIdOrKey: projectKey,
            permissionScheme: targetPermSchemeId
        });
    }
    // 3. Security Scheme
    let targetSecSchemeName = '';
    if (projectType === 'non-team') {
        targetSecSchemeName = 'R_A_W';
    }
    else {
        targetSecSchemeName = `${projectKey.toUpperCase()}`;
    }
    // Find existing security scheme
    const secSchemes = await jira_1.jira.issueSecuritySchemes.getIssueSecuritySchemes();
    const targetSecScheme = secSchemes.issueSecuritySchemes?.find((s) => s.name === targetSecSchemeName);
    if (targetSecScheme) {
        await jira_1.jira.projects.updateProject({
            projectIdOrKey: projectKey,
            issueSecurityScheme: targetSecScheme.id
        });
    }
    else {
        console.warn(`Security Scheme ${targetSecSchemeName} not found. Available schemes:`, secSchemes.issueSecuritySchemes?.map(s => s.name));
        console.warn(`Skipping assignment.`);
    }
    // 4. User Migration & Cleanup
    await migrateUsersAndCleanup(jira_1.jira, projectKey, roleMapping, templateGroups);
    return { success: true, projectKey, projectType };
};
exports.applyProjectTemplate = applyProjectTemplate;
const migrateUsersAndCleanup = async (jira, projectKey, roleMapping, templateGroups) => {
    console.log(`[Migration] Starting User Migration & Cleanup for ${projectKey}...`);
    const usersToMigrate = new Map();
    const alienGroupsToRemove = [];
    const alienUsersToRemove = [];
    const visitedRoles = new Set();
    // Role Hierarchy (Lower number = Higher priority)
    // Only Service Desk Team and User/Service Desk Customers undergo user migration.
    const ROLE_PRIORITY = {
        'Service Desk Team': 1,
        'User': 2,
        'Service Desk Customers': 2
    };
    // Target Groups for each priority
    const PRIORITY_TARGET_GROUP = {
        1: `${projectKey}group`,
        2: `${projectKey}group_user`
    };
    // 1. Scan Roles
    const projectRoles = await jira.projectRoles.getProjectRoles({ projectIdOrKey: projectKey });
    for (const roleName of Object.values(roleMapping)) {
        if (visitedRoles.has(roleName))
            continue;
        visitedRoles.add(roleName);
        if (!projectRoles[roleName])
            continue;
        const parts = projectRoles[roleName].split('/');
        const roleIdIndex = parts.length - 1;
        const roleId = parseInt(parts[roleIdIndex], 10);
        if (isNaN(roleId))
            continue;
        try {
            const roleDetails = await jira.projectRoles.getProjectRole({ projectIdOrKey: projectKey, id: roleId });
            const currentActors = roleDetails.actors || [];
            for (const actor of currentActors) {
                const actorType = actor.type;
                const name = actor.name;
                const actorUser = actor.actorUser;
                if (actorType === 'atlassian-group-role-actor') {
                    if (!name)
                        continue;
                    // Identify Alien Group
                    if (!templateGroups.includes(name)) {
                        if (name === 'org-admins' || name === 'audit')
                            continue;
                        console.log(`[Migration] Found Alien Group: ${name} in role ${roleName}`);
                        alienGroupsToRemove.push({ groupName: name, roleId, roleName });
                        // Fetch members to migrate
                        try {
                            const membersResult = await jira.groups.getUsersFromGroup({ groupname: name });
                            const members = membersResult.values || membersResult || [];
                            for (const user of members) {
                                if (!user.accountId || user.accountType === 'app')
                                    continue;
                                const currentPriority = ROLE_PRIORITY[roleName] || 100;
                                updateHighestRole(usersToMigrate, user.accountId, currentPriority);
                            }
                        }
                        catch (e) {
                            console.warn(`[Migration] Failed to get members of ${name}`, e);
                        }
                    }
                }
                else if (actorType === 'atlassian-user-role-actor') {
                    // Individual User
                    const accountId = actorUser?.accountId;
                    if (accountId) {
                        console.log(`[Migration] Found Individual User: ${accountId} in role ${roleName}`);
                        alienUsersToRemove.push({ accountId, roleId, roleName });
                        const currentPriority = ROLE_PRIORITY[roleName] || 100;
                        updateHighestRole(usersToMigrate, accountId, currentPriority);
                    }
                }
            }
        }
        catch (e) {
            console.warn(`[Migration] Error scanning role ${roleName}`, e);
        }
    }
    // 2. Filter org-admins
    const orgAdmins = new Set();
    try {
        const oaMembers = await jira.groups.getUsersFromGroup({ groupname: 'org-admins' });
        (oaMembers.values || []).forEach((u) => {
            if (u.accountId)
                orgAdmins.add(u.accountId);
        });
    }
    catch (e) {
        console.warn('Could not fetch org-admins, proceeding without filtering');
    }
    // 3. Migrate Users
    for (const [accountId, data] of usersToMigrate) {
        if (orgAdmins.has(accountId)) {
            console.log(`[Migration] Skipping migration for user ${accountId} (is org-admin)`);
            continue;
        }
        const targetGroup = PRIORITY_TARGET_GROUP[data.highestRole];
        if (!targetGroup) {
            console.warn(`[Migration] No target group for role priority ${data.highestRole} (User ${accountId})`);
            continue;
        }
        try {
            await jira.groups.addUserToGroup({ groupname: targetGroup, accountId });
            console.log(`[Migration] Added user ${accountId} to ${targetGroup}`);
        }
        catch (e) {
            const msg = e?.response?.data?.errorMessages?.[0] || '';
            if (!msg.includes('already a member')) {
                console.warn(`[Migration] Failed to add user ${accountId} to ${targetGroup}`, msg);
            }
        }
    }
    // 4. Cleanup
    // 4.1 Remove Alien Groups
    for (const item of alienGroupsToRemove) {
        try {
            await jira.projectRoleActors.deleteActor({
                projectIdOrKey: projectKey,
                id: item.roleId,
                group: item.groupName
            });
            console.log(`[Migration] Removed group ${item.groupName} from role ${item.roleName}`);
        }
        catch (e) {
            console.warn(`[Migration] Failed to remove group ${item.groupName} from role ${item.roleName}`, e);
        }
    }
    // 4.2 Remove Individual Users
    for (const item of alienUsersToRemove) {
        try {
            await jira.projectRoleActors.deleteActor({
                projectIdOrKey: projectKey,
                id: item.roleId,
                user: item.accountId
            });
            console.log(`[Migration] Removed user ${item.accountId} from role ${item.roleName}`);
        }
        catch (e) {
            console.warn(`[Migration] Failed to remove user ${item.accountId} from role ${item.roleName}`, e);
        }
    }
    console.log(`[Migration] Completed for ${projectKey}`);
};
function updateHighestRole(map, accountId, priority) {
    if (map.has(accountId)) {
        const existing = map.get(accountId);
        if (priority < existing.highestRole) {
            map.set(accountId, { accountId, highestRole: priority });
        }
    }
    else {
        map.set(accountId, { accountId, highestRole: priority });
    }
}
