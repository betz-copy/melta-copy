import { Driver, Record, Session } from 'neo4j-driver';
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
    WHERE $templateId IN labels(n)
    RETURN ${fileProperties.map((fileProperty) => `n.${fileProperty} as ${fileProperty}`).join(', ')}
    `;
    const records = await runCypherQuery(session, listFilesQuery, { templateId });
    const kaki = [
        ...new Set(
            records
                .map((record: Record) => {
                    return (record as any)._fields[0];
                })
                .filter((fileId) => !!fileId),
        ),
    ];
    return kaki;
};

export const runCypherQuery = async (session, cypherQuery, normalizeFunction, parameters = {}) => {
    const result = session.performTransaction('readTransaction', normalizeFunction, cypherQuery, parameters);
    return result?.records;
};
