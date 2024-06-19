import { logger } from 'elastic-apm-node';
import { Document, LeanDocument } from 'mongoose';
import { IMongoProcessInstancePopulated, IProcessInstance, ProcessInstanceDocument } from '../../express/instances/processes/interface';
import ElasticClient from './index';
import { ServiceError } from '../../express/error';
import config from '../../config';

const { elasticClient } = config;
const createProcessTextChain = (process: object) => {
    let values = '';
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of Object.entries(process)) {
        // eslint-disable-next-line no-continue
        if (['_id', 'templateId', 'reviewers'].includes(key)) continue;

        if (typeof value === 'object' && !Array.isArray(value)) {
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
        const elkClient = ElasticClient.getClient();

        const valuesString = createProcessTextChain(process);

        await elkClient.index({
            index: elasticClient.index,
            id: process._id,
            body: {
                processTextChain: valuesString.trim(),
            },
        });
    } catch (error) {
        logger.log(error);
    }
};

const updateDocumentOnElastic = async (process: LeanDocument<IProcessInstance & Document<any, any, any>> | IMongoProcessInstancePopulated) => {
    try {
        const elkClient = ElasticClient.getClient();

        const exists = await elkClient.exists({
            index: elasticClient.index,
            id: process._id,
        });
        if (!exists) throw new ServiceError(404, 'process not exist');

        const valuesString = createProcessTextChain(process);
        await elkClient.update({
            index: elasticClient.index,
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
    try {
        const elkClient = ElasticClient.getClient();

        await elkClient.delete({
            index: elasticClient.index,
            id: processId,
        });
    } catch (error) {
        logger.log(error);
    }
};

const processSearchOnELastic = async (searchText: string) => {
    try {
        const elkClient = ElasticClient.getClient();
        const processes = await elkClient.search({
            index: elasticClient.index,
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
    } catch (error) {
        return [];
    }
};

export { deleteDocumentOnElastic, createDocumentOnElastic, updateDocumentOnElastic, processSearchOnELastic as processGlobalSearch };
