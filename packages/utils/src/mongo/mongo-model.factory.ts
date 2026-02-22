import { Injectable, Logger } from '@nestjs/common';
import { Connection, Model, Schema } from 'mongoose';

@Injectable()
class MongoModelFactory {
    private readonly logger = new Logger(MongoModelFactory.name);

    getModel<T>(connection: Connection, workspaceId: string, collectionName: string, schema: Schema<T>, modelName?: string): Model<T> {
        const db = connection.useDb(workspaceId, { useCache: true });
        let model: Model<T>;
        try {
            model = db.model<T>(modelName || collectionName);
        } catch {
            this.logger.debug(`Model ${modelName || collectionName} not found, creating a new one.`);
            model = db.model<T>(modelName || collectionName, schema, collectionName);
        }

        return model;
    }
}

export default MongoModelFactory;
