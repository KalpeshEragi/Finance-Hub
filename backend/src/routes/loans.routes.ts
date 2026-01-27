import { Router } from 'express';
import {
    getLoans,
    getLoanById,
    createLoan,
    updateLoan,
    deleteLoan,
    recordPayment,
    getRecommendations,
} from '../controllers/loans.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getLoans);
router.get('/recommendations', getRecommendations);
router.get('/:id', getLoanById);
router.post('/', createLoan);
router.put('/:id', updateLoan);
router.delete('/:id', deleteLoan);
router.post('/:id/payment', recordPayment);

export default router;
