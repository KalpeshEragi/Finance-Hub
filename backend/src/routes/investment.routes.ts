import { Router } from 'express';
import {
    getInvestments,
    createInvestment,
    updateInvestment,
    deleteInvestment
} from '../controllers/investment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getInvestments);
router.post('/', createInvestment);
router.put('/:id', updateInvestment);
router.delete('/:id', deleteInvestment);

export default router;
