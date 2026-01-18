import mongoose from 'mongoose';
import config from './config/index.js';

const { mongo } = config;

const renameUserIdToRelatedId = async () => {
    const db = mongoose.connection.client.db(mongo.globalDatabase);
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((col) => col.name);

    if (!collectionNames.includes(mongo.permissionsCollection)) {
        console.warn(`Collection ${mongo.permissionsCollection} not found in database ${mongo.globalDatabase}`);
        return;
    }

    console.log(`Updating ${mongo.globalDatabase}.${mongo.permissionsCollection}`);

    const collection = db.collection(mongo.permissionsCollection);

    const indexes = await collection.indexes();
    const indexToDrop = indexes.find((index) => {
        const keys = index.key;
        return keys.userId === 1 && keys.type === 1 && keys.workspaceId === 1 && index.unique;
    });
    if (indexToDrop) {
        await collection.dropIndex(indexToDrop.name);
        await collection.dropIndex('userId_1');
        console.log(`Dropped index: ${indexToDrop.name}`);
    }

    const result = await collection.updateMany({ userId: { $exists: true } }, [{ $set: { relatedId: '$userId' } }, { $unset: 'userId' }]);

    await collection.createIndex(
        { relatedId: 1, type: 1, workspaceId: 1 },
        {
            unique: true,
        },
    );
    console.log('Created new index on field "relatedId".');

    console.log(`${result.modifiedCount} documents updated in ${mongo.globalDatabase}.${mongo.permissionsCollection}`);
};

const connectToMongo = async () => {
    await mongoose.connect(mongo.uri);
    console.log('Connected to MongoDB');
};

const main = async () => {
    try {
        await connectToMongo();
        await renameUserIdToRelatedId();
    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connections.forEach((conn) => {
            conn.close();
        });
    }
};

main().then(() => {
    console.log('replaced all permission: userId --> relatedId ');
});
