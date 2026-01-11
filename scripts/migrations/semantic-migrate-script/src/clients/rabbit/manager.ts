import { menash } from 'menashmq';
import config from '../../config';

const { workspaceIdHeaderName } = config.service;

export const sendToQueue = (queueName: string, content: string | object | Buffer, workspaceId: string) => {
    return menash.send(queueName, content, { headers: { [workspaceIdHeaderName]: workspaceId } });
};
