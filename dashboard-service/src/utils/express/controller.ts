import { DefaultManagerMongo } from '@microservices/shared';

export default abstract class DefaultController<U, T extends DefaultManagerMongo<U>> {
    public manager: T;

    constructor(manager: T) {
        this.manager = manager;
    }
}
