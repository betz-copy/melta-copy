import { fromZonedTime } from 'date-fns-tz';
import Neo4j, { Node, QueryResult } from 'neo4j-driver';
import config from '../config';

const { url, auth } = config.neo4j;

// biome-ignore lint/suspicious/noExplicitAny: it's a script, who cares
export type IPropertyValue = any;
export interface IEntity {
    templateId: string;
    properties: Record<string, IPropertyValue>;
}

export const initializeNeo = async () => {
    const driver = Neo4j.driver(url, Neo4j.auth.basic(auth.username, auth.password), { disableLosslessIntegers: true });

    await driver.verifyConnectivity();

    console.log('[NEO4J]: client initialized');
    return driver;
};

type ResponseType = 'singleResponse' | 'singleResponseNotNullable' | 'multipleResponses';
type Response<ResType extends ResponseType, Data> = ResType extends 'singleResponse'
    ? Data | null
    : ResType extends 'singleResponseNotNullable'
      ? Data
      : ResType extends 'multipleResponses'
        ? Data[]
        : never;

export const formatDate = (date: string) => {
    return date.slice(0, 10);
};

const normalizeFields = (properties: Record<string, IPropertyValue>): Record<string, IPropertyValue> => {
    const props = {};

    Object.entries(properties).forEach(([key, value]) => {
        if (key.endsWith(config.neo4j.stringPropertySuffix)) return;

        if (value instanceof Neo4j.types.LocalDateTime) {
            props[key] = fromZonedTime(new Date(value.toString()), 'Asia/Jerusalem').toISOString();

            return;
        }

        if (value instanceof Neo4j.types.Date) {
            props[key] = formatDate(value.toString());

            return;
        }

        props[key] = value;
    });

    return props;
};

const nodeToEntity = (node: Node): IEntity => {
    const entity = {
        templateId: node.labels[0],
        properties: normalizeFields(node.properties),
    };

    return entity;
};

export const normalizeReturnedEntity =
    <T extends ResponseType>(response: T) =>
    (records: QueryResult['records']): Response<T, IEntity> => {
        const entities = records.map((record) => nodeToEntity(record.get(0) as Node));

        if (response === 'singleResponse' || response === 'singleResponseNotNullable') {
            return (entities.length > 0 ? entities[0] : null) as Response<T, IEntity>;
        }

        return entities as Response<T, IEntity>;
    };
