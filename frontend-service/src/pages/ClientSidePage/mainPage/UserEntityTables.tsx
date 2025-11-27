import { CircularProgress, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import TemplateTable, { TemplateTableRef } from '../../../common/EntitiesPage/TemplateTable';
import { TemplateTablesViewResultsRef } from '../../../common/EntitiesPage/TemplateTablesView';
import { TablePageType } from '../../../common/EntitiesTableOfTemplate';
import { IMongoChildTemplatePopulated } from '../../../interfaces/childTemplates';
import { IEntity } from '../../../interfaces/entities';
import { IEntitySingleProperty, IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { countEntitiesOfTemplatesByUserEntityId } from '../../../services/clientSideService';

interface IUserEntityTablesProps {
    childTemplates: IMongoChildTemplatePopulated[];
    currentUserFromClientSide: IEntity;
    usersInfoChildTemplate: IMongoChildTemplatePopulated;
}

const filterEmptyTemplateTablesOnClientSidePage = async (templates: IMongoChildTemplatePopulated[], userEntityId: string) => {
    const entitiesCountByTemplates = await countEntitiesOfTemplatesByUserEntityId(
        templates.map(({ parentTemplate }) => parentTemplate._id),
        userEntityId,
    );

    return templates.flatMap((template) => {
        const entityCount = entitiesCountByTemplates.find((countByTemplate) => countByTemplate.templateId === template.parentTemplate._id);
        return entityCount?.count ? { ...template, entitiesWithFiles: entityCount.entitiesWithFiles, texts: entityCount.texts } : [];
    });
};

export type UserEntityTablesRef = {
    refetch: () => void;
    templateTablesRefs: Record<string, TemplateTableRef> | undefined;
};

const UserEntityTables = forwardRef<UserEntityTablesRef, IUserEntityTablesProps>(
    ({ childTemplates, currentUserFromClientSide, usersInfoChildTemplate }, ref) => {
        const {
            data: templatesFilteredByCount,
            refetch: refetchTemplatesFilteredByCount,
            isFetching: isLoadingTemplatesFilteredByCount,
        } = useQuery({
            queryKey: ['countEntitiesOfTemplatesByUser', usersInfoChildTemplate?.parentTemplate._id, currentUserFromClientSide.properties._id],
            queryFn: () => filterEmptyTemplateTablesOnClientSidePage(Array.from(childTemplates.values()), currentUserFromClientSide.properties._id!),
            enabled: !!currentUserFromClientSide,
        });

        const queryClient = useQueryClient();

        const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getClientSideEntityTemplates')!;

        const viewResultsRef = useRef<TemplateTablesViewResultsRef>(null);

        useImperativeHandle(ref, () => ({
            refetch: refetchTemplatesFilteredByCount,
            templateTablesRefs: viewResultsRef.current?.templateTablesRefs,
        }));

        const templateTablesRefs = useRef<Record<string, TemplateTableRef>>({});

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
                    <Grid container direction="column" spacing={1}>
                        {templatesFilteredByCount.map(({ _id, displayName, properties: { properties }, parentTemplate: { _id: parentId } }) => {
                            const parentTemplate = entityTemplates.get(parentId);
                            if (!parentTemplate) return null;

                            const childTemplatePropertiesList = Object.keys(properties);
                            const childTemplateProperties = Object.fromEntries(
                                Object.entries(parentTemplate.properties.properties).filter(([key]) => childTemplatePropertiesList.includes(key)),
                            ) as Record<string, IEntitySingleProperty & { defaultValue?: any; isEditableByUser?: boolean }>;

                            for (const propertyKey of Object.keys(childTemplateProperties)) {
                                childTemplateProperties[propertyKey] = {
                                    ...childTemplateProperties[propertyKey],
                                    isEditableByUser: properties[propertyKey].isEditableByUser,
                                    defaultValue: properties[propertyKey].defaultValue,
                                };
                            }

                            const defaultFilter = properties
                                ? Object.entries(properties).reduce(
                                      (acc, [key, prop]) => {
                                          if (prop.filters) {
                                              const filters = typeof prop.filters === 'string' ? JSON.parse(prop.filters) : prop.filters;
                                              if (filters.$and) {
                                                  const transformedFilters = filters.$and
                                                      .map((filter: any) => {
                                                          const fieldFilter = filter[key];
                                                          if (fieldFilter) return { [key]: fieldFilter };

                                                          return null;
                                                      })
                                                      .filter(Boolean);

                                                  if (transformedFilters.length) acc = { $and: transformedFilters };
                                              } else acc[key] = filters;
                                          }
                                          return acc;
                                      },
                                      { $and: { disabled: { $eq: false } } } as Record<string, unknown>,
                                  )
                                : {};

                            const childTemplatePopulated = {
                                ...parentTemplate,
                                displayName,
                                properties: {
                                    ...parentTemplate.properties,
                                    properties: childTemplateProperties,
                                },
                                propertiesOrder: parentTemplate.propertiesOrder.filter((property) => childTemplatePropertiesList.includes(property)),
                            };
                            return (
                                <Grid key={_id}>
                                    <TemplateTable
                                        ref={(el) => {
                                            if (el) templateTablesRefs.current[_id] = el;
                                            else delete templateTablesRefs.current[_id];
                                        }}
                                        template={childTemplatePopulated}
                                        quickFilterText={''}
                                        page={TablePageType.clientSide}
                                        setUpdatedEntities={() => {}}
                                        defaultFilter={defaultFilter}
                                    />
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
            </Grid>
        );
    },
);

export default UserEntityTables;
