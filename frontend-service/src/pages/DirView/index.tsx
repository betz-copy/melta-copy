import { Box } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { IWorkspace } from '../../interfaces/workspaces';
import { MainBox } from '../../Main.styled';
import { getDir } from '../../services/workspacesService';
import ErrorPage from '../ErrorPage';
import { Topbar } from './Topbar';
import { Waves } from './Waves';
import { workspaceObjectToWorkspaceForm, WorkspaceWizard } from './Wizard';
import { Workspace } from './Workspace';

export enum Mode {
    view = 'view',
    edit = 'edit',
    move = 'move',
}

const DirView: React.FC<{ params: { '*': string } }> = ({ params }) => {
    const [mode, setMode] = useState(Mode.view);
    const [wizardDialogState, setWizardDialogState] = useState<{ isWizardOpen: boolean; workspace: IWorkspace | null }>({
        isWizardOpen: false,
        workspace: null,
    });

    const [movedWorkspace, setMovedWorkspace] = useState<IWorkspace | null>(null);

    const location = useMemo(() => `/${params['*']}`, [params]);
    const { data, isLoading, isError } = useQuery({
        queryKey: ['getDir', location],
        queryFn: () => getDir(location),
    });

    useEffect(() => {
        if (mode !== Mode.move) setMovedWorkspace(null);
    }, [mode]);

    if (isError) return <ErrorPage errorText={i18next.t('workspaces.requestedWorkspaceDoesntExist')} />;

    return (
        <>
            <Topbar
                loading={isLoading}
                openWizard={() => setWizardDialogState({ isWizardOpen: true, workspace: null })}
                mode={mode}
                setMode={setMode}
                movedWorkspace={movedWorkspace}
                setMovedWorkspace={setMovedWorkspace}
            />

            <MainBox scrollBarMarginTop="0" style={{ overflowY: 'auto', overflowAnchor: 'none' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', padding: '1rem' }}>
                    {data?.map((workspace) =>
                        workspace._id === movedWorkspace?._id ? null : (
                            <Workspace
                                key={workspace._id}
                                workspace={workspace}
                                mode={mode}
                                openWizard={(selectedWorkspace) => setWizardDialogState({ isWizardOpen: true, workspace: selectedWorkspace })}
                                setMovedWorkspace={setMovedWorkspace}
                                hasMovedWorkspace={Boolean(movedWorkspace)}
                            />
                        ),
                    )}

                    {movedWorkspace && (
                        <Workspace
                            workspace={movedWorkspace}
                            mode={mode}
                            openWizard={(selectedWorkspace) => setWizardDialogState({ isWizardOpen: true, workspace: selectedWorkspace })}
                            setMovedWorkspace={setMovedWorkspace}
                            isMoved
                        />
                    )}
                </Box>

                <Waves />
            </MainBox>

            <WorkspaceWizard
                open={wizardDialogState.isWizardOpen}
                handleClose={() => setWizardDialogState({ isWizardOpen: false, workspace: null })}
                initialValues={workspaceObjectToWorkspaceForm(wizardDialogState.workspace)}
                isEditMode={Boolean(wizardDialogState.workspace)}
            />
        </>
    );
};

export default DirView;
