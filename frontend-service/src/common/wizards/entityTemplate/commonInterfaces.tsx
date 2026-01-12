import { FieldGroupData, IRelationshipReference } from '@packages/entity-template';
import { IAgGridDateFilter, IAgGridNumberFilter, IAgGridSetFilter, IAgGridTextFilter } from '@packages/rule-breach';

export interface CommonFormInputProperties {
    name: string;
    title: string;
    type: string;
    id: string;
    options: string[];
    optionColors?: Record<string, string>;
    pattern: string;
    patternCustomErrorMessage: string;
    dateNotification?: number | null;
    isDailyAlert?: boolean | null;
    isDatePastAlert?: boolean | null;
    calculateTime?: boolean | null;
    serialStarter?: number;
    relationshipReference?: IRelationshipReferenceForm;
    required?: boolean;
    preview?: boolean;
    hide?: boolean;
    deleted?: boolean;
    readOnly?: boolean;
    uniqueCheckbox?: boolean;
    expandedUserField?: {
        relatedUserField: string;
        kartoffelField: string;
    };
    groupName?: string;
    archive?: boolean;
    identifier?: boolean;
    mapSearch?: boolean;
    fieldGroup?: FieldGroupData;
    comment?: string;
    hideFromDetailsPage?: boolean;
    color?: string;
    accountBalance?: boolean;
    isProfileImage?: boolean;
}

export interface IRelationshipReferenceForm extends Omit<IRelationshipReference, 'filters'> {
    filters?: IFilterTemplate[];
}

export interface FieldProperty {
    type: 'field';
    data: CommonFormInputProperties;
}

export interface GroupProperty extends FieldGroupData {
    type: 'group';
    fields: CommonFormInputProperties[];
}

export type PropertyItem = FieldProperty | GroupProperty;

export interface ConvertToRelationshipFieldFormInputProperties {
    fieldName: string;
    displayFieldName: string;
    relationshipReference: {
        relationshipTemplateDirection: 'outgoing' | 'incoming';
        relatedTemplateId: string;
        relatedTemplateField: string;
        filters?: IFilterTemplate[];
    };
}

export enum FilterType {
    field = 'field',
    value = 'value',
}

export interface IFilterTemplate {
    filterProperty: string;
    filterType?: FilterType;
    filterField?: IAgGridFilter;
}

export type IAgGridFilter = IAgGridTextFilter | IAgGridNumberFilter | IAgGridDateFilter | IAgGridSetFilter;
