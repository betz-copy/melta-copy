import { connection, Model } from 'mongoose';

abstract class DefaultManagerMongo<T> {
    public model: Model<T>;

    constructor(
        protected workspaceId: string,
        private collectionName: string,
        // TODO return Schema type when mongoose fixes their types
        // biome-ignore lint/suspicious/noExplicitAny: blame Uri
        private modelSchema: any,
    ) {
        this.model = connection.useDb(this.workspaceId, { useCache: true }).model<T>(this.collectionName, this.modelSchema);
    }
}

export default DefaultManagerMongo;
