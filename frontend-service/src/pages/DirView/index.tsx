import { Box, Grid } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useMemo, useState } from 'react';
import { useQueries } from 'react-query';
import { environment } from '../../globals';
import { IWorkspace } from '../../interfaces/workspaces';
import { MainBox } from '../../Main.styled';
import { getDir, getFile } from '../../services/workspacesService';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import ErrorPage from '../ErrorPage';
import { PermissionsDialog } from './PermissionsDialog';
import { Topbar } from './Topbar';
import { Waves } from './Waves';
import { workspaceObjectToWorkspaceForm, WorkspaceWizard } from './Wizard';
import { Workspace } from './Workspace';

const DirView: React.FC<{ params: { '*': string } }> = ({ params }) => {
    const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);
    const currentUser = useUserStore((state) => state.user);
    const setUser = useUserStore((state) => state.setUser);

    const [wizardDialogState, setWizardDialogState] = useState<{ isWizardOpen: boolean; workspace: IWorkspace | null }>({
        isWizardOpen: false,
        workspace: null,
    });
    const [openPermissionsDialog, setOpenPermissionsDialog] = useState(false);
    const [movedWorkspace, setMovedWorkspace] = useState<IWorkspace | null>(null);

    const location = useMemo(() => `/${params['*']}`, [params]);
    const [{ data, isLoading, isError }, { data: currentWorkspace }] = useQueries([
        { queryKey: ['getDir', location], queryFn: () => getDir(location) },
        { queryKey: ['workspace', location], queryFn: () => getFile(location) },
    ]);

    useEffect(() => {
        if (!currentWorkspace) return;

        setWorkspace(currentWorkspace);
        document.title = environment.defaultTitle;

        if (currentUser.currentWorkspacePermissions !== currentUser.permissions[currentWorkspace._id])
            setUser({ ...currentUser, currentWorkspacePermissions: currentUser.permissions[currentWorkspace._id] });
    }, [currentWorkspace, setWorkspace, currentUser, setUser]);

    if (isError) return <ErrorPage errorText={i18next.t('workspaces.requestedWorkspaceDoesntExist')} />;

    return (
        <>
            <Topbar
                loading={isLoading}
                openWizard={() => setWizardDialogState({ isWizardOpen: true, workspace: null })}
                openPermissionsDialog={() => setOpenPermissionsDialog(true)}
            />

            <MainBox scrollBarMarginTop="0" style={{ overflowY: 'auto', overflowAnchor: 'none' }}>
                <Grid container height="80%">
                    <Grid item xs={10}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', padding: '1rem' }}>
                            {data?.map((workspace) =>
                                workspace._id === movedWorkspace?._id ? null : (
                                    <Workspace
                                        key={workspace._id}
                                        workspace={workspace}
                                        openWizard={(selectedWorkspace) => setWizardDialogState({ isWizardOpen: true, workspace: selectedWorkspace })}
                                        setMovedWorkspace={setMovedWorkspace}
                                    />
                                ),
                            )}

                            {movedWorkspace && <Workspace workspace={movedWorkspace} setMovedWorkspace={setMovedWorkspace} isMovedWorkspace />}
                        </Box>
                    </Grid>
                </Grid>
            </MainBox>

            <WorkspaceWizard
                open={wizardDialogState.isWizardOpen}
                handleClose={() => setWizardDialogState({ isWizardOpen: false, workspace: null })}
                initialValues={workspaceObjectToWorkspaceForm(wizardDialogState.workspace)}
                isEditMode={Boolean(wizardDialogState.workspace)}
            />

            <PermissionsDialog open={openPermissionsDialog} handleClose={() => setOpenPermissionsDialog(false)} />

            <Waves />
        </>
    );
};

export default DirView;
