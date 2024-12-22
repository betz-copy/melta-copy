import { Client } from 'basic-ftp';
import config from './config';
import { connectToFtp, getRemoteFileData } from './utils/ftp';
import { IFileData } from './utils/interface';
import { getLocalFileData } from './utils/fs';
import fs from 'fs/promises';
import { createReadStream } from 'node:fs';
import Melta from './externalServices/melta';
import { delay } from './utils/delay';

const {
    remoteFolder: { path: incomingFolderPath, isFtp },
    interval: { minFileAge, watchInterval },
    instance: { localDownloadFilePath },
    melta: {
        batch: { batchDelay, batchSize },
    },
} = config;

export default class FolderWatcher {
    static ftpClient = new Client();

    public static async watch() {
        const realPath = String.raw`${incomingFolderPath}`;

        if (isFtp) await connectToFtp(FolderWatcher.ftpClient);

        console.log(`Started watching Folder ${realPath}`);

        setInterval(async () => {
            try {
                await FolderWatcher.handleFolder(realPath);
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

        for (let i = 0; i < folderItems.length; i += batchSize) {
            const batch = folderItems.slice(i, i + batchSize);

            // eslint-disable-next-line consistent-return
            await Promise.allSettled(
                batch.map(async ({ age, name, ext, fileWithoutExtension }) => {
                    if (age >= minFileAge) return;

                    // Create root template
                    if (!currentTemplateId) {
                        const templateId = await Melta.createTemplate(folderPath, folderPath);
                        return this.handleFolder(folderPath, templateId?._id);
                    }

                    if (ext && fileWithoutExtension) {
                        await FolderWatcher.ftpClient.downloadTo(localDownloadFilePath, `${folderPath}/${name}`);
                        await Melta.createEntity(fileWithoutExtension, ext, currentTemplateId, createReadStream(localDownloadFilePath));
                        await fs.rm(localDownloadFilePath);
                    } else {
                        const templateId = await Melta.createTemplate(name, folderPath);
                        await this.handleFolder(`${folderPath}/${name}`, templateId?._id);
                    }
                }),
            );

            await delay(batchDelay);
        }
    }
}
