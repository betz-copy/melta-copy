export interface IRelationshipReference {
    relationshipTemplateId?: string;
    relationshipTemplateDirection: 'outgoing' | 'incoming';
    relatedTemplateId: string;
    relatedTemplateField: string;
}
export interface FieldsGroup {
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
    groupName?: string;
    archive?: boolean;
    identifier?: boolean;
    mapSearch?: boolean;
    fieldGroup?: FieldsGroup;
}

export interface FieldCommonFormInputProperties {
    type: 'field';
    data: CommonFormInputProperties;
}

export interface GroupCommonFormInputProperties extends FieldsGroup {
    type: 'group';
    fields: CommonFormInputProperties[];
}
export type PropertyItem = FieldCommonFormInputProperties | GroupCommonFormInputProperties;

export interface ConvertToRelationshipFieldFormInputProperties {
    fieldName: string;
    displayFieldName: string;
    relationshipReference: {
        relationshipTemplateDirection: 'outgoing' | 'incoming';
        relatedTemplateId: string;
        relatedTemplateField: string;
    };
}
