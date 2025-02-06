import { IEntity, ISearchFilter, ISearchSort } from '../../externalServices/instanceService/interfaces/entities';
import { IRelationship } from '../../externalServices/instanceService/interfaces/relationships';

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
            displayColumns?: string[];
            headersOnly?: boolean;
            insertEntities?: Record<string, any>[];
            edit?: boolean;
        };
    };
}
