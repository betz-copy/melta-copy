import { IEntity, ISearchFilter, ISearchSort } from '@microservices/shared/src/interfaces/entity';
import { IRelationship } from '@microservices/shared/src/interfaces/relationship';

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
