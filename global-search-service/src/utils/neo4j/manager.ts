import Neo4jClient from './neo4j';

export default abstract class DefaultManagerNeo4j {
    public neo4jClient: Neo4jClient;

    constructor(workspaceId: string) {
        this.neo4jClient = new Neo4jClient(workspaceId);
    }
}
