import { Driver, Session } from 'neo4j-driver';
import { IEntity, normalizeReturnedEntity } from '../../utils/neo4j';
import config from '../../config';

const {
    neo4j: { workspaceNamePrefix },
} = config;

export const getEntitiesByTemplate = async (session: Session, templateId: string): Promise<IEntity[]> => {
    const getEntitiesByTemplateQuery = `
    MATCH (n)
    WHERE n.templateId = $templateId
    RETURN n
    `;
    const records = await runCypherQuery(session, getEntitiesByTemplateQuery, { templateId });

    return normalizeReturnedEntity('multipleResponses')(records);
};

export const listFilesInDB = async (driver: Driver, workspaceId: string, templateId: string, fileProperties: string[]): Promise<any[]> => {
    const session = driver.session({ database: `${workspaceNamePrefix}${workspaceId}` });

    const listFilesQuery = `
    MATCH (n)
    WHERE $templateId IN labels(node)
    RETURN n, ${fileProperties.join(', ')}
    `;
    const records = await runCypherQuery(session, listFilesQuery, { templateId });
    return normalizeReturnedEntity('multipleResponses')(records);
};

export const runCypherQuery = async (session, cypherQuery, parameters = {}) => {
    const result = await session.readTransaction((tx) => tx.run(cypherQuery, parameters));
    return result?.records;
};
