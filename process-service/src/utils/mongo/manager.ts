import { Schema, connection, Model } from 'mongoose';

export abstract class DefaultManagerMongo<T> {
    public model: Model<T>;

    constructor(protected dbName: string, private collectionName: string, private modelSchema: Schema) {
        this.model = connection.useDb(this.dbName, { useCache: true }).model<T>(this.collectionName, this.modelSchema);
    }
}
