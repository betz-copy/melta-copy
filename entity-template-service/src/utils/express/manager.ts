import { Model, Schema, connection } from 'mongoose';

export default abstract class DefaultManager<T> {
    private dbName: string;

    private modelName: string;

    private modelSchema: Schema;

    constructor(dbName: string, model: Model<T>) {
        this.dbName = dbName;
        this.modelName = model.name;
        this.modelSchema = model.schema;
    }

    // Getter for the model that ensures that the model is always using the correct database
    public get model() {
        return connection.useDb(this.dbName, { useCache: true }).model<T>(this.modelName, this.modelSchema);
    }
}
