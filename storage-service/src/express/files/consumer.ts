import { ConsumerMessage } from 'menashmq';
import { minioClient } from '../../utils/minio';
import { IFile } from './interface';

export const handleDeleteFileRequests = async (msg: ConsumerMessage) => {
    const { fileId } = msg.getContent() as IFile;

    try {
        await minioClient.removeFile(fileId);
        console.log(`file ${fileId} deleted successfully`);
        msg.ack();
    } catch (err) {
        console.error(`file ${fileId} deletion failed: `, err);
        msg.nack(false);
    }
};
