import { menash } from 'menashmq';
import config from '../../config';

const {
    service: { workspaceIdHeaderName },
} = config;

export class DefaultExternalServiceRabbit {
    constructor(protected workspaceId: string) {
        this.workspaceId = workspaceId;
    }

    protected sendToQueue(queueName: string, content: string | Object | Buffer) {
        return menash.send(queueName, content, { headers: { [workspaceIdHeaderName]: this.workspaceId } });
    }
}
