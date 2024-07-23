import { ConsumerMessage } from 'menashmq';
import { FilesManager } from '../express/files/manager';
import logger from '../utils/logger/logsLogger';

class PreviewConsumer {
    static async createPreviewQueueReq(msg: ConsumerMessage) {
        try {
            const msgContent = msg.getContent();
            if (Array.isArray(msgContent)) await Promise.all(msgContent.map(async (message) => FilesManager.uploadFilePreview(message.toString())));
            else await FilesManager.uploadFilePreview(msgContent.toString());
            msg.ack();
        } catch (err: any) {
            logger.error('Rabbit consumer error: ', { error: err });
            msg.nack(false);
        }
    }
}

export default PreviewConsumer;
