import { IMongoEntityTemplatePopulated } from '@packages/entity-template';
import { IAgGridDateFilter, IAgGridNumberFilter, IAgGridSetFilter, IAgGridTextFilter } from '@packages/rule-breach';

export interface IGraphFilterBody {
    selectedTemplate: IMongoEntityTemplatePopulated;
    selectedProperty?: string;
    filterField?: IAgGridTextFilter | IAgGridNumberFilter | IAgGridDateFilter | IAgGridSetFilter;
}

export interface IGraphFilterBodyBatch {
    [key: string]: IGraphFilterBody;
}
