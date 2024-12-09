import { ConsumerMessage } from 'menashmq';
import { StatusCodes } from 'http-status-codes';
import { ServiceError } from '../../express/error';
import { FilesManager } from '../../express/files/manager';
import { config } from '../../config';

const {
    service: { workspaceIdHeaderName },
} = config;

class DeleteFilesConsumer {
    async createDeleteFilesQueueReq(msg: ConsumerMessage) {
        try {
            const contentAsString = msg.getContent() as string;
            console.log({ contentAsString });

            const allObj = JSON.parse(contentAsString);
            console.log(allObj);

            const { fileIds, bucketName } = allObj;
            const filesManager = new FilesManager(bucketName ?? msg.properties.headers[workspaceIdHeaderName]);
            await filesManager.deleteFiles(fileIds);

            msg.ack();
        } catch (err: any) {
            msg.nack(false);
            throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, 'Rabbit consumer error:', { error: err });
        }
    }
}

export default DeleteFilesConsumer;
