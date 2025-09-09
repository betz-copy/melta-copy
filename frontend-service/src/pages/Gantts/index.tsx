import React, { useEffect, useState } from 'react';
import { Box, Grid, IconButton } from '@mui/material';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { AddCircle as AddCircleIcon } from '@mui/icons-material';
import { useQueryClient } from 'react-query';
import { ViewingBox } from '../SystemManagement/components/ViewingBox';
import { InfiniteScroll } from '../../common/InfiniteScroll';
import { GanttsCard } from './Card';
import { searchGantts } from '../../services/ganttsService';
import { IGantt } from '../../interfaces/gantts';
import { environment } from '../../globals';
import { GlobalSearchBar } from '../../common/EntitiesPage/Headline';
import { CreateGanttDialog } from './CreateGanttDialog';
import { useUserStore } from '../../stores/user';
import { PermissionScope } from '../../interfaces/permissions';

const { infiniteScrollPageCount } = environment.ganttSettings;

interface IGanttsPageProps {
    setTitle: React.Dispatch<React.SetStateAction<string>>;
}

const GanttsPage: React.FC<IGanttsPageProps> = ({ setTitle }) => {
    const currentUser = useUserStore((state) => state.user);

    const queryClient = useQueryClient();

    const [search, setSearch] = useState<string>();
    const [ganttDialogOpen, setGanttDialogOpen] = useState<boolean>(false);

    useEffect(() => setTitle(i18next.t('pages.gantts')), [setTitle]);

    const queryKey = ['searchGantts', search];

    return (
        <>
            <Grid container direction="column" padding="0 4rem">
                <Grid container justifyContent="space-between" padding="0.5rem">
                    <Box>
                        <GlobalSearchBar onSearch={(searchValue) => setSearch(searchValue || undefined)} />
                    </Box>
                    {(currentUser.currentWorkspacePermissions.templates?.scope === PermissionScope.write ||
                        currentUser.currentWorkspacePermissions.admin?.scope === PermissionScope.write) && (
                        <IconButton onClick={() => setGanttDialogOpen(true)}>
                            <AddCircleIcon color="primary" fontSize="large" />
                        </IconButton>
                    )}
                </Grid>

                <ViewingBox minHeight="82vh">
                    <InfiniteScroll<IGantt>
                        queryKey={queryKey}
                        queryFunction={async ({ pageParam }) => searchGantts({ limit: infiniteScrollPageCount, step: pageParam, search })}
                        onQueryError={(error) => {
                            console.error('failed loading gantts: ', error);
                            toast.error(i18next.t('gantts.searchFailed'));
                        }}
                        emptyText={i18next.t('gantts.noGanttsFound')}
                        useContainer={false}
                    >
                        {(gantt) => <GanttsCard gantt={gantt} />}
                    </InfiniteScroll>
                </ViewingBox>
            </Grid>

            <CreateGanttDialog
                open={ganttDialogOpen}
                onClose={() => {
                    setGanttDialogOpen(false);
                    queryClient.invalidateQueries(queryKey);
                }}
            />
        </>
    );
};

export default GanttsPage;
