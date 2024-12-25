import DefaultManagerMongo from '../mongo/manager';

abstract class DefaultController<U, T extends DefaultManagerMongo<U>> {
    public manager: T;

    constructor(manager: T) {
        this.manager = manager;
    }
}

export default DefaultController;
