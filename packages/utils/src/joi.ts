import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';

class ValidateRequestClass {
    static validate(schema: Joi.ObjectSchema) {
        return (req: Request, res: Response, next: NextFunction): void => {
            const { error } = schema.validate(req.body, { abortEarly: false });
            if (error) {
                const errors = error.details.map((detail) => detail.message);
                res.status(400).json({ errors });
                return;
            }
            next();
        };
    }

    static validateQuery(schema: Joi.ObjectSchema) {
        return (req: Request, res: Response, next: NextFunction): void => {
            const { error } = schema.validate(req.query, { abortEarly: false });
            if (error) {
                const errors = error.details.map((detail) => detail.message);
                res.status(400).json({ errors });
                return;
            }
            next();
        };
    }

    static validateParams(schema: Joi.ObjectSchema) {
        return (req: Request, res: Response, next: NextFunction): void => {
            const { error } = schema.validate(req.params, { abortEarly: false });
            if (error) {
                const errors = error.details.map((detail) => detail.message);
                res.status(400).json({ errors });
                return;
            }
            next();
        };
    }
}

// Export function wrapper for backward compatibility
export const ValidateRequest = (schema: Joi.ObjectSchema) => ValidateRequestClass.validate(schema);
ValidateRequest.validate = ValidateRequestClass.validate;
ValidateRequest.validateQuery = ValidateRequestClass.validateQuery;
ValidateRequest.validateParams = ValidateRequestClass.validateParams;

export default ValidateRequest;
