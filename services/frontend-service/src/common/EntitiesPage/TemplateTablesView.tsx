import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import _isEqual from 'lodash.isequal';
import { CircularProgress, Grid, Typography } from '@mui/material';
import { useQuery } from 'react-query';
import { useTour } from '@reactour/tour';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { IEntity, IMongoEntityTemplateWithConstraintsPopulated } from '@microservices/shared-interfaces';
import { TemplateTable, TemplateTableRef } from './TemplateTable';
import { getCountByTemplateIdsRequest } from '../../services/entitiesService';
import { environment } from '../../globals';

const { tablesPerLoadingChunkSize } = environment.ganttSettings;
type TemplateTablesViewResultsRef = {
    templateTablesRefs: Record<string, TemplateTableRef>;
};

const TemplateTablesViewResults = forwardRef<
    TemplateTablesViewResultsRef,
    {
        templates: IMongoEntityTemplateWithConstraintsPopulated[];
        searchInput: string;
        pageSize?: number;
        pageType: string;
        setUpdatedEntities: React.Dispatch<React.SetStateAction<IEntity[]>>;
    }
>(({ templates, searchInput, pageType, setUpdatedEntities }, ref) => {
    const templateTablesRefs = useRef<Record<string, TemplateTableRef>>({});
    const [visibleTemplatesCount, setVisibleTemplatesCount] = useState<number>(tablesPerLoadingChunkSize);
    const loaderRef = useRef(null);

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

    return (
        <Grid container direction="column" spacing={1}>
            {templates.slice(0, visibleTemplatesCount).map((template) => (
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
                    />
                </Grid>
            ))}
            {visibleTemplatesCount < templates.length && (
                <Grid item container justifyContent="center" ref={loaderRef}>
                    <CircularProgress />
                </Grid>
            )}
        </Grid>
    );
});

const filterEmptyTemplateTablesOnGlobalSearchRequest = async (
    templates: IMongoEntityTemplateWithConstraintsPopulated[],
    searchInput: string,
    semanticSearch: boolean,
) => {
    const entitiesCountByTemplates = await getCountByTemplateIdsRequest(
        templates.map(({ _id }) => _id),
        searchInput,
        semanticSearch,
    );

    return templates.flatMap((template) => {
        const entityCount = entitiesCountByTemplates.find((countByTemplate) => countByTemplate.templateId === template._id);
        return entityCount?.count ? { ...template, entityIdsToInclude: entityCount.entityIdsToInclude } : [];
    });
};

export interface TemplateTablesViewProps {
    templates: IMongoEntityTemplateWithConstraintsPopulated[];
    searchInput: string;
    pageType: string;
    semanticSearch: boolean;
    setUpdatedEntities: React.Dispatch<React.SetStateAction<IEntity[]>>;
}

export interface TemplateTablesViewRef {
    refetch: () => void;
    templateTablesRefs: Record<string, TemplateTableRef> | undefined;
}

const TemplateTablesView = forwardRef<TemplateTablesViewRef, TemplateTablesViewProps>(
    ({ templates, searchInput, pageType, setUpdatedEntities, semanticSearch }, ref) => {
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
                    console.log('Failed to load templates counts', error);
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
                    />
                )}
            </Grid>
        );
    },
);

export default TemplateTablesView;
