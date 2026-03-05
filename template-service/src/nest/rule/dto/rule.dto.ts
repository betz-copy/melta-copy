import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ActionOnFail } from '@packages/rule';

export const RuleSchema = z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    actionOnFail: z.enum([ActionOnFail.WARNING, ActionOnFail.ENFORCEMENT, ActionOnFail.INDICATOR]),
    entityTemplateId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    formula: z.object({}).passthrough(),
    disabled: z.boolean().default(false),
    fieldColor: z.object({}).passthrough().optional(),
    mail: z.object({}).passthrough().optional(),
    doesFormulaHaveTodayFunc: z.boolean().default(false),
});

export class CreateRuleDto extends createZodDto(RuleSchema) {}
export class UpdateRuleDto extends createZodDto(RuleSchema.partial()) {}
