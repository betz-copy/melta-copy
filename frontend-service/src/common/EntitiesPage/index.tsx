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
import { exportEntitiesRequest } from '../../services/entitiesService';
import CardsView, { CardsViewRef } from './CardsView';
import { IExportEntitiesBody } from '../../interfaces/entities';
import { filterModelToFilterOfTemplate, sortModelToSortOfSearchRequest } from '../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';

const EntitiesPage: React.FC<{
    templates: IMongoEntityTemplatePopulated[];
    setTemplates?: React.Dispatch<React.SetStateAction<IMongoEntityTemplatePopulated[]>>;
    templatesToShowCheckbox: IMongoEntityTemplatePopulated[];
    setTemplatesToShowCheckbox: React.Dispatch<React.SetStateAction<IMongoEntityTemplatePopulated[]>>;
    isTemplatesCheckboxDraggableDisabled?: boolean;
    categories?: IMongoCategory[];
    excelExportAllTablesFileName: string;
    pageType: string;
    pageTitle: string;
}> = ({
    templates,
    setTemplates,
    categories,
    excelExportAllTablesFileName,
    pageType,
    pageTitle,
    templatesToShowCheckbox,
    setTemplatesToShowCheckbox,
    isTemplatesCheckboxDraggableDisabled,
}) => {
    const templateTablesViewRef = useRef<TemplateTablesViewRef>(null);
    const cardsViewRef = useRef<CardsViewRef>(null);

    const [urlSearchParams, setUrlSearchParams] = useSearchParams({
        search: '',
        viewMode: 'templates-tables-view',
    });

    const [searchInput, setSearchInput] = useState(urlSearchParams.get('search')!);

    const { mutateAsync: exportTemplatesToExcel, isLoading: isLoadingExcelExport } = useMutation(
        async () => {
            const templatesToExport: IExportEntitiesBody['templates'] = mapValues(
                templateTablesViewRef.current!.templateTablesRefs,
                (templateTableRef, templateId) => {
                    const template = templates.find(({ _id }) => _id === templateId)!;
                    return {
                        filter: filterModelToFilterOfTemplate(templateTableRef.getFilterModel()!, template),
                        sort: sortModelToSortOfSearchRequest(templateTableRef.getSortModel()!),
                    };
                },
            );
            return exportEntitiesRequest({ fileName: excelExportAllTablesFileName, textSearch: searchInput, templates: templatesToExport });
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
                            setTemplates,
                            isDraggableDisabled: isTemplatesCheckboxDraggableDisabled,
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
