import { menash } from 'menashmq';
import config from '../../config';

const {
    service: { workspaceIdHeaderName },
} = config;

export default class DefaultExternalServiceRabbit {
    protected workspaceId: string;

    constructor(workspaceId: string) {
        this.workspaceId = workspaceId;
    }

    protected sendToQueue(queueName: string, content: string | object | Buffer) {
        return menash.send(queueName, content, { headers: { [workspaceIdHeaderName]: this.workspaceId } });
    }
}
