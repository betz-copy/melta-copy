import { IMongoEntityTemplatePopulated, IEntity } from '@microservices/shared';

export interface IReferencedEntityForProcess {
    entity: IEntity;
    userHavePermission: boolean;
    entityTemplate: IMongoEntityTemplatePopulated;
}
