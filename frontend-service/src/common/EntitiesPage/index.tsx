import React, { useEffect, useRef, useState } from 'react';
import i18next from 'i18next';
import { Box, Grid } from '@mui/material';
import _debounce from 'lodash.debounce';
import mapValues from 'lodash.mapvalues';
import { useMutation, useQueryClient } from 'react-query';
import fileDownload from 'js-file-download';
import { toast } from 'react-toastify';
import { IMongoCategory } from '../../interfaces/categories';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { EntitiesPageHeadline } from './Headline';
import TemplateTablesView, { TemplateTablesViewRef } from './TemplateTablesView';
import { exportEntitiesRequest } from '../../services/entitiesService';
import CardsView, { CardsViewRef } from './CardsView';
import { IEntity, IExportEntitiesBody } from '../../interfaces/entities';
import { filterModelToFilterOfTemplate, sortModelToSortOfSearchRequest } from '../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { useSearchParams } from '../../utils/hooks/useSearchParams';
import { convertToBool } from '../../utils/convertStringToBool';
import { LocalStorage } from '../../utils/localStorage';
import { IMongoChildTemplatePopulated } from '../../interfaces/childTemplates';
import { isChildTemplate } from '../../utils/templates';

type EntitiesPageProps<T extends IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated> = {
    templates: T[];
    setTemplates?: React.Dispatch<React.SetStateAction<T[]>>;
    templatesToShowCheckbox: T[];
    setTemplatesToShowCheckbox: React.Dispatch<React.SetStateAction<T[]>>;
    isTemplatesCheckboxDraggableDisabled?: boolean;
    categories?: IMongoCategory[];
    excelExportAllTablesFileName: string;
    pageType: string;
    pageTitle: string;
};

const EntitiesPage = <T extends IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated>({
    templates,
    setTemplates,
    categories,
    excelExportAllTablesFileName,
    pageType,
    pageTitle,
    templatesToShowCheckbox,
    setTemplatesToShowCheckbox,
    isTemplatesCheckboxDraggableDisabled,
}: EntitiesPageProps<T>) => {
    const templateTablesViewRef = useRef<TemplateTablesViewRef>(null);
    const cardsViewRef = useRef<CardsViewRef>(null);

    const [urlSearchParams, setUrlSearchParams] = useSearchParams({
        semanticSearch: LocalStorage.get('semanticSearch') ?? 'true',
        search: '',
        viewMode: 'templates-tables-view',
    });
    const search = urlSearchParams.get('search')!;

    const [searchInput, setSearchInput] = useState(search);
    const [updatedEntities, setUpdatedEntities] = useState<IEntity[]>([]);
    const [updatedTemplateIds, setUpdatedTemplateIds] = useState<string[]>([]);

    const queryClient = useQueryClient();

    const viewMode = urlSearchParams.get('viewMode');
    const isTableView = viewMode === 'templates-tables-view';

    useEffect(() => {
        if (Array.isArray(updatedEntities) && viewMode !== 'cards-view') {
            updatedEntities.forEach((entity) => {
                const reference = templateTablesViewRef.current!.templateTablesRefs?.[entity.templateId];

                if (reference) reference.updateRowDataClientSide(entity);
            });
        }
    }, [updatedEntities, viewMode]);

    useEffect(() => {
        if (Array.isArray(updatedTemplateIds) && viewMode !== 'cards-view') {
            updatedTemplateIds.forEach((templateId) => {
                const reference = templateTablesViewRef.current!.templateTablesRefs?.[templateId];

                if (reference) reference.refreshServerSide();
            });
        }
    }, [updatedTemplateIds, viewMode]);

    useEffect(() => {
        setSearchInput(search || '');
    }, [search]);

    const { mutateAsync: exportTemplatesToExcel, isLoading: isLoadingExcelExport } = useMutation(
        async () => {
            const templatesToExport: IExportEntitiesBody['templates'] = mapValues(
                templateTablesViewRef.current!.templateTablesRefs,
                (templateTableRef, templateId) => {
                    const template = templates.find(({ _id }) => _id === templateId)!;
                    return {
                        filter: filterModelToFilterOfTemplate(templateTableRef.getFilterModel()!, template),
                        sort: sortModelToSortOfSearchRequest(templateTableRef.getSortModel()!),
                        displayColumns: templateTableRef.getDisplayColumns(),
                        isChildTemplate: isChildTemplate(template),
                    };
                },
            );
            return exportEntitiesRequest({ fileName: excelExportAllTablesFileName, textSearch: searchInput, templates: templatesToExport });
        },
        {
            onError(error) {
                console.error('Failed to export tables', error);
                toast.error(i18next.t('failedToExportTables'));
            },
            onSuccess(data) {
                fileDownload(data, excelExportAllTablesFileName);
            },
        },
    );

    const onSearch = (newSearchInput: string) => {
        if (urlSearchParams.get('search') === newSearchInput) {
            if (isTableView) templateTablesViewRef.current?.refetch();
            else cardsViewRef.current?.refetch();
        }

        setUrlSearchParams({ ...Object.fromEntries(urlSearchParams.entries()), search: newSearchInput });
    };

    return (
        <>
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
                    onAddEntity={(id?: string) => {
                        if (id) {
                            const queryKey = isTableView
                                ? ['filterEmptyTemplateTablesOnGlobalSearch', templates, searchInput]
                                : ['searchEntities', templatesToShowCheckbox.map(({ _id }) => _id), searchInput];

                            queryClient.invalidateQueries(queryKey).finally(() => {
                                if (isTableView && templateTablesViewRef.current?.templateTablesRefs?.[id]) {
                                    templateTablesViewRef.current.templateTablesRefs[id].scrollIntoView();
                                }
                            });
                        } else {
                            const queryKey = isTableView ? ['filterEmptyTemplateTablesOnGlobalSearch'] : ['searchEntities'];

                            queryClient.resetQueries({ queryKey });
                        }
                    }}
                    viewModeProps={{
                        viewMode: viewMode as 'templates-tables-view' | 'cards-view',
                        setViewMode: (newViewMode) => setUrlSearchParams({ ...Object.fromEntries(urlSearchParams.entries()), viewMode: newViewMode }),
                    }}
                    pageTitle={pageTitle}
                    refreshServerSide={(templateId: string) => {
                        const ref = templateTablesViewRef.current?.templateTablesRefs?.[templateId];
                        ref!.refreshServerSide();
                        ref!.scrollIntoView();
                    }}
                    setUpdatedEntities={setUpdatedEntities}
                />
            </Box>

            <Grid container padding="0 4rem" direction="column" marginBottom="2.5rem">
                {isTableView && (
                    <TemplateTablesView
                        ref={templateTablesViewRef}
                        templates={templatesToShowCheckbox}
                        searchInput={urlSearchParams.get('search')!}
                        semanticSearch={convertToBool(urlSearchParams.get('semanticSearch'))}
                        pageType={pageType}
                        setUpdatedEntities={setUpdatedEntities}
                        setUpdatedTemplateIds={setUpdatedTemplateIds}
                    />
                )}
                {viewMode === 'cards-view' && (
                    <CardsView
                        ref={cardsViewRef}
                        templateIds={templatesToShowCheckbox.map((template) =>
                            isChildTemplate(template) ? template.parentTemplate._id : template._id,
                        )}
                        templates={templatesToShowCheckbox}
                        searchInput={urlSearchParams.get('search')!}
                    />
                )}
            </Grid>
        </>
    );
};

export default EntitiesPage;
