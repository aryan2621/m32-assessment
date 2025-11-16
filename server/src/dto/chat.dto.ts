import Joi from 'joi';
import { sendError } from '../utils/apiResponse';
import { Response } from 'express';

export class CreateSessionDTO {
    title?: string;

    private static schema = Joi.object({
        title: Joi.string().optional(),
    });

    static validate(data: any, res: Response): CreateSessionDTO | null {
        const { error, value } = this.schema.validate(data);
        if (error) {
            sendError(res, error.details[0].message, 400);
            return null;
        }
        return value as CreateSessionDTO;
    }
}

export class SendMessageDTO {
    sessionId?: string;
    message?: string;
    content?: string;
    fileId?: string;

    private static schema = Joi.object({
        sessionId: Joi.string().optional(),
        message: Joi.string().optional(),
        content: Joi.string().optional(),
        fileId: Joi.string().optional(),
    })
        .or('message', 'content')
        .messages({
            'object.missing': 'Either message or content is required',
        });

    static validate(data: any, res: Response): SendMessageDTO | null {
        const { error, value } = this.schema.validate(data);
        if (error) {
            sendError(res, error.details[0].message, 400);
            return null;
        }
        if (!value.message && !value.content) {
            sendError(res, 'Message content is required', 400);
            return null;
        }
        return value as SendMessageDTO;
    }
}
