/**
 * @file parser.controller.ts
 * @description Controller to handle text parsing requests.
 */

import { Request, Response, NextFunction } from 'express';
import { ParserService } from '../services/parser.service';
import { AppError } from '../middleware/error.middleware';

export class ParserController {
    /**
     * @route POST /api/transactions/parse
     * @description Parse unstructured text and return structured transaction preview
     */
    static async parseText(req: Request, res: Response, next: NextFunction) {
        try {
            const { text } = req.body;

            if (!text || typeof text !== 'string') {
                throw new AppError('Text content is required', 400);
            }

            const parsed = ParserService.parse(text);

            if (!parsed) {
                // Return explicitly to end execution
                res.status(200).json({
                    success: false,
                    message: 'Could not detect transaction format. Try manual entry.'
                });
                return;
            }

            // Return the structure for user confirmation (don't save yet)
            res.json({
                success: true,
                data: parsed
            });

        } catch (error) {
            next(error);
        }
    }
}
