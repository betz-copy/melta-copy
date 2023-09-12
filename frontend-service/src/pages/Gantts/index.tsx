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
import { IPermissionsOfUser } from '../../services/permissionsService';

const { infiniteScrollPageCount } = environment.gantts;

interface IGanttsPageProps {
    setTitle: React.Dispatch<React.SetStateAction<string>>;
}

const GanttsPage: React.FC<IGanttsPageProps> = ({ setTitle }) => {
    const queryClient = useQueryClient();
    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    const [search, setSearch] = useState<string>();
    const [ganttDialogOpen, setGanttDialogOpen] = useState<boolean>(false);

    useEffect(() => setTitle(i18next.t('pages.gantts')), [setTitle]);

    const queryKey = ['searchGantts', search];

    return (
        <>
            <Grid container direction="column" padding="0 4rem">
                <Grid container item justifyContent="space-between" padding="0.5rem">
                    <Box>
                        <GlobalSearchBar onSearch={(searchValue) => setSearch(searchValue || undefined)} />
                    </Box>
                    {myPermissions.templatesManagementId && (
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
                            // eslint-disable-next-line no-console
                            console.log('failed loading gantts: ', error);
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
