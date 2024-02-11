import DefaultManager from '../neo4j/manager';

export default abstract class DefaultController<Manager extends DefaultManager> {
    public manager: Manager;

    constructor(manager: Manager) {
        this.manager = manager;
    }
}
