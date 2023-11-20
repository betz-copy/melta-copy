import * as Joi from "joi";

//Get /api.preview:fileId
export const getPreviewSchema = Joi.object({
  query: {
    token: Joi.string(),
  },
  body: {},
  params: {
    path: Joi.string().required(),
    needsConversion: Joi.boolean(),
  },
});
