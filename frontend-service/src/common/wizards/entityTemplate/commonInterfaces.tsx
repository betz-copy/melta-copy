import { IAGGidNumberFilter, IAGGridDateFilter, IAGGridSetFilter, IAGGridTextFilter } from '../../../utils/agGrid/interfaces';

export interface IRelationshipReference {
    relationshipTemplateId?: string;
    relationshipTemplateDirection: 'outgoing' | 'incoming';
    relatedTemplateId: string;
    relatedTemplateField: string;
    filters?: IFilterTemplate[];
}
export interface FieldGroupData {
    name: string;
    displayName: string;
    id: string;
}

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
    relationshipReference?: IRelationshipReference;
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

export interface IFilterTemplate {
    filterProperty: string;
    filterField?: IAGGridFilter;
}

export type IAGGridFilter = IAGGridTextFilter | IAGGidNumberFilter | IAGGridDateFilter | IAGGridSetFilter;
