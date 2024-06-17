import DefaultManagerProxy from './manager';

export default abstract class DefaultController<Manager extends DefaultManagerProxy<any>> {
    public manager: Manager;

    constructor(manager: Manager) {
        this.manager = manager;
    }
}
