export interface IRelationshipReference {
    relationshipTemplateId?: string;
    relationshipTemplateDirection: 'outgoing' | 'incoming';
    relatedTemplateId: string;
    relatedTemplateField: string;
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
    calculateTime?: boolean | null;
    serialStarter?: number;
    relationshipReference?: IRelationshipReference;
    required?: boolean;
    preview?: boolean;
    hide?: boolean;
    readOnly?: boolean;
    uniqueCheckbox?: boolean;
    groupName?: string;
}
