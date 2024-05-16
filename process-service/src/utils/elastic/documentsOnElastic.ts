import { logger } from 'elastic-apm-node';
import { Document, LeanDocument } from 'mongoose';
import { IMongoProcessInstancePopulated, IProcessInstance } from '../../express/instances/processes/interface';
import ElasticClient from './index';
import { ServiceError } from '../../express/error';

const createProcessTextChainToSearch = (process: object) => {
    let values = '';
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of Object.entries(process)) {
        if (key !== '_id' && key !== 'templateId' && key !== 'reviewers') {
            if (typeof value === 'object' && !Array.isArray(value)) {
                values += createProcessTextChainToSearch(value);
            } else if (Array.isArray(value)) {
                // eslint-disable-next-line no-loop-func
                value.forEach((item) => {
                    values += createProcessTextChainToSearch(item);
                });
            } else {
                values += `${value} `;
            }
        }
    }

    return values;
};

const createDocumentOnElastic = async (process: IMongoProcessInstancePopulated) => {
    const elasticClient = ElasticClient.getClient();

    const valuesString = createProcessTextChainToSearch(process);

    await elasticClient
        .index({
            index: 'process-search',
            id: process._id,
            body: {
                processTextChain: valuesString.trim(),
            },
        })
        .catch((error) => logger.log(error));
};

const updateDocumentOnElastic = async (process: LeanDocument<IProcessInstance & Document<any, any, any>> | IMongoProcessInstancePopulated) => {
    try {
        const elasticClient = ElasticClient.getClient();

        const exists = await elasticClient.exists({
            index: 'process-search',
            id: process._id,
        });
        if (!exists) throw new ServiceError(404, 'process not exist');

        const valuesString = createProcessTextChainToSearch(process);
        await elasticClient.update({
            index: 'process-search',
            id: process._id,
            body: {
                doc: {
                    processTextChain: valuesString.trim(),
                },
            },
        });
    } catch (err) {
        logger.log({ err });
    }
};

const deleteDocumentOnElastic = async (processId: string) => {
    const elasticClient = ElasticClient.getClient();
    const exists = await elasticClient.exists({
        index: 'process-search',
        id: processId,
    });
    if (!exists) throw new ServiceError(404, 'process not exist');

    await elasticClient
        .delete({
            index: 'process-search',
            id: processId,
        })
        .catch((error) => logger.log(error));
};
const processGlobalSearch = async (searchText: string) => {
    const elasticClient = ElasticClient.getClient();
    const processes = await elasticClient.search({
        index: 'process-search',
        query: {
            bool: {
                should: [
                    {
                        match: {
                            processTextChain: {
                                query: searchText,
                                minimum_should_match: '75%',
                            },
                        },
                    },
                    {
                        wildcard: {
                            processTextChain: `*${searchText}*`,
                        },
                    },
                ],
            },
        },
    });

    return processes.hits.hits.map(({ _id }) => _id);
};

export { deleteDocumentOnElastic, createDocumentOnElastic, updateDocumentOnElastic, processGlobalSearch };
