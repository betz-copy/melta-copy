import React from 'react';
import { FileToPrint } from './FileToPrint';
import { useFilePreview } from '../../utils/useFilePreview';
import { IFile } from '../../interfaces/preview';

const FileData: React.FC<{
    file: IFile;
    filesSettings: {
        isLoading: Set<string> | undefined;
        setIsLoading: React.Dispatch<React.SetStateAction<Set<string> | undefined>>;
        setIsError: React.Dispatch<React.SetStateAction<boolean>>;
    };
}> = ({ file, filesSettings }) => {
    const { data, refetch, isLoading, isError } = useFilePreview(file.id, file.contentType);
    console.log({ file });
    console.log({ data });

    console.log({ isError });

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                await refetch();
            } catch (error) {
                filesSettings.setIsError(true);
            }
        };

        if (!data) {
            fetchData();
        }
    }, [data, refetch, filesSettings.setIsError, filesSettings]);

    React.useEffect(() => {
        if (isError) {
            filesSettings.setIsError(true);
            console.log('errorrrrrrrrrrr!!!!!!');
        }
    }, [isError, filesSettings.setIsError, filesSettings]);

    React.useEffect(() => {
        if (isLoading && !filesSettings.isLoading?.has(file.id)) {
            const newLoadingSet = new Set(filesSettings.isLoading);
            newLoadingSet.add(file.id);
            filesSettings.setIsLoading(newLoadingSet);
        } else if (!isLoading && filesSettings.isLoading?.has(file.id)) {
            const newLoadingSet = new Set(filesSettings.isLoading);
            newLoadingSet.delete(file.id);
            filesSettings.setIsLoading(newLoadingSet);
        }
    }, [isLoading, filesSettings.isLoading, filesSettings.setIsLoading, file.id, filesSettings]);
    console.log({ filesSettings });

    return <FileToPrint file={file} key={`${file.id}${file.name}`} data={data} />;
};

export { FileData };
