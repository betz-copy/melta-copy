import { logger } from 'elastic-apm-node';
import config from '../../config';
import { ServiceError } from '../../express/error';
import { IMongoProcessInstancePopulated, ProcessInstanceDocument } from '../../express/instances/processes/interface';
import ElasticClient from './index';

const { elastic } = config;

function createProcessTextChain(obj: IMongoProcessInstancePopulated | ProcessInstanceDocument, valuesString: string[] = []) {
    function recursiveHelper(value?: object | null, currentKey: string | null = null) {
        if (currentKey && elastic.excludedKeys.includes(currentKey.toString())) return;

        if (value === null || value === undefined) return;

        if (typeof value === 'object') {
            if (Array.isArray(value)) {
                value.forEach((item) => recursiveHelper(item));
            } else if (value instanceof Date) {
                valuesString.push(value.toISOString());
            } else {
                Object.entries(value).forEach(([key, val]) => recursiveHelper(val, key));
            }
        } else {
            valuesString.push(String(value));
        }
    }

    recursiveHelper(obj);
    return valuesString.join(' ');
}
const createDocumentOnElastic = async (process: IMongoProcessInstancePopulated | ProcessInstanceDocument) => {
    try {
        const clientInstance: ElasticClient = ElasticClient.getInstance();
        const elkClient = clientInstance.getClient();

        const valuesString = createProcessTextChain(process);

        await elkClient.index({
            index: elastic.index,
            id: process._id,
            body: {
                name: process.name,
                processTextChain: valuesString.trim(),
            },
        });
    } catch (error) {
        logger.error({ error });
    }
};

const updateDocumentOnElastic = async (process: IMongoProcessInstancePopulated) => {
    try {
        const clientInstance: ElasticClient = ElasticClient.getInstance();
        const elkClient = clientInstance.getClient();

        const exists = await elkClient.exists({
            index: elastic.index,
            id: process._id,
        });
        if (!exists) throw new ServiceError(404, 'process not exist');

        const valuesString = createProcessTextChain(process);

        await elkClient.update({
            index: elastic.index,
            id: process._id,
            body: {
                doc: {
                    name: process.name,
                    processTextChain: valuesString.trim(),
                },
            },
        });
    } catch (err) {
        logger.error({ err });
    }
};

const deleteDocumentOnElastic = async (processId: string) => {
    try {
        const clientInstance: ElasticClient = ElasticClient.getInstance();
        const elkClient = clientInstance.getClient();

        await elkClient.delete({
            index: elastic.index,
            id: processId,
        });
    } catch (error) {
        logger.error({ error });
    }
};

const processGlobalSearch = async (searchText: string, skip: number, limit: number) => {
    try {
        const clientInstance: ElasticClient = ElasticClient.getInstance();
        const elkClient = clientInstance.getClient();
        const processes = await elkClient.search({
            index: elastic.index,
            body: {
                query: {
                    bool: {
                        should: [
                            {
                                query_string: {
                                    query: `*${searchText}*`,
                                    fields: ['name^100', 'processTextChain^1'],
                                    analyze_wildcard: true,
                                    default_operator: 'AND',
                                },
                            },
                        ],
                    },
                },
                sort: ['_score'],
                from: skip,
                size: limit,
            },
        });

        return processes.hits.hits.map(({ _id }) => _id);
    } catch (error) {
        console.error('Error searching in Elasticsearch:', error);
        // return [];
        throw error;
    }
};

export { createDocumentOnElastic, deleteDocumentOnElastic, processGlobalSearch, updateDocumentOnElastic };
