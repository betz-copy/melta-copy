import { Document } from 'mongoose';

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

export interface IGantt {
    name: string;
    items: IGanttItem[];
}

export type IGanttDocument = IGantt & Document;

export interface ISearchGanttsBody {
    search?: string;
    limit: number;
    step: number;
}
