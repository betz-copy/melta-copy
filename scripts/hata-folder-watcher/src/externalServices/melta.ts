import axios from 'axios';
import config from '../config';
import formData from 'form-data';
import { ReadStream } from 'fs-extra';

const {
    melta: { baseURL, templatesApi, timeout, jwt },
    template: { iconFileId },
} = config;

export default class Melta {
    public static api = axios.create({ baseURL, timeout, headers: { Authorization: `Bearer ${jwt}` } });

    static async createTemplate(name: string, folderPath: string) {
        const { data } = await this.api.post(templatesApi, {
            name,
            displayName: name,
            category: 'IDKKKK', // TODO: what category?
            iconFileId,
            disabled: false,
            propertiesOrder: ['fileName', 'extension'],
            propertiesTypeOrder: ['properties', 'attachmentProperties'],
            propertiesPreview: ['fileName', 'extension'],
            path: folderPath, // TODO: path includes the name or no?
            properties: {
                hide: [],
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
            },
        });

        return data;
    }

    static async createEntity(fileWithoutExtension: string, ext: string, templateId: string, file: ReadStream) {
        const form = new formData();

        form.append('templateId', templateId);
        form.append('properties', { fileName: fileWithoutExtension, extension: ext });
        form.append('file', file);

        const { data } = await axios.post(baseURL, form);

        return data;
    }
}
