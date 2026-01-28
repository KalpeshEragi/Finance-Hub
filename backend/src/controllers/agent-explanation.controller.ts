/**
 * @file agent-explanation.controller.ts
 * @description Controller for Agent Explanation endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { getAgentExplanation } from '../services/agent-explanation.service';
import { HTTP_STATUS } from '../config/constants';

/**
 * @function getExplanation
 * @description Get full agent explanation with LLM enhancement.
 * 
 * @route GET /agent/explanation
 */
export async function getExplanation(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'User not authenticated',
            });
        }

        const result = await getAgentExplanation(userId, true);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return next(error);
    }
}

/**
 * @function getExplanationFallback
 * @description Get template-based explanation (no LLM).
 * 
 * @route GET /agent/explanation/template
 */
export async function getExplanationFallback(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'User not authenticated',
            });
        }

        const result = await getAgentExplanation(userId, false);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return next(error);
    }
}

export const agentExplanationController = {
    getExplanation,
    getExplanationFallback,
};

export default agentExplanationController;
