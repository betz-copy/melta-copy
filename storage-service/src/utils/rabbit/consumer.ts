import { ServiceError } from '@microservices/shared';
import { ConsumerMessage } from 'menashmq';
import FilesManager from '../../express/files/manager';

class DeleteFilesConsumer {
    async createDeleteFilesQueueReq(msg: ConsumerMessage) {
        try {
            const contentAsString = msg.getContent() as string;

            const allObj = JSON.parse(contentAsString);
            const { fileIds, bucketName } = allObj;
            const filesManager = new FilesManager(bucketName);

            await filesManager.deleteFiles(fileIds);

            msg.ack();
        } catch (err: any) {
            msg.nack(false);

            throw new ServiceError(undefined, 'Rabbit consumer error:', { error: err });
        }
    }
}

export default DeleteFilesConsumer;
