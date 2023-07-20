export interface IGanttItem {
    _id: string;
    entityTemplate: {
        id: string;
        startDateField: string;
        endDateField: string;
        fieldsToShow: string[];
    };
    connectedEntityTemplate?: {
        relationshipTemplateId: string;
        fieldsToShow: string[];
    };
}

export interface IGantt {
    _id: string;
    name: string;
    items: IGanttItem[];
}

export interface ISearchGanttsBody {
    search?: string;
    limit: number;
    step: number;
}
