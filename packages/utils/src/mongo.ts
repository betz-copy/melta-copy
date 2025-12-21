import * as mongoose from 'mongoose';

export default abstract class DefaultManagerMongo<T> {
    protected model: mongoose.Model<T>;
    protected workspaceId: string;

    constructor(workspaceId: string, collectionName: string, schema: mongoose.Schema) {
        this.workspaceId = workspaceId;
        const modelName = `${workspaceId}_${collectionName}`;

        // Check if model already exists to avoid OverwriteModelError
        if (mongoose.models[modelName]) {
            this.model = mongoose.models[modelName] as mongoose.Model<T>;
        } else {
            this.model = mongoose.model<T>(modelName, schema, collectionName);
        }
    }
}
