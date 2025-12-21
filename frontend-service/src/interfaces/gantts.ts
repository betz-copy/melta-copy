import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { IMongoRelationshipTemplate } from '@packages/relationship-template';
import { IScheduleComponentData } from './syncfusion';

export interface IConnectedEntityTemplateDetails {
    connectedEntityTemplate: IMongoEntityTemplateWithConstraintsPopulated;
    relationship: IMongoRelationshipTemplate;
    fieldsToShow: string[];
    connectedEntityTemplateColor: string;
}

export interface IGanttHeatmapBox {
    id: string;
    title: string;
    ganttEvents: IScheduleComponentData[];
}
