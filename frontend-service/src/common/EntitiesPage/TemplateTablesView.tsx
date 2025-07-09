import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState, useMemo } from 'react';
import _isEqual from 'lodash.isequal';
import { CircularProgress, Grid, Typography } from '@mui/material';
import { useQuery } from 'react-query';
import { useTour } from '@reactour/tour';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { _debounce } from '@ag-grid-community/core';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { TemplateTable, TemplateTableRef } from './TemplateTable';
import { getCountByTemplateIdsRequest } from '../../services/entitiesService';
import { IEntity } from '../../interfaces/entities';
import { environment } from '../../globals';
import { useUserStore } from '../../stores/user';

const { tablesPerLoadingChunkSize } = environment.ganttSettings;

export type TemplateTablesViewResultsRef = {
    templateTablesRefs: Record<string, TemplateTableRef>;
};

export function getDefaultFilterFromTemplate(
    template: IMongoEntityTemplatePopulated & {
        fatherTemplateId?: string;
    },
    isChildTemplate: boolean,
    currentUserKartoffelId?: string,
) {
    if (!isChildTemplate) return undefined;

    let result;

    for (const [key, prop] of Object.entries(template.properties.properties)) {
        if (prop.isFilterByCurrentUser) {
            if (!result?.$and) result = { $and: [] };
            result.$and!.push({ [key]: { $eq: currentUserKartoffelId } });
        }
        if (!prop.filters) continue;

        const filters = typeof prop.filters === 'string' ? JSON.parse(prop.filters) : prop.filters;

        if ('$and' in filters) {
            const andFilters = filters.$and as any[];
            const transformedFilters = andFilters
                .map((filter) => {
                    const fieldFilter = filter[key];
                    return fieldFilter ? { [key]: fieldFilter } : null;
                })
                .filter(Boolean);

            if (transformedFilters.length > 0) {
                if (!result?.$and) result = { $and: [] };
                result.$and!.push(...transformedFilters);
            }
        } else {
            if (!result?.$and) result = { $and: [] };
            result.$and!.push({ [key]: filters });
        }
    }

    return result;
}

const TemplateTablesViewResults = forwardRef<
    TemplateTablesViewResultsRef,
    {
        templates: (IMongoEntityTemplatePopulated & { fatherTemplateId?: string })[];
        searchInput: string;
        pageSize?: number;
        pageType: string;
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

    const currentUser = useUserStore((state) => state.user);
    const currentUserKartoffelId = currentUser?.externalMetadata?.kartoffelId;

    const childTemplateDefaultFilters = useMemo(() => {
        const filters: Record<string, any> = {};
        templates.forEach((template) => {
            const isChildTemplate = !!template.fatherTemplateId;
            filters[template._id] = getDefaultFilterFromTemplate(template, isChildTemplate, currentUserKartoffelId);
        });
        return filters;
    }, [templates, currentUserKartoffelId]);

    return (
        <Grid container direction="column" spacing={1}>
            {templates.slice(0, visibleTemplatesCount).map((template) => {
                const isChildTemplate = !!template.fatherTemplateId;
                return (
                    <Grid item key={template._id}>
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
                            defaultFilter={childTemplateDefaultFilters[template._id]}
                            childTemplateId={isChildTemplate ? template._id : undefined}
                        />
                    </Grid>
                );
            })}
            {visibleTemplatesCount < templates.length && (
                <Grid item container justifyContent="center" ref={loaderRef}>
                    <CircularProgress />
                </Grid>
            )}
        </Grid>
    );
});

const filterEmptyTemplateTablesOnGlobalSearchRequest = async (
    templates: (IMongoEntityTemplatePopulated & { fatherTemplateId?: string })[],
    searchInput: string,
    semanticSearch: boolean,
) => {
    const countRequestTemplateIds = new Set<string>();
    for (const template of templates) {
        countRequestTemplateIds.add(template.fatherTemplateId || template._id);
    }

    const entitiesCountByTemplates = await getCountByTemplateIdsRequest(Array.from(countRequestTemplateIds), searchInput, semanticSearch);

    return templates.flatMap((template) => {
        const countTemplateId = template.fatherTemplateId || template._id;
        const entityCount = entitiesCountByTemplates.find((countByTemplate) => countByTemplate.templateId === countTemplateId);
        return entityCount?.count ? { ...template, entitiesWithFiles: entityCount.entitiesWithFiles, texts: entityCount.texts } : [];
    });
};

export interface TemplateTablesViewProps {
    templates: (IMongoEntityTemplatePopulated & { fatherTemplateId?: string })[];
    searchInput: string;
    pageType: string;
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
