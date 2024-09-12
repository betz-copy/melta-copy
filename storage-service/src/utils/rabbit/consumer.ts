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
            const filesIds: string[] = JSON.parse(contentAsString);

            const filesManager = new FilesManager(msg.properties.headers[workspaceIdHeaderName]);
            await filesManager.deleteFiles(filesIds);
            msg.ack();
        } catch (err: any) {
            msg.nack(false);
            throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, 'Rabbit consumer error:', { error: err });
        }
    }
}

export default DeleteFilesConsumer;
