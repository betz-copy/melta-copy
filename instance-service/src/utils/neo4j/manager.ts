import Neo4jClient from '.';

export default abstract class DefaultManagerNeo4j {
    public neo4jClient: Neo4jClient;

    constructor(dbName: string) {
        this.neo4jClient = new Neo4jClient(dbName);
    }
}
