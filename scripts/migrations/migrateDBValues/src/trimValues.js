/* eslint-disable no-console */
import mongoose from 'mongoose';
import neo4j from 'neo4j-driver';
import { getTrimmedValueAggregation, trimValuesInMongoAggregation } from './aggregation.js';
import config from './config/index.js';

const { mongo, neo } = config;

const generateQuery = (results) => {
    const lastIndex = results.length - 1;

    return results.reduce((final, curr, index) => {
        const start = `match (n:\`${curr._id}\`) `;
        const setProperties = curr.property.reduce((allProperties, currProperty) => {
            const setQuery = currProperty.v
                ? `SET n.${currProperty.k} = case when n.${currProperty.k} is null then n.${currProperty.k} else [item IN n.${currProperty.k} | trim(item)] end
          set n.${currProperty.k}_tostring = case when n.${currProperty.k} is null then n.${currProperty.k}_tostring else trim(BOTH ',' FROM REDUCE(str = '', x IN n.${currProperty.k}| str + COALESCE(x, '') + ',')) end `
                : `SET n.${currProperty.k} = case when n.${currProperty.k} is null then n.${currProperty.k} else trim(n.${currProperty.k}) end `;

            return allProperties + setQuery;
        }, '');
        const union = index === lastIndex ? '' : 'union all ';

        return `${final + start + setProperties}return n ${union}`;
    }, '');
};

const getDBTrimmedValue = async (dbName) => {
    const db = mongoose.connection.client.db(dbName);
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((col) => col.name);

    if (collectionNames.includes(mongo.targetCollection)) {
        console.log(`Applying aggregation to ${dbName}.${mongo.targetCollection}`);

        const pipeline = getTrimmedValueAggregation;
        const results = await db.collection(mongo.targetCollection).aggregate(pipeline).toArray();
        const query = generateQuery(results);

        return { dbName, entities: results, query };
    }

    return null;
};

const getTrimmedValues = async (dbList) => {
    const data = [];

    await Promise.all(
        dbList.map(async (database) => {
            const dbName = database.name;

            const newData = await getDBTrimmedValue(dbName);
            if (newData) data.push(newData);
        }),
    );

    console.log('finish get value to trim mongo', data.length);

    return data;
};

const trimValuesInDB = async (dbName) => {
    const db = mongoose.connection.client.db(dbName);
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((col) => col.name);

    if (collectionNames.includes(mongo.targetCollection)) {
        console.log(`Applying aggregation and update to ${dbName}.${mongo.targetCollection}`);

        const pipeline = trimValuesInMongoAggregation;
        const result = await db.collection(mongo.targetCollection).updateMany({}, pipeline);

        console.log(`Updated ${result.matchedCount} documents in ${dbName}.${mongo.targetCollection}, modified ${result.modifiedCount} documents`);
    }
};

const trimValuesMongo = async (dbList) => {
    // eslint-disable-next-line no-return-await
    await Promise.all(dbList.map(async (database) => await trimValuesInDB(database.name)));

    console.log('finish trim mongo');
};

const trimValuesNeo = async (driver, data) => {
    try {
        await Promise.all(
            data.map(async (db) => {
                console.log({ db });

                const session = driver.session({ database: `workspace-${db.dbName}` });

                try {
                    const result = await session.run(db.query);

                    const nodes = result.records.map((record) => record.get('n').properties);

                    console.log('length of nodes change in db', nodes.length);
                } catch (error) {
                    console.error('Error fetching nodes:', error);
                } finally {
                    await session.close();
                }
            }),
        );

        console.log('finish trim neo');
    } catch (err) {
        console.error('Unexpected error:', err);
    } finally {
        await driver.close();
    }
};

const connectToMongo = async () => {
    await mongoose.connect(mongo.uri);

    console.log('Connected to MongoDB');
};

const connectToNeo = async () => {
    const driver = neo4j.driver(neo.uri, neo4j.auth.basic(neo.user, neo.password));
    console.log('Connected to neo');

    return driver;
};

const listDatabasesWithMongoose = async () => {
    const adminDb = mongoose.connection.db.admin();
    const result = await adminDb.listDatabases();
    console.log('Databases:', result.databases);

    return result.databases;
};

const main = async () => {
    try {
        await connectToMongo();
        const neoDriver = await connectToNeo();
        const dbList = await listDatabasesWithMongoose();

        const data = await getTrimmedValues(dbList);

        await trimValuesMongo(dbList);

        await trimValuesNeo(neoDriver, data);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connections.forEach((conn) => conn.close());
    }
};

main().then(() => {
    console.log('trimmed all values in neo and mongo');
});
