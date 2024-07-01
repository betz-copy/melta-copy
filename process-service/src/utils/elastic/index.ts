import { Client } from '@elastic/elasticsearch';
import logger from '../logger/logsLogger';

class ElasticClient {
    private static instance: ElasticClient;

    private elasticClient: Client | null;

    private constructor() {
        this.elasticClient = null;
    }

    static getInstance(): ElasticClient {
        if (!ElasticClient.instance) {
            ElasticClient.instance = new ElasticClient();
        }
        return ElasticClient.instance;
    }

    async initialize(url: string): Promise<void> {
        try {
            this.elasticClient = new Client({
                node: url,
            });
            logger.info('ElasticSearch client initialized successfully');
        } catch (error) {
            logger.error('Error initializing ElasticSearch client:', error);
            throw error;
        }
    }

    getClient(): Client {
        if (!this.elasticClient) {
            throw new Error('ElasticSearch client has not been initialized. Call initialize() first.');
        }
        return this.elasticClient;
    }
}
export default ElasticClient;
