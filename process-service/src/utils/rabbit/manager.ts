import { menash } from 'menashmq';
import config from '../../config';

const { workspaceIdHeaderName } = config.service;

export class DefaultExternalServiceRabbit {
    constructor(protected workspaceId: string) {
        this.workspaceId = workspaceId;
    }

    protected sendToQueue(queueName: string, content: string | Record<string, unknown> | Buffer) {
        return menash.send(queueName, content, { headers: { [workspaceIdHeaderName]: this.workspaceId } });
    }
}
