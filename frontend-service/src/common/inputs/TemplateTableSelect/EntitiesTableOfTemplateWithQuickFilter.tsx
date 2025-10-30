import { Box, Grid } from '@mui/material';
import _debounce from 'lodash.debounce';
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import { IChildTemplateMap, IChildTemplatePopulated } from '../../../interfaces/childTemplates';
import { IEntity } from '../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { useUserStore } from '../../../stores/user';
import { useWorkspaceStore } from '../../../stores/workspace';
import EntitiesTableOfTemplate, { TablePageType } from '../../EntitiesTableOfTemplate';
import SearchInput from '../SearchInput';
import { getChildTemplatesFilter } from '../TemplateEntitiesAutocomplete';

const EntitiesTableOfTemplateWithQuickFilter: React.FC<{
    entityTemplate: IMongoEntityTemplatePopulated;
    onRowSelected: (entity: IEntity) => void;
    hideNonPreview?: boolean;
}> = ({ entityTemplate, onRowSelected, hideNonPreview }) => {
    const queryClient = useQueryClient();
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildTemplates')!;

    const currentUser = useUserStore((state) => state.user);
    const workspace = useWorkspaceStore((state) => state.workspace);

    const [quickFilterText, setQuickFilterText] = useState('');
    const setQuickFilterTextDebounced = _debounce(setQuickFilterText, 1000);

    const childTemplatesOfParent: IChildTemplatePopulated[] = Array.from(childTemplates.values()).filter(
        ({ parentTemplate: { _id } }) => _id === entityTemplate._id,
    );
    const defaultFilter = getChildTemplatesFilter(childTemplatesOfParent, workspace, true, currentUser);

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'stretch' }}>
            <div>
                <Grid container justifyContent="center">
                    <Grid size={{ xs: 8 }}>
                        <SearchInput onChange={setQuickFilterTextDebounced} />
                    </Grid>
                </Grid>
            </div>
            <div>
                <EntitiesTableOfTemplate
                    template={entityTemplate}
                    showNavigateToRowButton={false}
                    onRowSelected={onRowSelected}
                    getRowId={(entity) => entity.properties._id}
                    getEntityPropertiesData={(entity) => entity.properties}
                    rowModelType="serverSide"
                    quickFilterText={quickFilterText}
                    rowHeight={25}
                    defaultFilter={defaultFilter}
                    fontSize="14px"
                    hideNonPreview={hideNonPreview}
                    saveStorageProps={{
                        shouldSaveFilter: false,
                        shouldSaveWidth: false,
                        shouldSaveVisibleColumns: false,
                        shouldSaveSorting: false,
                        shouldSaveColumnOrder: false,
                        shouldSavePagination: false,
                        shouldSaveScrollPosition: false,
                        pageType: TablePageType.relationship,
                    }}
                    paginationPageSizeSelector={false}
                    childTemplatesOfParent={childTemplatesOfParent}
                />
            </div>
        </Box>
    );
};

export default EntitiesTableOfTemplateWithQuickFilter;
