import * as joi from 'joi';

export const UserPreferencesSchema = joi.object({
    darkMode: joi.boolean(),
});
