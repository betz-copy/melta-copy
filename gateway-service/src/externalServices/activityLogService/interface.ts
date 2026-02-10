export type SearchParams = Partial<{
    limit: number;
    skip: number;
    actions: string[];
    searchText: string;
    fieldsSearch: string[];
    startDateRange: Date;
    endDateRange: Date;
}>;
