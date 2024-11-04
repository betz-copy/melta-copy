import { Driver, Session } from 'neo4j-driver';
import { IEntity, normalizeReturnedEntity } from '../../utils/neo4j';

export const getEntitiesByTemplate = async (session: Session, templateId: string): Promise<IEntity[]> => {
    const getEntitiesByTemplateQuery = `
    MATCH (n)
    WHERE n.templateId = $templateId
    RETURN n
    `;
    const records = await runCypherQuery(session, getEntitiesByTemplateQuery, { templateId });

    return normalizeReturnedEntity('multipleResponses')(records);
};

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
