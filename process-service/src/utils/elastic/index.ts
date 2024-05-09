import { Client } from '@elastic/elasticsearch';

class ElasticClient {
    private elasticClient: Client;

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
        console.log('the client: ', this.elasticClient);
        return this.elasticClient;
    }
}

export default new ElasticClient();
