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
}

export const Workspace: React.FC<IWorkspaceProps> = ({ workspace: { name, path, type, colors, iconFileId, logoFileId, _id }, mode, openWizard }) => {
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

    return (
        <MeltaTooltip title={name} placement="bottom">
            <Link
                href={mode === Mode.edit ? '' : `${path}${path === '/' ? '' : '/'}${name}${type}`}
                replace={mode === Mode.edit}
                style={{
                    textDecoration: 'none',
                    ...(mode === Mode.edit ? { cursor: 'url(/icons/edit-icon.svg), pointer' } : {}),
                }}
            >
                <Card
                    sx={{
                        width: '13rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.1)' },
                    }}
                    onClick={() => {
                        if (mode === Mode.edit) openWizard({ name, path, type, colors, iconFileId, logoFileId, _id });
                        else setWorkspace({ name, path, type, colors, iconFileId, logoFileId, _id });
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
