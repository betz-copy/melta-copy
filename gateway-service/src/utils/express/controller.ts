import { DefaultManagerMongo } from '@microservices/shared';
import DefaultManagerProxy from './manager';

export default abstract class DefaultController<Manager extends DefaultManagerProxy<any> | DefaultManagerMongo<any> | null = null> {
    public manager: Manager;

    constructor(manager: Manager) {
        this.manager = manager;
    }
}
