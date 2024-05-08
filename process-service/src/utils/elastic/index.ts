import { Client } from '@elastic/elasticsearch';

class ElasticClient {
    private elasticClient: any;

    async initialize(url: string) {
        this.elasticClient = new Client({
            node: url,
            // auth: {
            //     apiKey: {
            //         // API key ID and secret
            //         id: 'foo',
            //         api_key: 'bar',
            //     },
            // },
        });
    }

    getClient() {
        console.log('hdfkrnhikeshnv', this.elasticClient);

        return this.elasticClient;
    }
}

export default new ElasticClient();

// import { Client } from '@elastic/elasticsearch';

// const elasticClient = new Client({
//     node: 'http://elastic:9200',
//     // auth: {
//     //     apiKey: {
//     //         // API key ID and secret
//     //         id: 'foo',
//     //         api_key: 'bar',
//     //     },
//     // },
// });

// export default elasticClient;
