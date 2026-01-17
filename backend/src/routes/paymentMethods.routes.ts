/**
 * @file paymentMethods.routes.ts
 * @description Payment methods routes for managing bank accounts, credit cards, and UPI.
 * 
 * Routes:
 * - GET /payment-methods - Get all payment methods
 * - GET /payment-methods/counts - Get counts only
 * - POST /payment-methods/bank - Add bank account
 * - POST /payment-methods/credit-card - Add credit card
 * - POST /payment-methods/upi - Add UPI ID
 * - DELETE /payment-methods/:id - Remove payment method
 */

import { createRouter } from '../utils/routeWrapper';
import { authenticate } from '../middleware/auth.middleware';
import { paymentMethodsController } from '../controllers/paymentMethods.controller';

const router = createRouter('/payment-methods');

// All routes require authentication
router.use(authenticate);

/**
 * @route GET /payment-methods
 * @description Get all payment methods for the authenticated user
 * @access Private
 */
router.get('/', paymentMethodsController.getPaymentMethods);

/**
 * @route GET /payment-methods/counts
 * @description Get payment method counts only
 * @access Private
 */
router.get('/counts', paymentMethodsController.getPaymentMethodCounts);

/**
 * @route POST /payment-methods/bank
 * @description Add a bank account
 * @access Private
 */
router.post('/bank', paymentMethodsController.addBankAccount);

/**
 * @route POST /payment-methods/credit-card
 * @description Add a credit card
 * @access Private
 */
router.post('/credit-card', paymentMethodsController.addCreditCard);

/**
 * @route POST /payment-methods/upi
 * @description Add a UPI ID
 * @access Private
 */
router.post('/upi', paymentMethodsController.addUpi);

/**
 * @route DELETE /payment-methods/:id
 * @description Remove a payment method
 * @access Private
 */
router.delete('/:id', paymentMethodsController.deletePaymentMethod);

export default router;
