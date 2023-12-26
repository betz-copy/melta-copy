import { environment } from '../globals';

export const getFileExtension = (name: string) => {
    return name.match(/\.([^.]*)$/)?.pop() || '';
};

export const getPreviewContentType = (name: string) => {
    const { video, audio, image } = environment.fileExtensions;
    const extension = getFileExtension(name).toLowerCase();

    if (extension === 'pdf') return 'pdf';
    if (video.includes(extension)) return 'video';
    if (audio.includes(extension)) return 'audio';
    if (image.includes(extension)) return 'image';
    if (environment.fileExtensions.document.includes(extension)) return 'document';
    return 'unsupported';
};
