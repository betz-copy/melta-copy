import * as Joi from 'joi';
import * as assert from 'assert';
import { Scope, scopeOptions } from '../express/permissions/interface';
import { validateObject } from './joi';

export type OperationTranslator = Record<Scope, string[]>;

const OperationTranslatorSchema = scopeOptions.reduce((result, scopeOption) => {
    return result.keys({
        [scopeOption]: Joi.array().items(Joi.string()).min(1),
    });
}, Joi.object({}).min(1)) as Joi.ObjectSchema<any>;

export const validateOperationTranslator = (operationTranslator: OperationTranslator) => {
    const validatedOperationTranslator = validateObject(operationTranslator, OperationTranslatorSchema) as OperationTranslator;

    const translatorValues = Object.values(validatedOperationTranslator).flat();

    assert(
        translatorValues.length === new Set(translatorValues).size,
        `operation translator is invalid, one operation cannot be translated into 2 scopes`,
    );

    return validatedOperationTranslator;
};
