import { IPropertyValue } from '@packages/entity';
import { IBrokenRule } from '@packages/rule-breach';

export interface IEntityWithIgnoredRules {
    templateId: string;
    properties: Record<string, IPropertyValue>;
    ignoredRules: IBrokenRule[];
}
