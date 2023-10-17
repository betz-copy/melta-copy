import React, { useRef, useState } from 'react';
import i18next from 'i18next';
import { Box, Grid } from '@mui/material';
import _debounce from 'lodash.debounce';
import mapValues from 'lodash.mapvalues';
import { useMutation } from 'react-query';
import fileDownload from 'js-file-download';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';
import { IMongoCategory } from '../../interfaces/categories';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { EntitiesPageHeadline } from './Headline';
import TemplateTablesView, { TemplateTablesViewRef } from './TemplateTablesView';
import { TemplatesWithFilterDataObj, exportEntitesTablesToExcelRequest } from '../../services/entitiesService';
import CardsView, { CardsViewRef } from './CardsView';

const EntitiesPage: React.FC<{
    templates: IMongoEntityTemplatePopulated[];
    categories?: IMongoCategory[];
    excelExportAllTablesFileName: string;
    pageType: string;
    pageTitle: string;
}> = ({ templates, categories, excelExportAllTablesFileName, pageType, pageTitle }) => {
    const templateTablesViewRef = useRef<TemplateTablesViewRef>(null);
    const cardsViewRef = useRef<CardsViewRef>(null);

    const [templatesToShowCheckbox, setTemplatesToShowCheckbox] = useState<IMongoEntityTemplatePopulated[]>(templates);

    const [urlSearchParams, setUrlSearchParams] = useSearchParams({
        search: '',
        viewMode: 'templates-tables-view',
    });

    const [searchInput, setSearchInput] = useState(urlSearchParams.get('search')!);
    const { mutateAsync: exportTemplatesToExcel, isLoading: isLoadingExcelExport } = useMutation(
        async () => {
            const templatesToExport: TemplatesWithFilterDataObj = mapValues(
                templateTablesViewRef.current!.templateTablesRefs,
                (templateTableRef) => ({
                    filterModel: templateTableRef.getFilterModel()!,
                    sortModel: templateTableRef.getSortModel()!,
                    quickFilter: searchInput || undefined,
                }),
            );
            return exportEntitesTablesToExcelRequest(templatesToExport, excelExportAllTablesFileName);
        },
        {
            onError(error) {
                console.log('Failed to export tables', error);
                toast.error(i18next.t('failedToExportTables'));
            },
            onSuccess(data) {
                fileDownload(data, excelExportAllTablesFileName);
            },
        },
    );

    const onSearch = (newSearchInput: string) => {
        if (urlSearchParams.get('search') === newSearchInput) {
            if (urlSearchParams.get('viewMode') === 'templates-tables-view') {
                templateTablesViewRef.current?.refetch();
            } else {
                cardsViewRef.current?.refetch();
            }
        }

        setUrlSearchParams({ ...Object.fromEntries(urlSearchParams.entries()), search: newSearchInput });
    };

    return (
        <Grid container margin="0vh">
            <Grid item xs={12}>
                <Box marginBottom="3vh" position="sticky" style={{ top: 0, right: 0, zIndex: 1 }}>
                    <EntitiesPageHeadline
                        searchInput={searchInput}
                        setSearchInput={setSearchInput}
                        onSearch={onSearch}
                        entityTemplateSelectCheckboxProps={{
                            categories,
                            templatesToShow: templatesToShowCheckbox,
                            setTemplatesToShow: setTemplatesToShowCheckbox,
                            templates,
                        }}
                        excelExportProps={{
                            onExcelExport: () => {
                                if (!templateTablesViewRef.current) return;
                                exportTemplatesToExcel();
                            },
                            isLoadingExcel: isLoadingExcelExport,
                        }}
                        viewModeProps={{
                            viewMode: urlSearchParams.get('viewMode') as 'templates-tables-view' | 'cards-view',
                            setViewMode: (newViewMode) =>
                                setUrlSearchParams({ ...Object.fromEntries(urlSearchParams.entries()), viewMode: newViewMode }),
                        }}
                        pageTitle={pageTitle}
                    />
                </Box>
                <Grid container padding="0 2.5rem">
                    {urlSearchParams.get('viewMode') === 'templates-tables-view' && (
                        <TemplateTablesView
                            ref={templateTablesViewRef}
                            templates={templatesToShowCheckbox}
                            searchInput={urlSearchParams.get('search')!}
                            pageType={pageType}
                        />
                    )}
                    {urlSearchParams.get('viewMode') === 'cards-view' && (
                        <CardsView
                            ref={cardsViewRef}
                            templateIds={templatesToShowCheckbox.map(({ _id }) => _id)}
                            searchInput={urlSearchParams.get('search')!}
                        />
                    )}
                </Grid>
            </Grid>
        </Grid>
    );
};

export default EntitiesPage;
