import { IEntity, ISearchFilter, ISearchSort, IRelationship } from '@microservices/shared';

export interface IRelationshipPopulated extends Omit<IRelationship, 'sourceEntityId' | 'destinationEntityId'> {
    sourceEntity: IEntity;
    destinationEntity: IEntity;
}

export interface IExportEntitiesBody {
    fileName: string;
    textSearch?: string;
    templates: {
        [templateId: string]: {
            filter?: ISearchFilter;
            sort?: ISearchSort;
            displayColumns: string[];
        };
    };
}
