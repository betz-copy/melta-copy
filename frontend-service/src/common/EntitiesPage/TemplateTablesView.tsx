import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import _isEqual from 'lodash.isequal';
import { CircularProgress, Grid, Typography } from '@mui/material';
import { useQuery } from 'react-query';
import pLimit from 'p-limit';
import { useTour } from '@reactour/tour';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { TemplateTable, TemplateTableRef } from './TemplateTable';
import { searchEntitiesOfTemplateRequest } from '../../services/entitiesService';
import { environment } from '../../globals';

const { tablesPerLoadingChunkSize } = environment.ganttSettings;
type TemplateTablesViewResultsRef = {
    templateTablesRefs: Record<string, TemplateTableRef>;
};

const TemplateTablesViewResults = forwardRef<
    TemplateTablesViewResultsRef,
    {
        templates: IMongoEntityTemplatePopulated[];
        searchInput: string;
        pageSize?: number;
        pageType: string;
    }
>(({ templates, searchInput, pageType }, ref) => {
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

const getTemplateCount = async (templateId: string, searchInput: string) => {
    const { count } = await searchEntitiesOfTemplateRequest(templateId, {
        skip: 0,
        limit: 1,
        textSearch: searchInput,
    });
    return count;
};

const filterEmptyTemplateTablesOnGlobalSearchRequest = async (templates: IMongoEntityTemplatePopulated[], searchInput: string) => {
    const pLimitGetTemplateCount = pLimit(10);
    const templatesCountsPromises = templates.map(({ _id }) => pLimitGetTemplateCount(() => getTemplateCount(_id, searchInput)));
    const templatesCounts = await Promise.all(templatesCountsPromises);
    return templates.filter((_template, index) => {
        const count = templatesCounts[index];
        return count > 0;
    });
};

export interface TemplateTablesViewProps {
    templates: IMongoEntityTemplatePopulated[];
    searchInput: string;
    pageType: string;
}

export interface TemplateTablesViewRef {
    refetch: () => void;
    templateTablesRefs: Record<string, TemplateTableRef>;
}

const TemplateTablesView = forwardRef<TemplateTablesViewRef, TemplateTablesViewProps>(({ templates, searchInput, pageType }, ref) => {
    const { setSteps } = useTour();

    const {
        data: templatesFilteredByCount,
        refetch: refetchTemplatesFilteredByCount,
        isFetching: isLoadingTemplatesFilteredByCount,
    } = useQuery(
        ['filterEmptyTemplateTablesOnGlobalSearch', templates, searchInput],
        () => filterEmptyTemplateTablesOnGlobalSearchRequest(templates, searchInput),
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

    const templateTablesRefs = useRef<Record<string, TemplateTableRef>>({});

    useImperativeHandle(ref, () => ({
        refetch: refetchTemplatesFilteredByCount,
        templateTablesRefs: templateTablesRefs.current,
    }));

    return (
        <Grid container>
            {isLoadingTemplatesFilteredByCount && (
                <Grid container justifyContent="center">
                    <CircularProgress />
                </Grid>
            )}
            {!isLoadingTemplatesFilteredByCount && templatesFilteredByCount?.length === 0 && <Typography>{i18next.t('noSearchResults')}</Typography>}
            {!isLoadingTemplatesFilteredByCount && templatesFilteredByCount && (
                <TemplateTablesViewResults
                    ref={(el) => {
                        if (el) templateTablesRefs.current = el.templateTablesRefs;
                    }}
                    templates={templatesFilteredByCount}
                    searchInput={searchInput}
                    pageType={pageType}
                />
            )}
        </Grid>
    );
});

export default TemplateTablesView;
