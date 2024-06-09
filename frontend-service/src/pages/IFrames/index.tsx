import React, { useEffect, useState } from 'react';
import { Box, Grid, IconButton } from '@mui/material';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { AddCircle as AddCircleIcon } from '@mui/icons-material';
import { useQueryClient } from 'react-query';
import { ViewingBox } from '../SystemManagement/components/ViewingBox';
import { InfiniteScroll } from '../../common/InfiniteScroll';
import { IFramesCard } from './Card';
import { searchIFrames } from '../../services/iFramesService';
import { IGantt } from '../../interfaces/iFrames';
import { environment } from '../../globals';
import { GlobalSearchBar } from '../../common/EntitiesPage/Headline';
import { CreateGanttDialog } from './CreateIFramesDialog';
import { IPermissionsOfUser } from '../../services/permissionsService';

const { infiniteScrollPageCount } = environment.iFrameSettings;

interface IIFramesPageProps {
    setTitle: React.Dispatch<React.SetStateAction<string>>;
}

const IFramesPage: React.FC<IIFramesPageProps> = ({ setTitle }) => {
    const queryClient = useQueryClient();
    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    const [search, setSearch] = useState<string>();
    const [iFrameDialogOpen, setIFrameDialogOpen] = useState<boolean>(false);

    useEffect(() => setTitle(i18next.t('pages.iFrames')), [setTitle]);

    const queryKey = ['searchIFrames', search];

    return (
        <>
            <Grid container direction="column" padding="0 4rem">
                <Grid container item justifyContent="space-between" padding="0.5rem">
                    <Box>
                        <GlobalSearchBar onSearch={(searchValue) => setSearch(searchValue || undefined)} />
                    </Box>
                    {myPermissions.templatesManagementId && (
                        <IconButton onClick={() => setIFrameDialogOpen(true)}>
                            <AddCircleIcon color="primary" fontSize="large" />
                        </IconButton>
                    )}
                </Grid>

                <ViewingBox minHeight="82vh">
                    <InfiniteScroll<IFrame>
                        queryKey={queryKey}
                        queryFunction={async ({ pageParam }) => searchIFrames({ limit: infiniteScrollPageCount, step: pageParam, search })}
                        onQueryError={(error) => {
                            // eslint-disable-next-line no-console
                            console.log('failed loading iFrames: ', error);
                            toast.error(i18next.t('iFrames.searchFailed'));
                        }}
                        emptyText={i18next.t('iFrames.noIFramesFound')}
                        useContainer={false}
                    >
                        {(iFrame) => <IFramesCard iFrame={iFrame} />}
                    </InfiniteScroll>
                </ViewingBox>
            </Grid>

            <CreateIFrameDialog
                open={ganttDialogOpen}
                onClose={() => {
                    setIFrameDialogOpen(false);
                    queryClient.invalidateQueries(queryKey);
                }}
            />
        </>
    );
};

export default IFramesPage;
