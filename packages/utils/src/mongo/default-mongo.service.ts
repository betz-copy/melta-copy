import { Injectable } from '@nestjs/common';
import { Connection, Model, Schema } from 'mongoose';
import { ClsService } from 'nestjs-cls';
import config from '../config';
import MongoModelFactory from './mongo-model.factory';

//TODO: Once all mongo service migrate, delete manager.ts in this folder
@Injectable()
abstract class DefaultMongoService<T> {
    constructor(
        protected readonly connection: Connection,
        protected readonly cls: ClsService,
        private readonly collectionName: string,
        private readonly modelSchema: Schema<T>,
        protected readonly mongoModelFactory: MongoModelFactory,
        private readonly modelName?: string,
    ) {}

    protected get model(): Model<T> {
        const workspaceId = this.cls.get<string>(config.requestHeaders.workspaceIdHeader);

        if (!workspaceId) throw new Error('Model is not initialized. Ensure workspaceId is set.');

        return this.mongoModelFactory.getModel<T>(this.connection, workspaceId, this.collectionName, this.modelSchema, this.modelName);
    }
}

export default DefaultMongoService;
