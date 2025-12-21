import { IMongoProcessInstancePopulated, ProcessInstanceDocument } from '@packages/process';
import { ServiceError } from '@packages/utils';
import { logger } from 'elastic-apm-node';
import config from '../../config';
import DefaultManagerElastic from './manager';

const { elastic } = config;

class ElasticSearchManager extends DefaultManagerElastic {
    private createProcessTextChain(obj: IMongoProcessInstancePopulated | ProcessInstanceDocument, valuesString: string[] = []) {
        const recursiveHelper = (value?: object | null, currentKey: string | null = null) => {
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
        };

        recursiveHelper(obj);
        return valuesString.join(' ');
    }

    async createDocumentOnElastic(process: IMongoProcessInstancePopulated | ProcessInstanceDocument) {
        try {
            const valuesString = this.createProcessTextChain(process);

            await this.elasticClient.index({
                id: process._id,
                document: {
                    name: process.name,
                    processTextChain: valuesString.trim(),
                },
            });
        } catch (error) {
            logger.error({ error });
        }
    }

    async updateDocumentOnElastic(process: IMongoProcessInstancePopulated) {
        try {
            const exists = await this.elasticClient.exists({ id: process._id });
            if (!exists) throw new ServiceError(404, 'process not exist');

            const valuesString = this.createProcessTextChain(process);

            await this.elasticClient.update({
                id: process._id,
                doc: {
                    name: process.name,
                    processTextChain: valuesString.trim(),
                },
            });
        } catch (err) {
            logger.error({ err });
        }
    }

    async deleteDocumentOnElastic(processId: string) {
        try {
            await this.elasticClient.delete({ id: processId });
        } catch (error) {
            logger.error({ error });
        }
    }

    async processGlobalSearch(searchText: string, count: number) {
        const processes = await this.elasticClient.search({
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
            from: 0,
            size: count,
        });

        return processes.hits.hits.map(({ _id }) => _id);
    }
}

export default ElasticSearchManager;
