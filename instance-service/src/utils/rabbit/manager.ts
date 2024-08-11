import { menash } from 'menashmq';
import config from '../../config';

const {
    service: { dbHeaderName },
} = config;

export class DefaultExternalServiceRabbit {
    constructor(protected workspaceId: string) {}

    protected sendToQueue(queueName: string, content: string | Object | Buffer) {
        return menash.send(queueName, content, { headers: { [dbHeaderName]: this.workspaceId } });
    }
}
