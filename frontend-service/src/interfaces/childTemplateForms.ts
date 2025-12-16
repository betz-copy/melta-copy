import type { ByCurrentDefaultValue, IChildTemplatePopulatedFromDb, IChildTemplateProperty, relativeDateFilters } from '@microservices/shared';
import type { IAgGridFilter } from '../common/wizards/entityTemplate/commonInterfaces';

export enum ChipType {
    Filter = 'filters',
    Default = 'defaultValue',
    EditByUser = 'isEditableByUser',
}

export type AllowedChipType = Exclude<ChipType, ChipType.EditByUser>;

export interface IFieldChip {
    fieldName: string;
    chipType: AllowedChipType;
    filterField?: IAgGridFilter;
    defaultValue?: string | number | boolean | Date | string[];
}

export type IChildTemplateFormProperty = Omit<IChildTemplateProperty, 'filters'> & { filters?: IAgGridFilter[] };

export interface IChildTemplateForm extends Omit<IChildTemplatePopulatedFromDb, 'properties'> {
    properties: { properties: Record<string, IChildTemplateFormProperty> };
}

export type IFilterDateType = Date | ByCurrentDefaultValue.byCurrentDate | relativeDateFilters | null;
