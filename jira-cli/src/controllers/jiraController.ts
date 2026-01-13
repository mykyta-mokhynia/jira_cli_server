import { Request, Response } from 'express';
import * as JiraService from '../services/jira';

export const getIssue = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const issue = await JiraService.getIssue(key as string);
        res.json(issue);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to fetch issue' });
    }
};

export const searchIssues = async (req: Request, res: Response) => {
    try {
        const { jql } = req.query;
        if (typeof jql !== 'string') {
            res.status(400).json({ error: 'JQL query parameter is required and must be a string' });
            return; // Explicit return to satisfy void
        }
        const results = await JiraService.searchIssues(jql);
        res.json(results);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to search issues' });
    }
};

export const createIssue = async (req: Request, res: Response) => {
    try {
        const issueData = req.body;
        const newIssue = await JiraService.createIssue(issueData);
        res.status(201).json(newIssue);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to create issue' });
    }
};

export const updateIssue = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const updateData = req.body;
        const result = await JiraService.updateIssue(key as string, updateData);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to update issue' });
    }
};

export const getProjects = async (req: Request, res: Response) => {
    try {
        const projects = await JiraService.getProjects();
        res.json(projects);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to fetch projects' });
    }
};

export const getBoards = async (req: Request, res: Response) => {
    try {
        const boards = await JiraService.getBoards();
        res.json(boards);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to fetch boards' });
    }
};

export const getProjectDetails = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const project = await JiraService.getProjectDetails(key as string);
        res.json(project);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to fetch project details' });
    }
};

export const getProjectRoles = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const roles = await JiraService.getProjectRoles(key as string);
        res.json(roles);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to fetch project roles' });
    }
};
