import { Client } from '@elastic/elasticsearch';

class ElasticClient {
    private elasticClient;

    async initialize(url: string) {
        this.elasticClient = new Client({
            node: url,
            // auth: {
            //     apiKey: {
            //         id: '',
            //         api_key: '',
            //     },
            // },
        });
    }

    getClient() {
        return this.elasticClient;
    }
}

export default new ElasticClient();
