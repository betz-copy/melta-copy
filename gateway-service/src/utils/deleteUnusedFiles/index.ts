import { menash } from 'menashmq';
import { deleteFiles } from '../../externalServices/storageService';
import config from '../../config';
import { ServiceError } from '../../express/error';
import { StatusCodes } from 'http-status-codes';

const { rabbit } = config;

const sendFilesIdToRabbit = async (filesIds: string[]) => {
    await menash.send(rabbit.deleteUnusedFilesQueue, JSON.stringify(filesIds));
};

const getFilesIdsFromRabbit = async () => {
    await menash.queue(rabbit.deleteUnusedFilesQueue).activateConsumer(
        async (message) => {
            try {
                const contentAsString = message.getContent() as string;
                const filesIds = JSON.parse(contentAsString);

                await deleteFiles(filesIds);
                message.ack();
            } catch (error) {
                message.nack(false, true);
                throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, 'error pulling files ids from RabbitMQ', error);
            }
        },
        { noAck: false },
    );
};

export { sendFilesIdToRabbit, getFilesIdsFromRabbit };
