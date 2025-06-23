import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
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

const { tablesPerLoadingChunkSize } = environment.ganttSettings;

export type TemplateTablesViewResultsRef = {
    templateTablesRefs: Record<string, TemplateTableRef>;
};

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
    return (
        <Grid container direction="column" spacing={1}>
            {templates.slice(0, visibleTemplatesCount).map((template) => {
                const isChildTemplate = !!template.fatherTemplateId;

                const defaultFilter = isChildTemplate
                    ? Object.entries(template.properties.properties).reduce(
                          (acc: { $and?: Array<Record<string, unknown>> }, [key, prop]) => {
                              if (prop.filters) {
                                  const filters = typeof prop.filters === 'string' ? JSON.parse(prop.filters) : prop.filters;

                                  if (filters.$and) {
                                      const transformedFilters = filters.$and
                                          .map((filter: any) => {
                                              const fieldFilter = filter[key];
                                              if (fieldFilter) {
                                                  return { [key]: fieldFilter };
                                              }
                                              return null;
                                          })
                                          .filter(Boolean);

                                      if (transformedFilters.length > 0) {
                                          if (!acc.$and) acc.$and = [];
                                          acc.$and = [...acc.$and, ...transformedFilters];
                                      }
                                  } else {
                                      if (!acc.$and) acc.$and = [];
                                      acc.$and.push({ [key]: filters });
                                  }
                              }
                              return acc;
                          },
                          { $and: [{ disabled: { $eq: false } }] } as { $and?: Array<Record<string, unknown>> },
                      )
                    : undefined;

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
                            {...(defaultFilter ? { defaultFilter } : {})}
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
