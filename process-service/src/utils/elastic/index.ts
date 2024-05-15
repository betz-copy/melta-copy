import { Client } from '@elastic/elasticsearch';
// import { once } from 'events';

class ElasticClient {
    private elasticClient: Client;

    async initialize(url: string) {
        this.elasticClient = new Client({
            node: url,
        });
    }

    getClient() {
        return this.elasticClient;
    }
}

export default new ElasticClient();
