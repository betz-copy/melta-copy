import { menash } from 'menashmq';
import { deleteFiles } from '../../externalServices/storageService';
import config from '../../config';

const { rabbit } = config;

const sendFilesIdToRabbit = async (filesIds: string[]) => {
    console.log('deleteUnusedFiles send');

    await menash.send(rabbit.deleteUnusedFilesQueue, JSON.stringify(filesIds));
};

const getFilesIdsFromRabbit = async () => {
    await menash.queue(rabbit.deleteUnusedFilesQueue).activateConsumer(
        (message) => {
            try {
                const contentAsString = message.getContent() as string;
                const filesIds = JSON.parse(contentAsString);
                console.log('deleteUnusedFiles', { filesIds });

                deleteFiles(filesIds);
                console.log('deleteUnusedFiles finish');
                message.ack();
            } catch (error) {
                console.error('Error processing message:', error);
                message.nack(false, true);
            }
        },
        { noAck: false },
    );
};

export { sendFilesIdToRabbit, getFilesIdsFromRabbit };
