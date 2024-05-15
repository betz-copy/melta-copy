import { logger } from 'elastic-apm-node';
import { Document, LeanDocument } from 'mongoose';
import { IMongoProcessInstancePopulated, IProcessInstance } from '../../express/instances/processes/interface';
import ElasticClient from './index';
import { ServiceError } from '../../express/error';

const createProcessTextChainToSearch = (process: LeanDocument<IProcessInstance & Document<any, any, any>> | IMongoProcessInstancePopulated) => {
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
                ProcessTextChain: valuesString.trim(),
            },
        })
        .catch((error) => logger.log(error));
};

const updateDocumentOnElastic = async (process: LeanDocument<IProcessInstance & Document<any, any, any>> | IMongoProcessInstancePopulated) => {
    const elasticClient = ElasticClient.getClient();
    const valuesString = createProcessTextChainToSearch(process);
    const exists = await elasticClient.exists({
        index: 'process-search',
        id: process._id,
    });
    if (!exists) throw new ServiceError(404, 'process not exist');
    await elasticClient
        .update({
            index: 'process-search',
            id: process._id,
            body: {
                doc: {
                    ProcessTextChain: valuesString.trim(),
                },
            },
        })
        .catch((error) => logger.log(error));
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

export { deleteDocumentOnElastic, createDocumentOnElastic, updateDocumentOnElastic };
