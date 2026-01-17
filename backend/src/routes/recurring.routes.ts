import { Router } from 'express';
import {
    getRecurrings,
    createRecurring,
    updateRecurring,
    deleteRecurring
} from '../controllers/recurring.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getRecurrings);
router.post('/', createRecurring);
router.put('/:id', updateRecurring);
router.delete('/:id', deleteRecurring);

export default router;
