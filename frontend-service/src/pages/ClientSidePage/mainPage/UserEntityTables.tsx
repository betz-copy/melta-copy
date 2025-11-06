import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { IMongoChildTemplatePopulated } from '../../../interfaces/childTemplates';
import { IEntity } from '../../../interfaces/entities';
import { TemplateTablesViewResultsRef } from '../../../common/EntitiesPage/TemplateTablesView';
import { useQuery, useQueryClient } from 'react-query';
import { countEntitiesOfTemplatesByUserEntityId } from '../../../services/clientSideService';
import { IEntitySingleProperty, IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import TemplateTable, { TemplateTableRef } from '../../../common/EntitiesPage/TemplateTable';
import { CircularProgress, Typography } from '@mui/material';
import { Grid } from '@mui/material';
import i18next from 'i18next';
import { TablePageType } from '../../../common/EntitiesTableOfTemplate';

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
            <>
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
                            {templatesFilteredByCount.map((childTemplate) => {
                                const parentTemplate = entityTemplates.get(childTemplate.parentTemplate._id);
                                if (!parentTemplate) return null;

                                const childTemplatePropertiesList = Object.keys(childTemplate.properties.properties);
                                const childTemplateProperties = Object.fromEntries(
                                    Object.entries(parentTemplate.properties.properties).filter(([key]) => childTemplatePropertiesList.includes(key)),
                                ) as Record<string, IEntitySingleProperty & { defaultValue?: any; isEditableByUser?: boolean }>;

                                Object.keys(childTemplateProperties).forEach(
                                    (propertyKey) =>
                                        (childTemplateProperties[propertyKey] = {
                                            ...childTemplateProperties[propertyKey],
                                            isEditableByUser: childTemplate.properties.properties[propertyKey].isEditableByUser,
                                            defaultValue: childTemplate.properties.properties[propertyKey].defaultValue,
                                        }),
                                );

                                const defaultFilter = childTemplate.properties.properties
                                    ? Object.entries(childTemplate.properties.properties).reduce(
                                          (acc, [key, prop]) => {
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
                                                          acc = { $and: transformedFilters };
                                                      }
                                                  } else {
                                                      acc[key] = filters;
                                                  }
                                              }
                                              return acc;
                                          },
                                          { $and: { disabled: { $eq: false } } } as Record<string, unknown>,
                                      )
                                    : {};

                                const childTemplatePopulated = {
                                    ...parentTemplate,
                                    displayName: childTemplate.displayName,
                                    properties: {
                                        ...parentTemplate.properties,
                                        properties: childTemplateProperties,
                                    },
                                    propertiesOrder: parentTemplate.propertiesOrder.filter((property) =>
                                        childTemplatePropertiesList.includes(property),
                                    ),
                                };
                                return (
                                    <Grid key={childTemplate._id}>
                                        <TemplateTable
                                            ref={(el) => {
                                                if (el) {
                                                    templateTablesRefs.current[childTemplate._id] = el;
                                                } else {
                                                    delete templateTablesRefs.current[childTemplate._id];
                                                }
                                            }}
                                            template={childTemplatePopulated}
                                            quickFilterText={''}
                                            page={TablePageType.clientSide}
                                            defaultFilter={defaultFilter}
                                        />
                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}
                </Grid>
            </>
        );
    },
);

export default UserEntityTables;
