/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import mongoose from 'mongoose';
import neo4j from 'neo4j-driver';
import config from './config/index.js';

const { mongo, neo } = config;

// eslint-disable-next-line import/prefer-default-export
export const getSerialPropsAggregation = [
    {
        $set: {
            serialProperties: {
                $map: {
                    input: {
                        $filter: {
                            input: { $objectToArray: '$properties.properties' },
                            as: 'property',
                            cond: {
                                $and: [{ $ne: ['$$property.v.serialStarter', null] }, { $gt: ['$$property.v.serialStarter', -1] }],
                            },
                        },
                    },
                    as: 'filteredProperty',
                    in: '$$filteredProperty.k',
                },
            },
        },
    },
    {
        $match: {
            serialProperties: { $ne: [] },
        },
    },
    {
        $addFields: {
            _id: { $toString: '$_id' },
        },
    },
    {
        $project: {
            _id: 1,
            serialProperties: 1,
        },
    },
];

const SerialNumberNeoScript = async (mongoResult, session) => {
    await session.writeTransaction(async (tx) => {
        for (const template of mongoResult) {
            for (const serialProperty of template.serialProperties) {
                const requiredConstraintName = `requiredConstraint-${template._id}-${serialProperty}`;
                const uniqueConstraintName = `uniqueConstraint-${template._id}-${serialProperty}`;

                const existingRequiredConstraints = await tx.run(`
          SHOW CONSTRAINTS YIELD name
          WHERE name = '${requiredConstraintName}'
          RETURN name
        `);

                if (existingRequiredConstraints.records.length > 0) {
                    const existingUniqueConstraints = await tx.run(`
            SHOW CONSTRAINTS YIELD name
            WHERE name = '${uniqueConstraintName}'
            RETURN name
          `);

                    if (existingUniqueConstraints.records.length === 0) {
                        try {
                            await tx.run(`
              CREATE CONSTRAINT \`${uniqueConstraintName}\` FOR (n:\`${template._id}\`)
              REQUIRE (n.${serialProperty}) IS NODE KEY
            `);
                        } catch (error) {
                            console.error(
                                `Failed to create unique constraints in template: ${template._id} property: ${serialProperty}! some properties probably not unique, error: ${error}`,
                            );
                        }
                    }
                } else {
                    await tx.run(`
            CREATE CONSTRAINT \`${requiredConstraintName}\` FOR (n:\`${template._id}\`)
            REQUIRE (n.${serialProperty}) IS NOT NULL
          `);
                    await tx.run(`
            CREATE CONSTRAINT \`${uniqueConstraintName}\` FOR (n:\`${template._id}\`)
            REQUIRE (n.${serialProperty}) IS NODE KEY
          `);
                }
            }
        }
    });
};

const getDBSerialNumbers = async (dbName) => {
    const db = mongoose.connection.client.db(dbName);
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((col) => col.name);

    if (collectionNames.includes(mongo.templatesCollection)) {
        console.log(`Applying aggregation to ${dbName}.${mongo.templatesCollection}`);

        const pipeline = getSerialPropsAggregation;
        const results = await db.collection(mongo.templatesCollection).aggregate(pipeline).toArray();

        return { dbName, templates: results };
    }

    return null;
};

const getSerialPropertiesFromTemplate = async (dbList) => {
    const data = [];

    await Promise.all(
        dbList.map(async (database) => {
            const dbName = database.name;

            const newData = await getDBSerialNumbers(dbName);
            if (newData) data.push(newData);
        }),
    );

    console.log('updated serial numbers properties constraints:', data);

    return data;
};

const serialNumbersNeo = async (driver, data) => {
    try {
        await Promise.all(
            data.map(async (db) => {
                const session = driver.session({ database: `workspace-${db.dbName}` });

                try {
                    await SerialNumberNeoScript(db.templates, session);
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

        const data = await getSerialPropertiesFromTemplate(dbList);

        await serialNumbersNeo(neoDriver, data);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connections.forEach((conn) => conn.close());
    }
};

main().then(() => {
    console.log('unique constraints all serial numbers in neo and mongo');
});
