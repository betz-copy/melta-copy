import { IMongoEntityTemplatePopulated } from '@microservices/shared/src/interfaces/entityTemplate';
import { IEntity } from '@microservices/shared/src/interfaces/entity';

export interface IReferencedEntityForProcess {
    entity: IEntity;
    userHavePermission: boolean;
    entityTemplate: IMongoEntityTemplatePopulated;
}
