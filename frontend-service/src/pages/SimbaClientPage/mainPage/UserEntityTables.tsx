import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { IMongoChildEntityTemplatePopulated } from '../../../interfaces/entityChildTemplates';
import { IEntity } from '../../../interfaces/entities';
import { TemplateTablesViewResultsRef } from '../../../common/EntitiesPage/TemplateTablesView';
import { useQuery } from 'react-query';
import { countEntitiesOfTemplatesByUserEntityId } from '../../../services/simbaService';
import { IEntitySingleProperty } from '../../../interfaces/entityTemplates';
import { TemplateTable, TemplateTableRef } from '../../../common/EntitiesPage/TemplateTable';
import { CircularProgress, Typography } from '@mui/material';
import { Grid } from '@mui/material';
import i18next from 'i18next';

interface IUserEntityTablesProps {
    childTemplates: IMongoChildEntityTemplatePopulated[];
    currentUserFromSimba: IEntity;
    usersInfoChildTemplate: IMongoChildEntityTemplatePopulated;
}

const filterEmptyTemplateTablesOnSimbaPage = async (templates: IMongoChildEntityTemplatePopulated[], userEntityId: string) => {
    const entitiesCountByTemplates = await countEntitiesOfTemplatesByUserEntityId(
        templates.map(({ fatherTemplateId }) => fatherTemplateId._id),
        userEntityId,
    );

    return templates.flatMap((template) => {
        const entityCount = entitiesCountByTemplates.find((countByTemplate) => countByTemplate.templateId === template.fatherTemplateId._id);
        return entityCount?.count ? { ...template, entitiesWithFiles: entityCount.entitiesWithFiles, texts: entityCount.texts } : [];
    });
};

export type UserEntityTablesRef = {
    refetch: () => void;
    templateTablesRefs: Record<string, TemplateTableRef> | undefined;
};

const UserEntityTables = forwardRef<UserEntityTablesRef, IUserEntityTablesProps>(
    ({ childTemplates, currentUserFromSimba, usersInfoChildTemplate }, ref) => {
        const {
            data: templatesFilteredByCount,
            refetch: refetchTemplatesFilteredByCount,
            isFetching: isLoadingTemplatesFilteredByCount,
        } = useQuery({
            queryKey: ['countEntitiesOfTemplatesByUser', usersInfoChildTemplate?.fatherTemplateId._id, currentUserFromSimba.properties._id],
            queryFn: () => filterEmptyTemplateTablesOnSimbaPage(Array.from(childTemplates.values()), currentUserFromSimba.properties._id!),
            enabled: !!currentUserFromSimba,
        });

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
                                const childTemplatePropertiesList = Object.keys(childTemplate.properties);
                                const childTemplateProperties = Object.fromEntries(
                                    Object.entries(childTemplate.fatherTemplateId.properties.properties).filter(([key]) =>
                                        childTemplatePropertiesList.includes(key),
                                    ),
                                ) as Record<string, IEntitySingleProperty>;

                                const defaultFilter = childTemplate.properties
                                    ? Object.entries(childTemplate.properties).reduce(
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

                                console.log(defaultFilter);

                                const childTemplatePopulated = {
                                    ...childTemplate.fatherTemplateId,
                                    displayName: childTemplate.displayName,
                                    properties: {
                                        ...childTemplate.fatherTemplateId.properties,
                                        properties: childTemplateProperties,
                                    },
                                    propertiesOrder: childTemplate.fatherTemplateId.propertiesOrder.filter((property) =>
                                        childTemplatePropertiesList.includes(property),
                                    ),
                                };
                                return (
                                    <Grid item key={childTemplate._id}>
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
                                            page="simba"
                                            setUpdatedEntities={() => {}}
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
