
export const getFileName = (path: string) => {
    return encodeURIComponent(path.toString().slice(32));
};
