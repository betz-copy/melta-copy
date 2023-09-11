export interface IGanttItem {
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

export interface IBasicGantt {
    name: string;
    items: IGanttItem[];
}

export interface IGantt extends IBasicGantt {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ISearchGanttsBody {
    search?: string;
    limit: number;
    step: number;
}
