import { Grid } from '@mui/material';
import i18next from 'i18next';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { environment } from '../../globals';
import { IChildTemplateMap, IMongoChildTemplatePopulated } from '../../interfaces/childTemplates';
import { IEntityWithDirectConnections } from '../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { ISemanticSearchResult } from '../../interfaces/semanticSearch';
import EntityCard from '../../pages/GlobalSearch/components/entityCard';
import { getEntitiesWithDirectConnections } from '../../services/entitiesService';
import { useUserStore } from '../../stores/user';
import { convertToBool } from '../../utils/convertStringToBool';
import { useSearchParams } from '../../utils/hooks/useSearchParams';
import { isChildTemplate } from '../../utils/templates';
import { InfiniteScroll } from '../InfiniteScroll';
import { getDefaultFilterFromTemplate } from './TemplateTablesView';

const { infiniteScrollPageCount } = environment.entitiesCardsView;

export interface CardsViewRef {
    refetch: () => void;
}

export interface CardsViewProps {
    templateIds: string[];
    searchInput: string;
    templates: (IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated)[];
}

const CardsView = forwardRef<CardsViewRef, CardsViewProps>(({ templateIds, searchInput, templates }, ref) => {
    const [entitiesCount, setEntitiesCount] = useState<number | null>(null);
    const [openCardsMap, setOpenCardsMap] = useState<Map<string, boolean>>(new Map());
    const queryClient = useQueryClient();
    const [urlSearchParams, _setUrlSearchParams] = useSearchParams();
    const urlSemanticSearch = urlSearchParams.get('semanticSearch');

    const refetch = () => queryClient.invalidateQueries(['searchEntities', templateIds, searchInput, urlSemanticSearch], { exact: true });
    useImperativeHandle(ref, () => ({ refetch }));

    const currentUser = useUserStore((state) => state.user);
    const currentUserKartoffelId = currentUser?.externalMetadata?.kartoffelId;
    const currentUserUnit = currentUser?.unit;

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
                    <InfiniteScroll<
                        IEntityWithDirectConnections & { minioFileIdsWithTexts?: ISemanticSearchResult[string][string]; childTemplateId?: string }
                    >
                        queryKey={['searchEntities', templateIds, searchInput, urlSemanticSearch]}
                        queryFunction={async ({ pageParam: startRow = 0 }) => {
                            if (startRow === 0) {
                                setEntitiesCount(null);
                            }

                            const childTemplates = templates.filter(isChildTemplate);
                            const parentTemplates = templates.filter((template) => !isChildTemplate(template));

                            let entities: (IEntityWithDirectConnections & { minioFileIdsWithTexts?: ISemanticSearchResult[string][string] })[] = [];

                            if (parentTemplates.length > 0) {
                                const result = await getEntitiesWithDirectConnections({
                                    skip: startRow,
                                    limit: infiniteScrollPageCount,
                                    textSearch: searchInput,
                                    templates: Object.fromEntries(parentTemplates.map((t) => [t._id, { showRelationships: false }])),
                                    shouldSemanticSearch: convertToBool(urlSemanticSearch!),
                                });

                                entities.push(...result.entities);
                            }

                            for (const template of childTemplates) {
                                const filter = getDefaultFilterFromTemplate(template, true, currentUserKartoffelId, currentUserUnit);

                                const result = await getEntitiesWithDirectConnections({
                                    skip: startRow,
                                    limit: infiniteScrollPageCount,
                                    textSearch: searchInput,
                                    templates: {
                                        [template.parentTemplate._id!]: {
                                            showRelationships: false,
                                            filter,
                                        },
                                    },
                                    shouldSemanticSearch: convertToBool(urlSemanticSearch!),
                                });

                                const mappedEntities = result.entities.map((entity) => ({
                                    ...entity,
                                    childTemplateId: template._id,
                                }));

                                entities.push(...mappedEntities);
                            }

                            setEntitiesCount(entities.length);
                            return entities;
                        }}
                        onQueryError={(error) => {
                            console.error('failed to search entities error:', error);
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
                        {({ entity, minioFileIdsWithTexts, childTemplateId }) => {
                            const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates');
                            const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildEntityTemplates')!;

                            const entityTemplate = entityTemplates?.get(entity.templateId)!;
                            const childEntityTemplate = childTemplateId ? childTemplates?.get(childTemplateId)! : undefined;
                            const template = childEntityTemplate ?? entityTemplate;

                            return (
                                <EntityCard
                                    minioFileId={minioFileIdsWithTexts?.[0].minioFileId} // Navigate to the first found file
                                    matchedSentence={minioFileIdsWithTexts?.[0].text}
                                    entity={entity}
                                    entityTemplate={template}
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
