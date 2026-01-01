import { menash } from 'menashmq';
import config from '../../config';

const { workspaceIdHeaderName } = config.service;

class DefaultExternalServiceRabbit {
    protected workspaceId: string;

    constructor(workspaceId: string) {
        this.workspaceId = workspaceId;
    }

    protected sendToQueue(queueName: string, content: string | Object | Buffer) {
        return menash.send(queueName, content, { headers: { [workspaceIdHeaderName]: this.workspaceId } });
    }
}

export default DefaultExternalServiceRabbit;
