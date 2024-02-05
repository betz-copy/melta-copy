import { Box, Grid } from '@mui/material';
import i18next from 'i18next';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { environment } from '../../globals';
import { IEntity } from '../../interfaces/entities';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import EntityCard from '../../pages/GlobalSearch/components/entityCard';
import { getEntitiesWithDirectConnections } from '../../services/entitiesService';
import { InfiniteScroll } from '../InfiniteScroll';

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

    useImperativeHandle(ref, () => ({
        refetch: () => queryClient.resetQueries({ queryKey: ['searchEntities', templateIds, searchInput], exact: true }),
    }));

    return (
        <Grid container direction="column" spacing={3}>
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
                <InfiniteScroll<IEntity>
                    queryKey={['searchEntities', templateIds, searchInput]}
                    queryFunction={async ({ pageParam: startRow = 0 }) => {
                        if (startRow === 0) {
                            // if loading startRow, entities count not known yet
                            setEntitiesCount(null);
                        }

                        const searchEntitiesResult = await getEntitiesWithDirectConnections({
                            skip: startRow,
                            limit: infiniteScrollPageCount,
                            textSearch: searchInput,
                            templates: Object.fromEntries(templateIds.map((templateId) => [templateId, { showRelationships: false }])),
                        });

                        setEntitiesCount(searchEntitiesResult.count);

                        return searchEntitiesResult.entities.map(({ entity }) => entity);
                    }}
                    onQueryError={(error) => {
                        console.log('failed to search entities error:', error);
                        toast.error(i18next.t('entitiesCardView.failedToLoadResults'));

                        setEntitiesCount(null);
                    }}
                    getItemId={(entity) => entity.properties._id}
                    getNextPageParam={(lastPage, allPages) => {
                        const nextPage = allPages.length * infiniteScrollPageCount;
                        return lastPage.length ? nextPage : undefined;
                    }}
                    endText={i18next.t('entitiesCardView.noSearchLeft')}
                    openIds={openCardsMap}
                    direction='row'
                    wrap='wrap'
                    spacing={2}
                >
                    {(entity) => {
                        const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates');
                        const entityTemplate = entityTemplates?.get(entity.templateId)!;
                        return (
                            <Box sx={{ marginBottom: '0.5rem' }}>
                                <EntityCard
                                    entity={entity}
                                    entityTemplate={entityTemplate}
                                    expandCard={openCardsMap.has(entity.properties._id)}
                                    onExpand={(entityId: string) => {
                                        setOpenCardsMap(map => new Map(map.set(entityId, !openCardsMap.get(entityId))));
                                    }}
                                />
                            </Box>
                        );
                    }}
                </InfiniteScroll>
            </Grid>
        </Grid>
    );
});

export default CardsView;
