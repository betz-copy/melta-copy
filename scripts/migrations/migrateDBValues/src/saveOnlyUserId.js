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
    const buildCreateConstraintQuery = (constraint, newProperties) => {
        const name = constraint.get('name');
        const type = constraint.get('type');
        const labelsOrTypes = constraint.get('labelsOrTypes');
        const entityType = constraint.get('entityType');
        const label = labelsOrTypes[0];
        const nodeVar = entityType === 'NODE' ? 'n' : 'r';
        const forClause = entityType === 'NODE' ? `FOR (\`${nodeVar}\`:\`${label}\`)` : `FOR ()-[\`${nodeVar}\`:\`${label}\`]-()`;

        if (type === 'NODE_PROPERTY_EXISTENCE') {
            return {
                name,
                query: `
                CREATE CONSTRAINT \`${name}\` IF NOT EXISTS
                ${forClause}
                REQUIRE ${nodeVar}.\`${newProperties[0]}\` IS NOT NULL
                `,
            };
        }

        if (type === 'NODE_KEY') {
            return {
                name,
                query: `
                CREATE CONSTRAINT \`${name}\` IF NOT EXISTS
                ${forClause}
                REQUIRE (${nodeVar}.\`${newProperties}\`) IS NODE KEY
                `,
            };
        }

        return null;
    };

    for (const template of mongoResult) {
        const constraintResult = await session.run('SHOW CONSTRAINTS');
        const constraintsToDrop = [];
        const createConstraintsQueries = [];

        for (const userKey of template.userKeys) {
            const constraintsToDelete = [];
            constraintResult.records.forEach((record) => {
                const constraintProperties = record.get('properties');
                constraintProperties.forEach((property) => {
                    if (property === `${userKey}.id_userField`) {
                        constraintsToDelete.push(record);
                    }
                });
            });

            for (const constraint of constraintsToDelete) {
                const properties = constraint.get('properties');
                const newProperties = properties.map((prop) => {
                    if (prop === `${userKey}.id_userField`) {
                        return userKey;
                    }
                    return prop;
                });

                const create = buildCreateConstraintQuery(constraint, newProperties);
                if (create) createConstraintsQueries.push(create);

                constraintsToDrop.push(constraint.get('name'));
            }
        }

        for (const usersKey of template.usersKeys) {
            const constraintsToDelete = [];
            constraintResult.records.forEach((record) => {
                const constraintProperties = record.get('properties');
                constraintProperties.forEach((property) => {
                    if (property === `${usersKey}.ids_usersFields`) {
                        constraintsToDelete.push(record);
                    }
                });
            });

            for (const constraint of constraintsToDelete) {
                const properties = constraint.get('properties');
                const newProperties = properties.map((prop) => {
                    if (prop === `${usersKey}.ids_usersFields`) {
                        return usersKey;
                    }
                    return prop;
                });

                const create = buildCreateConstraintQuery(constraint, newProperties);
                if (create) createConstraintsQueries.push(create);

                constraintsToDrop.push(constraint.get('name'));
            }
        }

        if (constraintsToDrop.length > 0) {
            await session.writeTransaction(async (tx) => {
                for (const name of constraintsToDrop) {
                    await tx.run(`DROP CONSTRAINT \`${name}\``);
                    console.log(`Dropped constraint ${name}`);
                }
            });
        }

        await session.writeTransaction(async (tx) => {
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
        });

        if (createConstraintsQueries.length > 0) {
            await session.writeTransaction(async (tx) => {
                for (const { name, query } of createConstraintsQueries) {
                    await tx.run(query);
                    console.log(`Recreated constraint ${name} with updated property names`);
                }
            });
        }
    }
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
