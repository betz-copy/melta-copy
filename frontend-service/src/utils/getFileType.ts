import { environment } from '../globals';

export const getFileExtension = (name: string) => {
    return name.match(/\.([^.]*)$/)?.pop() || '';
};

export const getFileNameWithoutExtension = (name: string) => {
    const lastDotIndex = name.lastIndexOf('.');
    const fileNameWithoutExtension = lastDotIndex !== -1 ? name.slice(0, lastDotIndex) : name;
    return fileNameWithoutExtension.trim();
};

export const getPreviewContentType = (name: string) => {
    const { video, audio, image, document } = environment.fileExtensions;
    const extension = getFileExtension(name).toLowerCase();

    if (extension === 'pdf') return 'pdf';
    if (video.includes(extension as any)) return 'video';
    if (audio.includes(extension as any)) return 'audio';
    if (image.includes(extension as any)) return 'image';
    if (document.includes(extension as any)) return 'document';
    return 'unsupported';
};
