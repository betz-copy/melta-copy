import { logger } from 'elastic-apm-node';
import { Document, LeanDocument } from 'mongoose';
import { IMongoProcessInstancePopulated, IProcessInstance, ProcessInstanceDocument } from '../../express/instances/processes/interface';
import ElasticClient from './index';
import { ServiceError } from '../../express/error';
import config from '../../config';

const { elastic } = config;

const createProcessTextChain = (process: object) => {
    let values = '';
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of Object.entries(process)) {
        // eslint-disable-next-line no-continue
        if (['_id', 'templateId', 'reviewers'].includes(key)) continue;
        if (value !== null)
            if (typeof value === 'object') {
                values += createProcessTextChain(value);
            } else if (Array.isArray(value)) {
                // eslint-disable-next-line no-loop-func
                value.forEach((item) => {
                    values += createProcessTextChain(item);
                });
            } else {
                values += `${value} `;
            }
    }

    return values;
};
const createDocumentOnElastic = async (process: IMongoProcessInstancePopulated | LeanDocument<ProcessInstanceDocument>) => {
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

const updateDocumentOnElastic = async (process: LeanDocument<IProcessInstance & Document<any, any, any>> | IMongoProcessInstancePopulated) => {
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

const processGlobalSearch = async (searchText: string) => {
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
                                wildcard: {
                                    name: {
                                        value: `*${searchText}*`,
                                        boost: 2,
                                    },
                                },
                            },
                            {
                                wildcard: {
                                    processTextChain: {
                                        value: `*${searchText}*`,
                                        boost: 1,
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        });

        return processes.hits.hits.map(({ _id }) => _id);
    } catch (error) {
        console.error('Error searching in Elasticsearch:', error);
        return [];
    }
};

export { deleteDocumentOnElastic, createDocumentOnElastic, updateDocumentOnElastic, processGlobalSearch };
