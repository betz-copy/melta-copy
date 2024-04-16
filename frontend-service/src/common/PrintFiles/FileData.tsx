import React from 'react';
import { FileToPrint } from './FileToPrint';
import { useFilePreview } from '../../utils/useFilePreview';
import { IFile } from '../../interfaces/preview';

const FileData: React.FC<{
    file: IFile;
    isFilesLoading: Set<string> | undefined;
    setIsFilesLoading: React.Dispatch<React.SetStateAction<Set<string> | undefined>>;
    index: number;
    setIsFilesError: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ file, isFilesLoading, setIsFilesLoading, index, setIsFilesError }) => {
    const filePreview = useFilePreview(file.id, file.contentType);
    const { data, refetch, isLoading, isError } = filePreview;

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                await refetch();
            } catch (error) {
                setIsFilesError(true);
            }
        };

        if (!data) {
            fetchData();
        }
    }, [data, refetch, setIsFilesError]);

    React.useEffect(() => {
        if (isError) {
            setIsFilesError(true);
        }
    }, [isError, setIsFilesError]);

    React.useEffect(() => {
        if (isLoading && !isFilesLoading?.has(file.id)) {
            const newLoadingSet = new Set(isFilesLoading);
            newLoadingSet.add(file.id);
            setIsFilesLoading(newLoadingSet);
        } else if (!isLoading && isFilesLoading?.has(file.id)) {
            const newLoadingSet = new Set(isFilesLoading);
            newLoadingSet.delete(file.id);
            setIsFilesLoading(newLoadingSet);
        }
    }, [isLoading, isFilesLoading, index, setIsFilesLoading, file.id]);

    return <FileToPrint file={file} key={`${file.id}${file.name}`} filePreview={filePreview} />;
};

export { FileData };
