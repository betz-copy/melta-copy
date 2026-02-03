import mongoose from 'mongoose';
import neo4j from 'neo4j-driver';
import config from './config/index.js';

const { mongo, neo } = config;

/**
 * The Cypher logic:
 * 1. Find nodes with the suffix keys.
 * 2. Identify the prefix (e.g., 'user' from 'user.id_userField').
 * 3. Map the ID to the clean prefix key.
 * 4. Delete all properties ending in the metadata suffixes.
 */
const cleanupUserFieldsCypher = `
  MATCH (n)
  WITH n, keys(n) AS allKeys
  
  // Identify keys to transform and keys to delete
  WITH n, allKeys,
       [k IN allKeys WHERE k ENDS WITH '.id_userField' OR k ENDS WITH '.ids_usersFields'] AS idKeys,
       [k IN allKeys WHERE k CONTAINS '_userField' OR k CONTAINS '_usersFields'] AS keysToDelete

  WHERE size(idKeys) > 0 OR size(keysToDelete) > 0

  // 1. Set the Clean ID Properties
  FOREACH (idKey IN idKeys |
    SET n[split(idKey, '.')[0]] = n[idKey]
  )

  // 2. Remove all metadata properties
  WITH n, keysToDelete
  CALL apoc.create.removeProperties(n, keysToDelete)
  RETURN count(n) as updatedCount
`;

const getKartoffelUserFieldTemplates = async (dbName) => {
    const db = mongoose.connection.client.db(dbName);
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((col) => col.name);

    if (!collectionNames.includes(mongo.templatesCollection)) return [];

    const pipeline = [
        {
            $project: {
                _id: 1,
                properties: { $objectToArray: '$properties.properties' },
            },
        },
        {
            $project: {
                _id: 1,
                kartoffelKeys: {
                    $map: {
                        input: {
                            $filter: {
                                input: '$properties',
                                as: 'property',
                                cond: { $eq: ['$$property.v.format', 'kartoffelUserField'] },
                            },
                        },
                        as: 'property',
                        in: '$$property.k',
                    },
                },
            },
        },
        { $match: { kartoffelKeys: { $ne: [] } } },
    ];

    return db.collection(mongo.templatesCollection).aggregate(pipeline).toArray();
};

const getKartoffelUserFieldKeys = async (dbList) => {
    const data = [];

    await Promise.all(
        dbList.map(async (database) => {
            const dbName = database.name;
            const templates = await getKartoffelUserFieldTemplates(dbName);

            if (templates.length) {
                data.push({ dbName, templates });
            }
        }),
    );

    return data;
};

const runCleanupOnDatabase = async (driver, dbName) => {
    const session = driver.session({ database: dbName });
    try {
        console.log(`Starting cleanup on database: ${dbName}`);
        const result = await session.writeTransaction((tx) => tx.run(cleanupUserFieldsCypher));
        const updatedCount = result.records[0]?.get('updatedCount').toNumber() || 0;
        console.log(`Successfully updated ${updatedCount} nodes in ${dbName}`);
    } catch (error) {
        console.error(`Error cleaning up database ${dbName}:`, error.message);
    } finally {
        await session.close();
    }
};

const removeKartoffelUserFieldProps = async (driver, dbName, templates) => {
    const session = driver.session({ database: `workspace-${dbName}` });

    try {
        console.log(`Starting kartoffelUserField cleanup on database: workspace-${dbName}`);

        for (const template of templates) {
            if (!template.kartoffelKeys?.length) continue;

            const cypher = `
                MATCH (n:\`${template._id}\`)
                WITH n
                CALL apoc.create.removeProperties(n, $keys) YIELD node
                RETURN count(node) as updatedCount
            `;

            const result = await session.writeTransaction((tx) => tx.run(cypher, { keys: template.kartoffelKeys }));
            const updatedCount = result.records[0]?.get('updatedCount').toNumber() || 0;

            console.log(`Removed kartoffelUserField props from ${updatedCount} nodes in ${dbName} for template ${template._id}`);
        }
    } catch (error) {
        console.error(`Error cleaning kartoffelUserField props in ${dbName}:`, error.message);
    } finally {
        await session.close();
    }
};

const connectToMongo = async () => {
    await mongoose.connect(mongo.uri);

    console.log('Connected to MongoDB');
};

const connectToNeo = async () => {
    const driver = neo4j.driver(neo.uri, neo4j.auth.basic(neo.user, neo.password));
    try {
        await driver.verifyConnectivity();
        console.log('Connected to Neo4j');
        return driver;
    } catch (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
};

const listDatabasesWithMongoose = async () => {
    const adminDb = mongoose.connection.db.admin();
    const result = await adminDb.listDatabases();
    return result.databases;
};

const getAllDatabases = async (driver) => {
    const session = driver.session({ database: 'system' });
    try {
        const result = await session.run('SHOW DATABASES YIELD name');
        // Filter out system database
        return result.records.map((record) => record.get('name')).filter((name) => name !== 'system');
    } finally {
        await session.close();
    }
};

const main = async () => {
    let driver;
    try {
        await connectToMongo();
        driver = await connectToNeo();

        const mongoDbList = await listDatabasesWithMongoose();
        const kartoffelData = await getKartoffelUserFieldKeys(mongoDbList);
        const neoDbList = await getAllDatabases(driver);
        const neoDbSet = new Set(neoDbList);

        for (const db of kartoffelData) {
            const neoDbName = `workspace-${db.dbName}`;

            if (!neoDbSet.has(neoDbName)) {
                console.log(`Skipping ${neoDbName} (not found in Neo4j)`);
                continue;
            }

            await removeKartoffelUserFieldProps(driver, db.dbName, db.templates);
        }

        console.log('--- kartoffelUserField cleanup finished ---');

        // Run existing cleanup on all Neo4j databases
        for (const dbName of neoDbList) {
            await runCleanupOnDatabase(driver, dbName);
        }

        console.log('--- All database cleanups finished ---');
    } catch (error) {
        console.error('Main loop error:', error);
    } finally {
        if (driver) {
            await driver.close();
        }
        mongoose.connections.forEach((conn) => {
            conn.close();
        });
    }
};

main();
