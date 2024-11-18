import { connection } from 'mongoose';
import { IMongoEntityTemplate } from '@microservices/shared';
import config from '../../config';
import { EntityTemplateSchema } from './model';

const { mongo } = config;

export const initModelPerWorkspace = (workspaceId: string) =>
    connection.useDb(workspaceId, { useCache: true }).model<IMongoEntityTemplate>(mongo.entityTemplatesCollectionName, EntityTemplateSchema);
