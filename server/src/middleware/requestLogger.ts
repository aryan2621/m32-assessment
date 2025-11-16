import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    const requestPayload: any = {
        body: req.body,
        query: req.query,
        params: req.params,
    };

    if (req.file) {
        requestPayload.file = {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
        };
    }

    if (req.files) {
        requestPayload.files = Array.isArray(req.files)
            ? req.files.map((f: any) => ({
                  originalname: f.originalname,
                  mimetype: f.mimetype,
                  size: f.size,
              }))
            : Object.keys(req.files).map((key) => ({
                  field: key,
                  files: (req.files as any)[key].map((f: any) => ({
                      originalname: f.originalname,
                      mimetype: f.mimetype,
                      size: f.size,
                  })),
              }));
    }

    logger.request(req.method, req.originalUrl || req.url, requestPayload);

    const originalSend = res.send;
    const originalJson = res.json;

    res.json = function (body: any) {
        const duration = `${Date.now() - startTime}ms`;
        logger.response(req.method, req.originalUrl || req.url, res.statusCode, duration, body);
        return originalJson.call(this, body);
    };

    res.send = function (body: any) {
        const duration = `${Date.now() - startTime}ms`;
        if (typeof body === 'object') {
            logger.response(req.method, req.originalUrl || req.url, res.statusCode, duration, body);
        } else {
            logger.response(req.method, req.originalUrl || req.url, res.statusCode, duration, {
                body: typeof body === 'string' ? body.substring(0, 500) : body,
            });
        }
        return originalSend.call(this, body);
    };

    next();
};

