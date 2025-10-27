import { connection, Model, Schema } from 'mongoose';

abstract class DefaultManagerMongo<T> {
    public model: Model<T>;

    constructor(
        protected workspaceId: string,
        private collectionName: string,
        private modelSchema: Schema,
    ) {
        this.model = connection.useDb(this.workspaceId, { useCache: true }).model<T>(this.collectionName, this.modelSchema);
    }
}

export default DefaultManagerMongo;
