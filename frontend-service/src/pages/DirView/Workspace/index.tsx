import { Folder } from '@mui/icons-material';
import { Box, Card, Typography } from '@mui/material';
import React, { useMemo } from 'react';
import { Link } from 'wouter';
import { Mode } from '..';
import { CustomIcon } from '../../../common/CustomIcon';
import { MeltaIcon } from '../../../common/MeltaIcon';
import { MeltaTooltip } from '../../../common/MeltaTooltip';
import { IWorkspace, WorkspaceTypes } from '../../../interfaces/workspaces';
import { useWorkspaceStore } from '../../../stores/workspace';

interface IWorkspaceProps {
    workspace: IWorkspace;
    mode: Mode;
    openWizard: (workspace: IWorkspace) => void;
    setMovedWorkspace: (workspace: IWorkspace | null) => void;
    isMoved?: boolean;
    hasMovedWorkspace?: boolean;
}

export const Workspace: React.FC<IWorkspaceProps> = ({
    workspace: { name, path, type, colors, iconFileId, logoFileId, _id },
    mode,
    openWizard,
    setMovedWorkspace,
    isMoved,
    hasMovedWorkspace,
}) => {
    const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);

    const workspaceIcon = useMemo(() => {
        const defaultIconStyle: React.CSSProperties = { fontSize: '9rem', stroke: colors.primary, strokeWidth: '0.03rem' };

        switch (type) {
            case WorkspaceTypes.mlt:
                return (
                    <MeltaIcon
                        iconUrl={iconFileId}
                        style={{
                            ...defaultIconStyle,
                            width: '9.5rem',
                            height: '9.5rem',
                            padding: '0.5rem',
                            filter: iconFileId ? '' : 'drop-shadow(1px 1px 1px #000)',
                        }}
                    />
                );
            case WorkspaceTypes.dir:
                return (
                    <Box position="relative">
                        <Folder sx={defaultIconStyle} />

                        {iconFileId && (
                            <CustomIcon
                                iconUrl={iconFileId}
                                height="65px"
                                width="65px"
                                style={{ position: 'absolute', transform: 'translate(-50%, -50%)', top: '51.5%', left: '50%' }}
                                preserveColor
                            />
                        )}
                    </Box>
                );
            default:
                return null;
        }
    }, [type, iconFileId, colors]);

    const allowNavigation = useMemo(
        () => mode === Mode.view || (mode === Mode.move && hasMovedWorkspace && !isMoved),
        [mode, isMoved, hasMovedWorkspace],
    );

    return (
        <MeltaTooltip title={name} placement="bottom">
            <Link
                href={allowNavigation ? `${path}${path === '/' ? '' : '/'}${name}${type}` : ''}
                replace={!allowNavigation}
                style={{
                    textDecoration: 'none',
                    ...(mode === Mode.edit ? { cursor: 'url(/icons/edit-icon.svg), pointer' } : {}),
                    ...(isMoved ? { cursor: 'default' } : {}),
                }}
            >
                <Card
                    sx={{
                        width: '13rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.1)' },
                        ...(isMoved ? { opacity: 0.8, backgroundColor: 'rgba(0, 0, 0, 0.1)' } : {}),
                    }}
                    onClick={() => {
                        const workspace = { name, path, type, colors, iconFileId, logoFileId, _id };

                        switch (mode) {
                            case Mode.edit:
                                openWizard(workspace);
                                break;
                            case Mode.move:
                                if (!hasMovedWorkspace) setMovedWorkspace(workspace);
                                break;
                            default:
                                setWorkspace(workspace);
                                break;
                        }
                    }}
                >
                    {workspaceIcon}

                    <Typography
                        sx={{
                            width: '10rem',
                            fontSize: '2.5rem',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textAlign: 'center',
                        }}
                    >
                        {name}
                    </Typography>
                </Card>
            </Link>
        </MeltaTooltip>
    );
};
