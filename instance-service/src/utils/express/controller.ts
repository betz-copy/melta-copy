import DefaultManagerNeo4j from '../neo4j/manager';

export default abstract class DefaultController<Manager extends DefaultManagerNeo4j | undefined = undefined> {
    public manager: Manager;

    constructor(manager: Manager) {
        this.manager = manager;
    }
}
