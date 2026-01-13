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
const express_1 = require("express");
const JiraController = __importStar(require("../controllers/jiraController"));
const router = (0, express_1.Router)();
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
const TemplateController = __importStar(require("../controllers/templateController"));
const WebhookController = __importStar(require("../controllers/webhookController"));
router.get('/project/:key/audit', TemplateController.auditProject);
router.post('/project/:key/apply-template', TemplateController.applyProjectTemplate);
const authMiddleware_1 = require("../middlewares/authMiddleware");
// Protect webhook route: Allow JIRA or GAS (legacy) sources
router.post('/webhook', (0, authMiddleware_1.verifySource)(['JIRA', 'GAS']), WebhookController.handleIssueWebhook);
exports.default = router;
