import { ConsumerMessage } from 'menashmq';
import { FilesManager } from '../express/files/manager';
import logger from '../utils/logger/logsLogger';
import { config } from '../config';

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
            logger.error('Rabbit consumer error: ', { error: err });
            msg.nack(false);
        }
    }
}

export default PreviewConsumer;
