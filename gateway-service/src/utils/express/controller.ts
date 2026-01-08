import DefaultManagerProxy from './manager';

// biome-ignore lint/suspicious/noExplicitAny: lol
export default abstract class DefaultController<Manager extends DefaultManagerProxy<any> | null = null> {
    public manager: Manager;

    constructor(manager: Manager) {
        this.manager = manager;
    }
}
