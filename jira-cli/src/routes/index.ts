import { Router } from 'express';
import * as JiraController from '../controllers/jiraController';

const router = Router();

router.get('/', (req, res) => {
    res.json({ message: 'Welcome to Jira Backend API' });
});

router.get('/issue/:key', JiraController.getIssue);
router.post('/issue', JiraController.createIssue);
router.put('/issue/:key', JiraController.updateIssue);
router.get('/search', JiraController.searchIssues);
router.get('/projects', JiraController.getProjects);
router.get('/boards', JiraController.getBoards);
router.get('/project/:key', JiraController.getProjectDetails);
router.get('/project/:key/roles', JiraController.getProjectRoles);

import * as TemplateController from '../controllers/templateController';
import * as WebhookController from '../controllers/webhookController';

router.get('/project/:key/audit', TemplateController.auditProject);
router.post('/project/:key/apply-template', TemplateController.applyProjectTemplate);

import { verifySource } from '../middlewares/authMiddleware';

// Protect webhook route: Allow JIRA or GAS (legacy) sources
router.post('/webhook', verifySource(['JIRA', 'GAS']), WebhookController.handleIssueWebhook);

export default router;
