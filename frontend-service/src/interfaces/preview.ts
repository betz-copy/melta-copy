import { QueryObserverResult, RefetchOptions, RefetchQueryFilters } from 'react-query';

export enum FileExtensions {
    pdf = 'pdf',
    png = 'png',
}

export type IRefetch = <TPageData>(
    options?: (RefetchOptions & RefetchQueryFilters<TPageData>) | undefined,
) => Promise<QueryObserverResult<string, unknown>>;

export interface IFile {
    id: string;
    name: string;
    contentType: 'pdf' | 'video' | 'audio' | 'image' | 'document' | 'unsupported';
    targetExtension: FileExtensions;
    data?: string;
    refetch?: IRefetch;
    isLoading?: boolean;
}
