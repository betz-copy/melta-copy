import { IMongoRelationshipTemplate, IMongoEntityTemplatePopulated } from '@microservices/shared';
import { IScheduleComponentData } from './syncfusion';

export interface IGanttGroupBy {
    entityTemplateId: string;
    groupNameField: string; // must be unique
}

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

export interface IBasicGantt {
    name: string;
    items: IGanttItem[];
    groupBy?: IGanttGroupBy;
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

export interface IConnectedEntityTemplateDetails {
    connectedEntityTemplate: IMongoEntityTemplatePopulated;
    relationship: IMongoRelationshipTemplate;
    fieldsToShow: string[];
    connectedEntityTemplateColor: string;
}

export interface IGanttHeatmapBox {
    id: string;
    title: string;
    ganttEvents: IScheduleComponentData[];
}
