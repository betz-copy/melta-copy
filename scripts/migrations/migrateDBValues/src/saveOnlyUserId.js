import mongoose from 'mongoose';
import neo4j from 'neo4j-driver';
import config from './config/index.js';

const { mongo, neo } = config;

export const getKartoffelPropsAggregation = [
    {
        $set: {
            kartoffelKeys: {
                $map: {
                    input: {
                        $filter: {
                            input: { $objectToArray: '$properties.properties' },
                            as: 'property',
                            cond: {
                                $eq: ['$$property.v.format', 'kartoffelUserField'],
                            },
                        },
                    },
                    as: 'filteredProperty',
                    in: '$$filteredProperty.k',
                },
            },
            userKeys: {
                $map: {
                    input: {
                        $filter: {
                            input: { $objectToArray: '$properties.properties' },
                            as: 'property',
                            cond: {
                                $eq: ['$$property.v.format', 'user'],
                            },
                        },
                    },
                    as: 'filteredProperty',
                    in: '$$filteredProperty.k',
                },
            },
            usersKeys: {
                $map: {
                    input: {
                        $filter: {
                            input: { $objectToArray: '$properties.properties' },
                            as: 'property',
                            cond: {
                                $eq: ['$$property.v.items.format', 'user'],
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
            $or: [{ kartoffelKeys: { $ne: [] } }, { userKeys: { $ne: [] } }, { usersKeys: { $ne: [] } }],
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
            kartoffelKeys: 1,
            usersKeys: 1,
            userKeys: 1,
        },
    },
];

const transformNeoScript = async (mongoResult, session) => {
    await session.writeTransaction(async (tx) => {
        for (const template of mongoResult) {
            for (const kartoffelKey of template.kartoffelKeys) {
                const removeKartoffelKeyQuery = `
                    MATCH (n:\`${template._id}\`)
                    WHERE n.\`${kartoffelKey}\` IS NOT NULL
                    REMOVE n.\`${kartoffelKey}\`
                `;

                await tx.run(removeKartoffelKeyQuery);
                console.log(`removed kartoffel field ${kartoffelKey} in template ${template._id}`);
            }

            for (const userKey of template.userKeys) {
                const oldUserProperty = `${userKey}.id_userField`;
                const findOldConstraintQuery = `
                    SHOW CONSTRAINTS
                    YIELD name, type, entityType, labelsOrTypes, properties
                    WHERE type = 'NODE_PROPERTY_EXISTENCE'
                      AND entityType = 'NODE'
                      AND labelsOrTypes = [$label]
                      AND properties = [$property]
                    RETURN name
                `;

                const oldConstraintsResult = await tx.run(findOldConstraintQuery, {
                    label: template._id,
                    property: oldUserProperty,
                });

                for (const record of oldConstraintsResult.records) {
                    const constraintName = record.get('name');
                    const dropConstraintQuery = `DROP CONSTRAINT \`${constraintName}\``;
                    await tx.run(dropConstraintQuery);
                    console.log(`dropped constraint ${constraintName} on ${oldUserProperty} in template ${template._id}`);
                }

                const createNewConstraintQuery = `
                    CREATE CONSTRAINT IF NOT EXISTS
                    FOR (n:\`${template._id}\`)
                    REQUIRE n.\`${userKey}\` IS NOT NULL
                `;

                await tx.run(createNewConstraintQuery);
                console.log(`ensured constraint on ${userKey} in template ${template._id}`);

                const transformUserQuery = `
                    MATCH (n:\`${template._id}\`)
                    WHERE n.\`${userKey}.id_userField\` IS NOT NULL 
                       OR n.\`${userKey}\` IS NOT NULL
                    
                    WITH n, COALESCE(n.\`${userKey}.id_userField\`, n.\`${userKey}\`) AS extractedId
                    
                    // Identify junk properties
                    WITH n, extractedId, 
                         [prop IN keys(n) WHERE prop STARTS WITH $keyName + "." OR prop STARTS WITH $keyName + "_"] AS keysToRemove
                    
                    // Use APOC to remove junk properties dynamically
                    CALL apoc.create.setProperties(n, keysToRemove, [k IN keysToRemove | null]) YIELD node
                    
                    // Set the clean ID to the base property name
                    WITH node, extractedId
                    CALL apoc.create.setProperty(node, $keyName, extractedId) YIELD node as finalNode
                    RETURN count(finalNode)
                `;

                await tx.run(transformUserQuery, { keyName: userKey });
                console.log(`transformed user field ${userKey} in template ${template._id}`);
            }

            for (const usersKey of template.usersKeys) {
                const transformUsersQuery = `
                    MATCH (n:\`${template._id}\`)
                    WHERE n.\`${usersKey}.ids_usersFields\` IS NOT NULL
                    
                    WITH n, n.\`${usersKey}.ids_usersFields\` AS extractedIds
                    
                    WITH n, extractedIds, 
                         [p IN keys(n) WHERE p STARTS WITH $keyName + "." OR p STARTS WITH $keyName + "_"] AS keysToRemove
                    
                    // Use APOC to remove junk arrays dynamically
                    CALL apoc.create.setProperties(n, keysToRemove, [k IN keysToRemove | null]) YIELD node
                    
                    // Set the base key to the clean array of strings
                    WITH node, extractedIds
                    CALL apoc.create.setProperty(node, $keyName, extractedIds) YIELD node as finalNode
                    RETURN count(finalNode)
                `;

                await tx.run(transformUsersQuery, { keyName: usersKey });
                console.log(`transformed users field ${usersKey} in template ${template._id}`);
            }
        }
    });
};

const transformNeo = async (driver, data) => {
    try {
        await Promise.all(
            data.map(async (db) => {
                const session = driver.session({ database: `workspace-${db.dbName}` });

                try {
                    await transformNeoScript(db.templates, session);
                } catch (error) {
                    console.error('Error fetching nodes:', error);
                } finally {
                    await session.close();
                }
            }),
        );

        console.log('finish transform neo');
    } catch (err) {
        console.error('Unexpected error:', err);
    } finally {
        await driver.close();
    }
};

const getDBKartoffelProperties = async (dbName) => {
    const db = mongoose.connection.client.db(dbName);
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((col) => col.name);

    if (collectionNames.includes(mongo.templatesCollection)) {
        console.log(`Applying aggregation to ${dbName}.${mongo.templatesCollection}`);

        const pipeline = getKartoffelPropsAggregation;
        const results = await db.collection(mongo.templatesCollection).aggregate(pipeline).toArray();

        return { dbName, templates: results };
    }

    return null;
};

const getKartoffelPropertiesFromTemplate = async (dbList) => {
    const data = [];

    await Promise.all(
        dbList.map(async (database) => {
            const dbName = database.name;

            const newData = await getDBKartoffelProperties(dbName);
            if (newData) data.push(newData);
        }),
    );

    console.log('getKartoffelPropertiesFromTemplate:');
    console.dir({ data }, { depth: null });

    return data;
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

        const data = await getKartoffelPropertiesFromTemplate(dbList);

        await transformNeo(neoDriver, data);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connections.forEach((conn) => {
            conn.close();
        });
    }
};

main().then(() => {
    console.log('refactor all user, users, and kartoffel properties in neo and mongo');
});
