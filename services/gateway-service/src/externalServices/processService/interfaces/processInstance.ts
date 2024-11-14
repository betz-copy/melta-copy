import { IMongoEntityTemplatePopulated } from '@microservices/shared/src/interfaces/entityTemplate';

import { IEntity } from '../../instanceService/interfaces/entities';

export interface IReferencedEntityForProcess {
    entity: IEntity;
    userHavePermission: boolean;
    entityTemplate: IMongoEntityTemplatePopulated;
}
