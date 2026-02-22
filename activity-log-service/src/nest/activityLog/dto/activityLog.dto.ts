import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const stringToArray = z.union([z.string(), z.array(z.string())]).transform((val) => (Array.isArray(val) ? val : val.split(',').map((v) => v.trim())));

export const GetActivityQuerySchema = z.object({
    limit: z.coerce.number().default(10),
    skip: z.coerce.number().default(0),
    fieldsSearch: stringToArray.optional().default([]),
    usersSearch: stringToArray.optional().default([]),
    actions: stringToArray.optional(),
    searchText: z.string().optional(),
    // we have to use iso string and not coerce it because swagger converts it to json which doesn't support Date as a type
    startDateRange: z.iso.date().optional(),
    endDateRange: z.iso.date().optional(),
});

export class GetActivityQueryDto extends createZodDto(GetActivityQuerySchema) {}
