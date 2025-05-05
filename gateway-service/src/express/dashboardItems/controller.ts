import DefaultController from '../../utils/express/controller';
import { DashboardManager } from './manager';

export class DashboardController extends DefaultController<DashboardManager> {
    constructor(workspaceId: string) {
        super(new DashboardManager(workspaceId));
    }
}
