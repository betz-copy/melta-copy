import { Client } from 'basic-ftp';
import config from './config';
import { connectToFtp, getRemoteFileData } from './utils/ftp';
import { IFileData } from './utils/interface';
import { getLocalFileData } from './utils/fs';
import fs from 'fs/promises';
import { createReadStream } from 'node:fs';
import Melta from './externalServices/melta';

const {
    remoteFolder: { path: incomingFolderPath, isFtp },
    interval: { minFileAge, watchInterval },
    instance: { localDownloadFilePath },
} = config;

export default class FolderWatcher {
    static ftpClient = new Client();

    public static async watch() {
        if (isFtp) await connectToFtp(FolderWatcher.ftpClient);

        console.log(`Started watching Folder ${incomingFolderPath}`);

        setInterval(async () => {
            try {
                await FolderWatcher.handleFolder(incomingFolderPath);
            } catch (error) {
                console.error('Error thrown while watching folder', { error });
                throw error;
            }
        }, watchInterval);
    }

    private static async handleFolder(folderPath: string, currentTemplateId?: string) {
        let folderItems: IFileData[];

        if (isFtp) {
            const fileLists = await FolderWatcher.ftpClient.list(folderPath);
            folderItems = getRemoteFileData(fileLists);
        } else {
            const list = await fs.readdir(folderPath, { withFileTypes: true });
            folderItems = await getLocalFileData(list, folderPath);
        }

        // eslint-disable-next-line consistent-return
        await Promise.allSettled(
            folderItems.map(async ({ name, age, fileWithoutExtension, ext }) => {
                if (age >= minFileAge) return;

                // If its a file then create an entity.
                if (ext && fileWithoutExtension) {
                    const templateId: string = currentTemplateId ?? (await Melta.createTemplate(name, folderPath));
                    await FolderWatcher.ftpClient.downloadTo(localDownloadFilePath, `${folderPath}/${name}`);

                    return Melta.createEntity(fileWithoutExtension, ext, templateId, createReadStream(localDownloadFilePath));
                }

                // If its a folder create a template.
                const templateId = await Melta.createTemplate(name, folderPath);
                return this.handleFolder(`${folderPath}/${name}`, templateId);
            }),
        );
    }
}
