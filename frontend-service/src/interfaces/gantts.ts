import { IMongoRelationshipTemplate, IMongoEntityTemplatePopulated } from '@microservices/shared-interfaces';
import { IScheduleComponentData } from './syncfusion';

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
