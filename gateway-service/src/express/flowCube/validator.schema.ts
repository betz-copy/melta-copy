import Joi from 'joi';

// POST /api/flow-cube/entites/search/template/templateId
export const searchFlowCubeRequestSchema = Joi.object({
    body: Joi.object().pattern(Joi.string(), Joi.any()),
    query: {},
    params: { templateId: Joi.string().required() },
});
