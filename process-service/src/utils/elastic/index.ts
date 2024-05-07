import { Client } from '@elastic/elasticsearch';

const elasticClient = new Client({
    node: 'http://elastic:9200',
    // auth: {
    //     apiKey: {
    //         // API key ID and secret
    //         id: 'foo',
    //         api_key: 'bar',
    //     },
    // },
});

const createElasticIndex = async () => {
    await elasticClient.indices.create({ index: 'processSearch' });
};
createElasticIndex();

export default elasticClient;
