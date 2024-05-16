import { Client } from '@elastic/elasticsearch';

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
