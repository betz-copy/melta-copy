import z from 'zod';

//TODO: once all services using basicValidateRequest migrated to zod,
//TODO: remove the one in joi and rename this one to basicValidateRequest
export const zodBasicValidateRequest = <T>(schema: z.ZodType<T>, value: unknown): T => {
    return schema.parse(value);
};
