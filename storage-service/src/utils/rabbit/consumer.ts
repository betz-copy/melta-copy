import { ConsumerMessage } from 'menashmq';
import { StatusCodes } from 'http-status-codes';
import { ServiceError } from '../../express/error';
import { FilesManager } from '../../express/files/manager';

class DeleteFilesConsumer {
    static async createDeleteFilesQueueReq(msg: ConsumerMessage) {
        try {
            const contentAsString = msg.getContent() as string;
            const filesIds = JSON.parse(contentAsString);

            await Promise.all(filesIds.map(async (message) => FilesManager.deleteFile(message)));
            msg.ack();
        } catch (err: any) {
            msg.nack(false);
            throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, 'Rabbit consumer error:', { error: err });
        }
    }
}

export default DeleteFilesConsumer;
