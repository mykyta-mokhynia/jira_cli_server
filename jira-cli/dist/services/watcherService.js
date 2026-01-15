"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncWatchers = void 0;
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const JiraService = __importStar(require("./jira"));
const connectionString = process.env.DATABASE_URL;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
const GROUP_SUFFIX = 'group_watchers';
const WATCHERS_ROLE_NAME = 'Watchers';
const syncWatchers = async (projectKey, issueKey, currentWatcherAccountIds) => {
    const targetGroupName = `${projectKey}${GROUP_SUFFIX}`;
    try {
        // 1. Get previous watchers for this issue from DB
        const previousWatchers = await prisma.watcher.findMany({
            where: { issueKey }
        });
        const previousAccountIds = new Set(previousWatchers.map(w => w.accountId));
        // 2. Determine Added and Removed users for THIS issue
        const addedUsers = [...currentWatcherAccountIds].filter(id => !previousAccountIds.has(id));
        const removedUsers = [...previousAccountIds].filter(id => !currentWatcherAccountIds.has(id));
        console.log(`[WatcherService] Issue ${issueKey}: Added: ${addedUsers.length}, Removed: ${removedUsers.length}`);
        // --- PHASE 1: Handle Additions ---
        if (addedUsers.length > 0) {
            // Ensure Group and Role exist (Idempotent-ish check)
            await ensureGroupAndRole(projectKey, targetGroupName);
            for (const accountId of addedUsers) {
                // Add to DB
                await prisma.watcher.create({
                    data: { issueKey, projectKey, accountId }
                });
                // Add to Jira Group
                try {
                    await JiraService.addUserToGroup(accountId, targetGroupName);
                    console.log(`[WatcherService] Added ${accountId} to Jira Group ${targetGroupName}`);
                }
                catch (e) {
                    console.error(`[WatcherService] Failed to add ${accountId} to Jira group:`, e);
                }
            }
        }
        // --- PHASE 2: Handle Removals ---
        for (const accountId of removedUsers) {
            // Remove from DB for THIS issue
            await prisma.watcher.deleteMany({
                where: {
                    issueKey: issueKey,
                    accountId: accountId
                }
            });
            // Check if user is watching ANY other issue in this project
            const otherIssuesCount = await prisma.watcher.count({
                where: {
                    projectKey: projectKey,
                    accountId: accountId
                }
            });
            if (otherIssuesCount === 0) {
                // User is not watching any other issues -> Remove from Jira Group
                try {
                    await JiraService.removeUserFromGroup(accountId, targetGroupName);
                    console.log(`[WatcherService] Removed ${accountId} from Jira Group ${targetGroupName} (No active watches)`);
                }
                catch (e) {
                    console.error(`[WatcherService] Failed to remove ${accountId} from Jira group:`, e);
                }
            }
            else {
                console.log(`[WatcherService] User ${accountId} removed from ${issueKey} but still watches ${otherIssuesCount} other issues. Kept in group.`);
            }
        }
    }
    catch (error) {
        console.error(`[WatcherService] Error syncing watchers for ${issueKey}:`, error);
        throw error;
    }
};
exports.syncWatchers = syncWatchers;
const ensureGroupAndRole = async (projectKey, groupName) => {
    // 1. Create Group if missing
    try {
        await JiraService.createGroup(groupName);
    }
    catch (e) {
        // Ignore "group already exists" errors
    }
    // 2. Add Group to Role
    try {
        const role = await JiraService.getProjectRoleByName(projectKey, WATCHERS_ROLE_NAME);
        if (role) {
            // We can just try adding it, assuming it handles "already added" gracefully or we catch it
            await JiraService.addGroupToProjectRole(projectKey, role.id, groupName);
        }
        else {
            console.warn(`[WatcherService] Role ${WATCHERS_ROLE_NAME} not found via name lookup.`);
        }
    }
    catch (e) {
        // Ignore if already in role
    }
};
