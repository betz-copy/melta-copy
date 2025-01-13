import { IEntityWithDirectRelationships, IGanttItem } from '@microservices/shared-interfaces';

export interface IScheduleComponentResourceData {
    // Fields with uppercase letter at the start are used specificity in the component
    Id: string;
    Text: string;
    Color?: string;
}

export interface IScheduleComponentData {
    entityTemplateId: string;
    groupedByEntityIds?: string[];
    entityWithConnections: IEntityWithDirectRelationships;
    ganttItem: IGanttItem;

    // Fields with uppercase letter at the start are used specificity in the component
    Id: string;
    StartTime: Date;
    EndTime: Date;
    IsAllDay?: boolean;
}
