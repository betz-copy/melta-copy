import { DefaultManagerMinio } from '@microservices/shared';

export default abstract class DefaultController<Manager extends DefaultManagerMinio> {
    public manager: Manager;

    constructor(manager: Manager) {
        this.manager = manager;
    }
}
