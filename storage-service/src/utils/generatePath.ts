import * as uuid from 'uuid';
import config from '../config';

const { document } = config;

export const generatePath = (fileName) => {
    const path = uuid.v4();
    return path.split('-').join('') + fileName;
};

export const generate32CharUUID = () => uuid.v4().substring(0, document.uuidLength);

export const getFileName = (path: string) => {
    return encodeURIComponent(path.toString().slice(32));
};
