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
exports.updateIssue = exports.createIssue = exports.searchIssues = exports.getIssue = void 0;
const JiraService = __importStar(require("../services/jira"));
const getIssue = async (req, res) => {
    try {
        const { key } = req.params;
        const issue = await JiraService.getIssue(key);
        res.json(issue);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch issue' });
    }
};
exports.getIssue = getIssue;
const searchIssues = async (req, res) => {
    try {
        const { jql } = req.query;
        if (typeof jql !== 'string') {
            res.status(400).json({ error: 'JQL query parameter is required and must be a string' });
            return; // Explicit return to satisfy void
        }
        const results = await JiraService.searchIssues(jql);
        res.json(results);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to search issues' });
    }
};
exports.searchIssues = searchIssues;
const createIssue = async (req, res) => {
    try {
        const issueData = req.body;
        const newIssue = await JiraService.createIssue(issueData);
        res.status(201).json(newIssue);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to create issue' });
    }
};
exports.createIssue = createIssue;
const updateIssue = async (req, res) => {
    try {
        const { key } = req.params;
        const updateData = req.body;
        const result = await JiraService.updateIssue(key, updateData);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to update issue' });
    }
};
exports.updateIssue = updateIssue;
