import ElasticClient from '.';

export default abstract class DefaultManagerElastic {
    public elasticClient: ElasticClient;

    constructor(protected workspaceId: string) {
        this.elasticClient = new ElasticClient(workspaceId);
    }
}
