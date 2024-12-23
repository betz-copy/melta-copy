import axios from 'axios';
import config from '../config';
import formData from 'form-data';
import { ReadStream } from 'fs-extra';
import { IMeltaEntityTemplate } from '../utils/interface';
import { v4 as uuid } from 'uuid';

const {
    melta: { baseURL, templatesApi, timeout, jwt, workspaceId, category, cookieName, instancesApi },
    template: { iconFileId },
    remoteFolder: { path: incomingFolderPath },
} = config;

export default class Melta {
    public static api = axios.create({ baseURL, timeout, headers: { Cookie: `${cookieName}=${jwt};`, 'Workspace-Id': workspaceId } });

    static async createTemplate(name: string, folderPath: string) {
        try {
            // The root of all templates should begin with / and not with the folder path we read from.
            const realPath = folderPath.replaceAll(String.raw`${incomingFolderPath}`, '');

            const formData = new FormData();

            formData.append('name', uuid());
            formData.append('displayName', name);
            formData.append('category', category);
            formData.append('iconFileId', iconFileId);
            formData.append('disabled', 'false');
            formData.append('propertiesOrder', JSON.stringify(['fileName', 'extension']));
            formData.append('propertiesTypeOrder', JSON.stringify(['properties', 'attachmentProperties']));
            formData.append('propertiesPreview', JSON.stringify(['fileName', 'extension']));
            formData.append('path', realPath);

            formData.append(
                'properties',
                JSON.stringify({
                    hide: [],
                    required: [],
                    type: 'object',
                    properties: {
                        fileName: {
                            title: 'שם קובץ',
                            type: 'string',
                        },
                        extension: {
                            title: 'סוג קובץ',
                            type: 'string',
                        },
                        file: {
                            title: 'קובץ',
                            type: 'string',
                            format: 'fileId',
                        },
                        // Uncomment these fields if needed
                        // createdAt: {
                        //     title: 'תאריך יצירה',
                        //     type: 'string',
                        // },
                        // createdBy: {
                        //     title: 'נוצר על ידי',
                        //     type: 'string',
                        // },
                        // modifiedAt: {
                        //     title: 'תאריך עריכה',
                        //     type: 'string',
                        // },
                        // modifiedBy: {
                        //     title: 'נערך על ידי',
                        //     type: 'string',
                        // },
                    },
                }),
            );

            const { data } = await this.api.post<IMeltaEntityTemplate & { _id: string }>(templatesApi, formData);

            return data;
        } catch (e) {
            console.error('Error at creating template');
            console.error({ e });
            return;
        }
    }

    // TODO: Upsert entity if the fileWithoutExtension already exists.
    static async createEntity(fileWithoutExtension: string, ext: string, templateId: string, file: ReadStream) {
        try {
            const form = new formData();

            form.append('templateId', templateId);
            form.append('properties', JSON.stringify({ fileName: fileWithoutExtension, extension: ext }));
            form.append('file', file);

            const { data } = await this.api.post(instancesApi, form);

            return data;
        } catch (e) {
            console.error('Error at creating entity');
            console.error({ e });
            return;
        }
    }
}
