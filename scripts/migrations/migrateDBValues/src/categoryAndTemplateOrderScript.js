/* eslint-disable no-console */

import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import config from './config/index.js';

const { mongo } = config;

// AGGREGATIONS

export const getCategoryIds = [
    {
        $sort: {
            createdAt: 1,
        },
    },
    {
        $project: {
            _id: 0,
            id: { $toString: '$_id' },
        },
    },
];

export const getTemplateIds = (categoryId) => {
    return [
        {
            $match: {
                category: new ObjectId(categoryId),
            },
        },
        {
            $project: {
                _id: 0,
                id: { $toString: '$_id' },
            },
        },
    ];
};

// MIGRATION SCRIPT

const connectToMongo = async () => {
    await mongoose.connect(mongo.uri);

    console.log('Connected to MongoDB');
};

const listDatabasesWithMongoose = async () => {
    const adminDb = mongoose.connection.db.admin();
    const result = await adminDb.listDatabases();
    console.log('Databases:', result.databases);

    return result.databases;
};

const getDBCategoryIds = async (db) => {
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((col) => col.name);

    if (collectionNames.includes(mongo.categoriesCollection)) {
        console.log(`Applying aggregation to ${db.databaseName}.${mongo.categoriesCollection}`);

        const pipeline = getCategoryIds;
        const results = await db.collection(mongo.categoriesCollection).aggregate(pipeline).toArray();
        return results.map((document) => document.id);
    }

    return null;
};

const getDBTemplateIds = async (db, categoryId) => {
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((col) => col.name);

    if (collectionNames.includes(mongo.templatesCollection)) {
        console.log(`Applying aggregation to ${db.databaseName}.${mongo.templatesCollection}`);

        const pipeline = getTemplateIds(categoryId);
        const results = await db.collection(mongo.templatesCollection).aggregate(pipeline).toArray();

        return results.map((document) => document.id);
    }

    return null;
};

const setTemplateOrderDB = async (dbName, categoryId, templateIds) => {
    const db = mongoose.connection.client.db(dbName);
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((col) => col.name);

    if (collectionNames.includes(mongo.categoriesCollection)) {
        console.log(`Applying setTemplateOrder aggregation to category ${categoryId} at ${db.databaseName}.${mongo.categoriesCollection}`);
        try {
            await db.collection(mongo.categoriesCollection).updateOne({ _id: new ObjectId(categoryId) }, { $set: { templatesOrder: templateIds } });
        } catch (error) {
            console.error(`Failed to add templateOrder to category ${categoryId}, error: ${error}`);
        }
    }
};

const setCategoryAndTemplateOrder = async (dbList) => {
    await Promise.all(
        dbList.map(async (database) => {
            const db = mongoose.connection.client.db(database.name);
            const categoryIds = await getDBCategoryIds(db);

            if (categoryIds) {
                try {
                    await db.collection(mongo.configsCollection).insertOne({
                        type: 'categoryOrder',
                        order: categoryIds,
                    });
                } catch (error) {
                    console.log(`Failed to create categoryOrder at workspace ${db.databaseName}`);
                }

                await Promise.all(
                    categoryIds.map(async (id) => {
                        const templateIds = await getDBTemplateIds(db, id);

                        return setTemplateOrderDB(db.databaseName, id, templateIds);
                    }),
                );
            }
        }),
    );
};

const main = async () => {
    try {
        await connectToMongo();

        const dbList = await listDatabasesWithMongoose();

        await setCategoryAndTemplateOrder(dbList);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connections.forEach((conn) => conn.close());
    }
};

main().then(() => {
    console.log('Successfully created template and category orders in Mongo');
});
