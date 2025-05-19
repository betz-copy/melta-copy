import fileExtension from '../config/documentExtension';

const { document } = fileExtension;

export const getFileExtension = (name: string) => {
    return name.match(/\.([^.]*)$/)?.pop() || '';
};

export const isFileDocument = (name: string) => {
    const extension = getFileExtension(name).toLowerCase();
    return document.includes(extension);
};
