import { BasicFilterOperationTypes, FilterTypes, NumberFilterOperationTypes, TextFilterOperationTypes } from '@packages/rule-breach';
import * as joi from 'joi';

export const agGridSetFilterSchema = joi.object({
    filterType: joi.valid(FilterTypes.set).required(),
    values: joi.array().items(joi.string().allow(null)),
});

export const agGridNumberFilterSchema = joi.object({
    filterType: joi.valid(FilterTypes.number).required(),
    type: joi.valid(...Object.values(BasicFilterOperationTypes), ...Object.values(NumberFilterOperationTypes)).required(),
    filter: joi.number().when('type', { is: joi.invalid(BasicFilterOperationTypes.blank, BasicFilterOperationTypes.notBlank), then: joi.required() }),
    filterTo: joi.number().when('type', { is: joi.valid(NumberFilterOperationTypes.inRange), then: joi.required() }),
});

export const agGridTextFilterSchema = joi.object({
    filterType: joi.valid(FilterTypes.text).required(),
    type: joi.valid(...Object.values(BasicFilterOperationTypes), ...Object.values(TextFilterOperationTypes)).required(),
    filter: joi.string().when('type', { is: joi.invalid(BasicFilterOperationTypes.blank, BasicFilterOperationTypes.notBlank), then: joi.required() }),
});

export const agGridDateFilterSchema = joi.object({
    filterType: joi.valid(FilterTypes.date).required(),
    type: joi.valid(...Object.values(BasicFilterOperationTypes), ...Object.values(NumberFilterOperationTypes)).required(),
    dateFrom: joi.string().allow(null).required(),
    dateTo: joi.string().when('type', { is: joi.valid(NumberFilterOperationTypes.inRange), then: joi.required(), otherwise: joi.allow(null) }),
});
