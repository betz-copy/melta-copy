import Neo4jClient from './neo4j';

export default abstract class DefaultManager {
    public neo4jClient: Neo4jClient;

    constructor(dbName: string) {
        this.neo4jClient = new Neo4jClient(dbName);
    }
}
