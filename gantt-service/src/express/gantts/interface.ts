export interface IGanttItem {
    entityTemplate: {
        id: string;
        startDateField: string;
        endDateField: string;
        fieldsToShow: string[];
    };
    connectedEntityTemplates: {
        relationshipTemplateId: string;
        fieldsToShow: string[];
    }[];
    groupByRelationshipId?: string; // must exist if gantt has groupBy
}

export interface IGantt {
    name: string;
    items: IGanttItem[];
    groupBy?: {
        entityTemplateId: string;
        groupNameField: string; // must be unique
    };
}

export interface ISearchGanttsBody {
    search?: string;
    limit: number;
    step: number;
}
