import { Router } from 'express';
import * as WebhookController from '../controllers/webhookController';
import { verifySource } from '../middlewares/authMiddleware';

const router = Router();

router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date(), service: 'server-jira' });
});

router.post('/webhook', verifySource, WebhookController.handleIssueWebhook);

export default router;
