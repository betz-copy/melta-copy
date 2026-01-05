import { basicFilterOperationTypes, FilterTypes, numberFilterOperationTypes, textFilterOperationTypes } from '@packages/rule-breach';
import * as joi from 'joi';

export const agGridSetFilterSchema = joi.object({
    filterType: joi.valid(FilterTypes.set).required(),
    values: joi.array().items(joi.string().allow(null)),
});

export const agGridNumberFilterSchema = joi.object({
    filterType: joi.valid(FilterTypes.number).required(),
    type: joi.valid(...Object.values(basicFilterOperationTypes), ...Object.values(numberFilterOperationTypes)).required(),
    filter: joi.number().when('type', { is: joi.invalid(basicFilterOperationTypes.blank, basicFilterOperationTypes.notBlank), then: joi.required() }),
    filterTo: joi.number().when('type', { is: joi.valid(numberFilterOperationTypes.inRange), then: joi.required() }),
});

export const agGridTextFilterSchema = joi.object({
    filterType: joi.valid(FilterTypes.text).required(),
    type: joi.valid(...Object.values(basicFilterOperationTypes), ...Object.values(textFilterOperationTypes)).required(),
    filter: joi.string().when('type', { is: joi.invalid(basicFilterOperationTypes.blank, basicFilterOperationTypes.notBlank), then: joi.required() }),
});

export const agGridDateFilterSchema = joi.object({
    filterType: joi.valid(FilterTypes.date).required(),
    type: joi.valid(...Object.values(basicFilterOperationTypes), ...Object.values(numberFilterOperationTypes)).required(),
    dateFrom: joi.string().allow(null).required(),
    dateTo: joi.string().when('type', { is: joi.valid(numberFilterOperationTypes.inRange), then: joi.required(), otherwise: joi.allow(null) }),
});

export const agGridRequestSchema = joi.object({
    startRow: joi.number().required(),
    endRow: joi.number().required(),
    filterModel: joi
        .object()
        .pattern(/^/, joi.alternatives(agGridTextFilterSchema, agGridDateFilterSchema, agGridNumberFilterSchema, agGridSetFilterSchema))
        .required(),
    sortModel: joi
        .array()
        .items(
            joi.object({
                colId: joi.string(),
                sort: joi.string().valid('asc', 'desc'),
            }),
        )
        .required(),
});
