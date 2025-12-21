import { CircularProgress, Grid, Typography } from '@mui/material';
import { IMongoChildTemplateWithConstraintsPopulated } from '@packages/child-template';
import { IEntity, IFilterGroup, IFilterOfTemplate, ISearchFilter } from '@packages/entity';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { useTour } from '@reactour/tour';
import i18next from 'i18next';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import { environment } from '../../globals';
import { getCountByTemplateIdsRequest } from '../../services/entitiesService';
import { isChildTemplate } from '../../utils/templates';
import { TablePageType } from '../EntitiesTableOfTemplate';
import TemplateTable, { TemplateTableRef } from './TemplateTable';

const { tablesPerLoadingChunkSize } = environment.ganttSettings;

export type TemplateTablesViewResultsRef = {
    templateTablesRefs: Record<string, TemplateTableRef>;
};

export const getDefaultFilterFromTemplate = (
    template: IMongoEntityTemplateWithConstraintsPopulated | IMongoChildTemplateWithConstraintsPopulated,
    isChildTemplate: boolean,
    currentUserKartoffelId: string,
    units: string[],
    isUserAdmin: boolean,
): ISearchFilter | undefined => {
    if (!isChildTemplate) return undefined;

    const filterClauses: (IFilterOfTemplate | IFilterGroup)[] = [];

    for (const [key, prop] of Object.entries(template.properties.properties)) {
        if (prop.isFilterByCurrentUser && currentUserKartoffelId) filterClauses.push({ [key]: { $eq: currentUserKartoffelId } });

        if (prop.isFilterByUserUnit && units && !isUserAdmin) filterClauses.push({ [key]: { $in: units } });

        if (prop.filters) {
            const parsed = typeof prop.filters === 'string' ? JSON.parse(prop.filters) : prop.filters;
            if (parsed) filterClauses.push(parsed);
        }
    }

    return filterClauses.length ? { $and: filterClauses } : undefined;
};

const TemplateTablesViewResults = forwardRef<
    TemplateTablesViewResultsRef,
    {
        templates: (IMongoEntityTemplateWithConstraintsPopulated | IMongoChildTemplateWithConstraintsPopulated)[];
        searchInput: string;
        pageSize?: number;
        pageType: TablePageType;
        setUpdatedEntities?: React.Dispatch<React.SetStateAction<IEntity[]>>;
        setUpdatedTemplateIds?: React.Dispatch<React.SetStateAction<string[]>>;
    }
>(({ templates, searchInput, pageType, setUpdatedEntities, setUpdatedTemplateIds }, ref) => {
    const templateTablesRefs = useRef<Record<string, TemplateTableRef>>({});
    const [visibleTemplatesCount, setVisibleTemplatesCount] = useState<number>(() => {
        const savedCount = sessionStorage.getItem('visibleTemplatesCount');
        return savedCount ? parseInt(savedCount, 10) : tablesPerLoadingChunkSize;
    });
    const loaderRef = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(ref, () => ({
        templateTablesRefs: templateTablesRefs.current,
    }));

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const first = entries[0];
            if (first.isIntersecting) {
                setVisibleTemplatesCount((prevCount) => prevCount + tablesPerLoadingChunkSize);
            }
        });

        const currentLoader = loaderRef.current;
        if (currentLoader) {
            observer.observe(currentLoader);
        }

        return () => {
            if (currentLoader) {
                observer.unobserve(currentLoader);
            }
        };
    }, []);

    useEffect(() => {
        sessionStorage.setItem('visibleTemplatesCount', visibleTemplatesCount.toString());
    }, [visibleTemplatesCount]);

    return (
        <Grid direction="column" spacing={1} width="100%">
            {templates.slice(0, visibleTemplatesCount).map((template) => {
                return (
                    <Grid key={template._id}>
                        <TemplateTable
                            ref={(el) => {
                                if (el) {
                                    templateTablesRefs.current[template._id] = el;
                                } else {
                                    delete templateTablesRefs.current[template._id];
                                }
                            }}
                            template={template}
                            quickFilterText={searchInput}
                            page={pageType}
                            setUpdatedEntities={setUpdatedEntities}
                            setUpdatedTemplateIds={setUpdatedTemplateIds}
                        />
                    </Grid>
                );
            })}
            {visibleTemplatesCount < templates.length && (
                <Grid container justifyContent="center" ref={loaderRef}>
                    <CircularProgress />
                </Grid>
            )}
        </Grid>
    );
});

const filterEmptyTemplateTablesOnGlobalSearchRequest = async (
    templates: (IMongoEntityTemplateWithConstraintsPopulated | IMongoChildTemplateWithConstraintsPopulated)[],
    searchInput: string,
    semanticSearch: boolean,
) => {
    const countRequestTemplateIds = new Set<string>();
    const countRequestChildTemplateIds = new Set<string>();

    templates.forEach((template) => (isChildTemplate(template) ? countRequestChildTemplateIds : countRequestTemplateIds).add(template._id));

    const entitiesCountByTemplates = await getCountByTemplateIdsRequest(
        Array.from(countRequestTemplateIds),
        Array.from(countRequestChildTemplateIds),
        searchInput,
        semanticSearch,
    );

    return templates.flatMap((template) => {
        const countTemplateId = isChildTemplate(template) ? template.parentTemplate._id : template._id;
        const entityCount = entitiesCountByTemplates.find((countByTemplate) => countByTemplate.templateId === countTemplateId);
        return entityCount?.count ? { ...template, entitiesWithFiles: entityCount.entitiesWithFiles, texts: entityCount.texts } : [];
    });
};

export interface TemplateTablesViewProps {
    templates: (IMongoEntityTemplateWithConstraintsPopulated | IMongoChildTemplateWithConstraintsPopulated)[];
    searchInput: string;
    pageType: TablePageType;
    semanticSearch: boolean;
    setUpdatedEntities?: React.Dispatch<React.SetStateAction<IEntity[]>>;
    setUpdatedTemplateIds?: React.Dispatch<React.SetStateAction<string[]>>;
}

export interface TemplateTablesViewRef {
    refetch: () => void;
    templateTablesRefs: Record<string, TemplateTableRef> | undefined;
}

const TemplateTablesView = forwardRef<TemplateTablesViewRef, TemplateTablesViewProps>(
    ({ templates, searchInput, pageType, setUpdatedEntities, setUpdatedTemplateIds, semanticSearch }, ref) => {
        const { setSteps } = useTour();
        const {
            data: templatesFilteredByCount,
            refetch: refetchTemplatesFilteredByCount,
            isFetching: isLoadingTemplatesFilteredByCount,
        } = useQuery(
            ['filterEmptyTemplateTablesOnGlobalSearch', templates, searchInput, semanticSearch],
            () => filterEmptyTemplateTablesOnGlobalSearchRequest(templates, searchInput, semanticSearch),
            {
                onSuccess: (data) => {
                    if (data.length === 0 && pageType === 'globalSearch') {
                        // if there are no entities to show in the global search page, stop the tour
                        setSteps!((currSteps) => currSteps.slice(0, 4));
                    }
                },
                onError(error) {
                    console.error('Failed to load templates counts', error);
                    toast.error(i18next.t('entitiesTableOfTemplate.failedToLoadData'));
                },
            },
        );

        const viewResultsRef = useRef<TemplateTablesViewResultsRef>(null);

        useImperativeHandle(ref, () => ({
            refetch: refetchTemplatesFilteredByCount,
            templateTablesRefs: viewResultsRef.current?.templateTablesRefs,
        }));

        return (
            <Grid container>
                {isLoadingTemplatesFilteredByCount && (
                    <Grid container justifyContent="center">
                        <CircularProgress />
                    </Grid>
                )}
                {!isLoadingTemplatesFilteredByCount && templatesFilteredByCount?.length === 0 && (
                    <Typography>{i18next.t('noSearchResults')}</Typography>
                )}
                {!isLoadingTemplatesFilteredByCount && templatesFilteredByCount && (
                    <TemplateTablesViewResults
                        ref={viewResultsRef}
                        templates={templatesFilteredByCount}
                        searchInput={searchInput}
                        pageType={pageType}
                        setUpdatedEntities={setUpdatedEntities}
                        setUpdatedTemplateIds={setUpdatedTemplateIds}
                    />
                )}
            </Grid>
        );
    },
);

export default TemplateTablesView;
