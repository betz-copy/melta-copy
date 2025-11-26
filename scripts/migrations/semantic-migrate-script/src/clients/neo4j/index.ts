import { Driver, Session } from 'neo4j-driver';
import config from '../../config';
import { IEntity, normalizeReturnedEntity } from '../../utils/neo4j';

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

export const listFilesInDB = async (
    driver: Driver,
    workspaceId: string,
    templateId: string,
    fileProperties: string[],
): Promise<{ _id: string; files: string[] }[]> => {
    const session = driver.session({ database: `${workspaceNamePrefix}${workspaceId}` });

    const listFilesQuery = `
    MATCH (n)
    WHERE $templateId IN labels(n)
    RETURN n._id AS _id, ${fileProperties.map((fileProperty) => `n.${fileProperty} as ${fileProperty}`).join(', ')}
    `;
    const records = await runCypherQuery(session, listFilesQuery, { templateId });
    return records.map((record) =>
        record.keys.reduce((acc, key, index) => {
            if (key === '_id') {
                acc._id = record._fields[index];
            } else {
                if (!acc?.files) acc.files = [];

                acc.files.push(record._fields[index]);
            }

            return acc;
        }, {}),
    );
};

export const runCypherQuery = async (session, cypherQuery, parameters = {}) => {
    const result = await session.readTransaction((tx) => tx.run(cypherQuery, parameters));
    return result?.records;
};
