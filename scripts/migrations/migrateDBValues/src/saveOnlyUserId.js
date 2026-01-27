import neo4j from 'neo4j-driver';
import config from './config/index.js';

const { neo } = config;

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
    const driver = await connectToNeo();

    try {
        const dbList = await getAllDatabases(driver);
        console.log('Found databases:', dbList);

        // Run cleanup on all databases
        for (const dbName of dbList) {
            await runCleanupOnDatabase(driver, dbName);
        }

        console.log('--- All database cleanups finished ---');
    } catch (error) {
        console.error('Main loop error:', error);
    } finally {
        await driver.close();
    }
};

main();
