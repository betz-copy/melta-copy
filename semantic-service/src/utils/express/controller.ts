import DefaultManagerElastic from '../elastic/manager';

export default abstract class DefaultController<T extends DefaultManagerElastic> {
    public manager: T;

    constructor(manager: T) {
        this.manager = manager;
    }
}
