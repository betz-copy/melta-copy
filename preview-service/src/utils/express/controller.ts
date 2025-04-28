import DefaultManagerMinio from '../minio/manager';

export default abstract class DefaultController<Manager extends DefaultManagerMinio> {
    public manager: Manager;

    constructor(manager: Manager) {
        this.manager = manager;
    }
}
