import DefaultManager from './manager';

export default abstract class DefaultController<U, T extends DefaultManager<U>> {
    public manager: T;

    constructor(manager: T) {
        this.manager = manager;
    }
}
