import express from 'express';
import { RequestsController } from '../controllers/RequestsController';

const router = express.Router();

router.get('/join', RequestsController.getJoinRequests);
router.get('/collaborations', RequestsController.getCollaborationRequests);

export default router;


