import Neo4j, { Driver, Session } from "neo4j-driver";
import config from "../config";
const { neo4j: { url, auth } } = config;

export const initializeNeo = async() => {
    const driver = Neo4j.driver(url, Neo4j.auth.basic(auth.username, auth.password), { disableLosslessIntegers: true });

    await driver.verifyConnectivity();

    console.log('[NEO4J]: client initialized');
    return driver;
}

export const listDatabases = async (session: Session): Promise<any[]> => {
    const listDatabasesQuery = 'SHOW DATABASES';
    return runCypherQuery(session, listDatabasesQuery);
};

export const listFilesInDB = async (driver: Driver, DbName: string): Promise<any[]> => {
    const session = driver.session({ database: DbName });
    const listFilesQuery = `
    MATCH (n)
    WHERE
    RETURN n, labels(n) AS templateId
    `;
    return runCypherQuery(session, listFilesQuery);
};


export const runCypherQuery = async (session, cypherQuery, parameters = {}) => {
    const result = await session.readTransaction((tx) => tx.run(cypherQuery, parameters));
    return result?.records;
};
