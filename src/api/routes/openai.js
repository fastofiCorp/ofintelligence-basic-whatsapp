// src/api/routes/openai.js
const express = require('express');
const multer = require('multer');
const openaiController = require('../controllers/openai.js');

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB limit
    }
});

// Create router for private endpoints only
const privateRouter = express.Router();

// Debug with simple routes first
privateRouter.get('/test', (req, res) => res.send('OpenAI test route works'));

// Once confirmed working, add the full routes:
privateRouter.post('/threads', openaiController.createThread);
privateRouter.post('/threads/:threadId/messages', openaiController.addMessageToThread);
privateRouter.post('/threads/:threadId/runs', openaiController.runAssistant);
privateRouter.get('/threads/:threadId/runs/:runId', openaiController.getRunStatus);
privateRouter.get('/threads/:threadId/runs/:runId/wait', openaiController.waitForRun);
privateRouter.get('/threads/:threadId/messages', openaiController.getMessages);
privateRouter.get('/threads/:threadId/messages/last', openaiController.getLastAssistantMessage);
privateRouter.post('/files', upload.single('file'), openaiController.uploadFile);

module.exports = { privateRouter };
