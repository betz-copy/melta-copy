import { ConsumerMessage } from 'menashmq';
import { FilesManager } from '../express/files/manager';
import { ServiceError } from '../express/error';

class PreviewConsumer {
    static async createPreviewQueueReq(msg: ConsumerMessage) {
        try {
            const msgContent = msg.getContent();
            if (Array.isArray(msgContent)) await Promise.all(msgContent.map(async (message) => FilesManager.uploadFilePreview(message.toString())));
            else await FilesManager.uploadFilePreview(msgContent.toString());
            msg.ack();
        } catch (err: any) {
            msg.nack(false);
            throw new ServiceError(500, 'Rabbit consumer error', { error: err });
        }
    }
}

export default PreviewConsumer;
