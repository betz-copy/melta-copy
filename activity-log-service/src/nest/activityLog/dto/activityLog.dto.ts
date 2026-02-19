import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const stringToArray = z.union([z.string(), z.array(z.string())]).transform((val) => (Array.isArray(val) ? val : val.split(',').map((v) => v.trim())));

const GetActivityQuerySchema = z.object({
    limit: z.coerce.number().default(10),
    skip: z.coerce.number().default(0),
    fieldsSearch: stringToArray.optional().default([]),
    usersSearch: stringToArray.optional().default([]),
    actions: stringToArray.optional(),
    searchText: z.string().optional(),
    startDateRange: z.coerce.date().optional(),
    endDateRange: z.coerce.date().optional(),
});

export class GetActivityQueryDto extends createZodDto(GetActivityQuerySchema) {}
