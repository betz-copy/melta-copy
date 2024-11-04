import { menash } from 'menashmq';
import config from '../../config';

const {
    service: { workspaceIdHeaderName },
} = config;

export const sendToQueue = (queueName: string, content: string | Object | Buffer, workspaceId: string) => {
    return menash.send(queueName, content, { headers: { [workspaceIdHeaderName]: workspaceId } });
}
