import { IWorkspace, WorkspaceTypes } from '@microservices/shared';
import { Folder } from '@mui/icons-material';
import { Box, Card, Typography } from '@mui/material';
import React, { useMemo } from 'react';
import { Link } from 'wouter';
import { CustomIcon } from '../../../common/CustomIcon';
import MeltaTooltip from '../../../common/MeltaDesigns/MeltaTooltip';
import { MeltaIcon } from '../../../common/MeltaIcon';
import { useUserStore } from '../../../stores/user';
import { defaultMetadata, useWorkspaceStore } from '../../../stores/workspace';
import { ActionMenu } from './ActionMenu';
import './actionMenu.css';

interface IWorkspaceProps {
    workspace: IWorkspace;
    openWizard?: (workspace: IWorkspace) => void;
    setMovedWorkspace: (workspace: IWorkspace | null) => void;
    isMovedWorkspace?: boolean;
}

export const Workspace: React.FC<IWorkspaceProps> = ({
    workspace: { name, displayName, path, type, colors, iconFileId, logoFileId, _id, metadata },
    openWizard,
    setMovedWorkspace,
    isMovedWorkspace,
}) => {
    const minimalWorkspace = useMemo(
        () => ({ name, displayName, path, type, colors, iconFileId, logoFileId, _id, metadata }),
        [name, displayName, path, type, colors, iconFileId, logoFileId, _id, metadata],
    );

    const currentUser = useUserStore((state) => state.user);
    const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);

    const workspaceIcon = useMemo(() => {
        const defaultIconStyle: React.CSSProperties = { fontSize: '9rem', stroke: colors.primary, strokeWidth: '0.03rem' };

        switch (type) {
            case WorkspaceTypes.mlt:
                return (
                    <MeltaIcon
                        iconUrl={iconFileId}
                        workspaceId={_id}
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
                                workspaceId={_id}
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
    }, [type, iconFileId, colors, _id]);

    return (
        <MeltaTooltip title={displayName} placement="bottom">
            <Link
                href={!isMovedWorkspace ? `${path}${path === '/' ? '' : '/'}${name}${type}` : ' '}
                replace={Boolean(isMovedWorkspace)}
                style={{ textDecoration: 'none', ...(isMovedWorkspace ? { cursor: 'default' } : {}), zIndex: 10 }}
            >
                <Card
                    sx={{
                        position: 'relative',
                        width: '13rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.1)' },
                        ...(isMovedWorkspace ? { opacity: 0.5, backgroundColor: 'rgba(0, 0, 0, 0.1)' } : {}),
                    }}
                    className="card"
                    onClick={() => setWorkspace({ ...minimalWorkspace, metadata: { ...defaultMetadata, ...minimalWorkspace.metadata } })}
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
                        {displayName}
                    </Typography>

                    {currentUser.currentWorkspacePermissions?.admin && (
                        <ActionMenu
                            workspace={minimalWorkspace}
                            openEditWizard={() => openWizard?.(minimalWorkspace)}
                            setMovedWorkspace={setMovedWorkspace}
                            isMovedWorkspace={isMovedWorkspace ?? false}
                        />
                    )}
                </Card>
            </Link>
        </MeltaTooltip>
    );
};
