import * as uuid from 'uuid';

export const generatePath = (fileName) => {
    const path = uuid.v4();
    return path.split('-').join('') + fileName;
};

export const getFileName = (path: string) => {
    return path.toString().slice(32);
};
