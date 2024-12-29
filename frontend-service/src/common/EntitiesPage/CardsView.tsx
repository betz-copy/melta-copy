import { Grid } from '@mui/material';
import i18next from 'i18next';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { environment } from '../../globals';
import { IEntityWithDirectConnections } from '../../interfaces/entities';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import EntityCard from '../../pages/GlobalSearch/components/entityCard';
import { getEntitiesWithDirectConnections } from '../../services/entitiesService';
import { InfiniteScroll } from '../InfiniteScroll';
import { useSearchParams } from '../../utils/hooks/useSearchParams';
import { convertToBool } from '../../utils/convertStringToBool';

const { infiniteScrollPageCount } = environment.entitiesCardsView;

export interface CardsViewRef {
    refetch: () => void;
}

export interface CardsViewProps {
    templateIds: string[];
    searchInput: string;
}

const CardsView = forwardRef<CardsViewRef, CardsViewProps>(({ templateIds, searchInput }, ref) => {
    const [entitiesCount, setEntitiesCount] = useState<number | null>(null);
    const [openCardsMap, setOpenCardsMap] = useState<Map<string, boolean>>(new Map());
    const queryClient = useQueryClient();
    const [urlSearchParams, _setUrlSearchParams] = useSearchParams();
    const urlSemanticSearch = urlSearchParams.get('semanticSearch');

    const refetch = () => queryClient.invalidateQueries({ queryKey: ['searchEntities', templateIds, searchInput], exact: true });

    useImperativeHandle(ref, () => ({ refetch }));

    return (
        <Grid container direction="column" spacing={4}>
            <Grid item>
                <Grid container direction="column" spacing={1}>
                    {entitiesCount !== null && (
                        <Grid item sx={{ color: '#70757a' }}>
                            {i18next.t('entitiesCardView.numberOfSearchResults.approximately')}
                            {entitiesCount} {i18next.t('entitiesCardView.numberOfSearchResults.results')}
                        </Grid>
                    )}
                </Grid>
            </Grid>
            <Grid item>
                <Grid container>
                    <InfiniteScroll<IEntityWithDirectConnections & { minioFileIds?: string[] }>
                        queryKey={['searchEntities', templateIds, searchInput, urlSemanticSearch]}
                        queryFunction={async ({ pageParam: startRow = 0 }) => {
                            if (startRow === 0) {
                                setEntitiesCount(null);
                            }

                            const searchEntitiesResult = await getEntitiesWithDirectConnections({
                                skip: startRow,
                                limit: infiniteScrollPageCount,
                                textSearch: searchInput,
                                templates: Object.fromEntries(templateIds.map((templateId) => [templateId, { showRelationships: false }])),
                                shouldSemanticSearch: convertToBool(urlSemanticSearch!),
                            });

                            setEntitiesCount(searchEntitiesResult.count);
                            return searchEntitiesResult.entities;
                        }}
                        onQueryError={(error) => {
                            // eslint-disable-next-line no-console
                            console.log('failed to search entities error:', error);
                            toast.error(i18next.t('entitiesCardView.failedToLoadResults'));

                            setEntitiesCount(null);
                        }}
                        getItemId={({ entity }) => entity.properties._id}
                        getNextPageParam={(lastPage, allPages) => {
                            const nextPage = allPages.length * infiniteScrollPageCount;
                            return lastPage.length ? nextPage : undefined;
                        }}
                        endText={i18next.t('entitiesCardView.noSearchLeft')}
                        openIds={openCardsMap}
                        useContainer={false}
                    >
                        {({ entity, minioFileIds }) => {
                            const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates');
                            const entityTemplate = entityTemplates?.get(entity.templateId)!;
                            return (
                                <EntityCard
                                    minioFileId={minioFileIds?.[0]} // Navigate to the first found file
                                    entity={entity}
                                    entityTemplate={entityTemplate}
                                    expandCard={openCardsMap.has(entity.properties._id)}
                                    onExpand={(entityId) => {
                                        setOpenCardsMap((map) => new Map(map.set(entityId, !openCardsMap.get(entityId))));
                                    }}
                                    refetchQuery={refetch}
                                    searchedText={searchInput}
                                />
                            );
                        }}
                    </InfiniteScroll>
                </Grid>
            </Grid>
        </Grid>
    );
});

export default CardsView;
