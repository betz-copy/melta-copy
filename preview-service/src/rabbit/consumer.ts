import { ConsumerMessage } from 'menashmq';
import { ServiceError } from '@microservices/shared';
import FilesManager from '../express/files/manager';
import config from '../config';

const {
    service: { workspaceIdHeaderName },
} = config;

class PreviewConsumer {
    static async createPreviewQueueReq(msg: ConsumerMessage) {
        const msgContent = msg.getContent();
        const manager = new FilesManager(msg.properties.headers[workspaceIdHeaderName]);

        try {
            if (Array.isArray(msgContent)) await Promise.all(msgContent.map(async (message) => manager.uploadFilePreview(message.toString())));
            else await manager.uploadFilePreview(msgContent.toString());
            msg.ack();
        } catch (err: any) {
            msg.nack(false);
            throw new ServiceError(undefined, 'Rabbit consumer error', { error: err });
        }
    }
}

export default PreviewConsumer;
