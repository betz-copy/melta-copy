import { Folder, Work } from '@mui/icons-material';
import { Card, Typography } from '@mui/material';
import React, { useMemo } from 'react';
import { Link } from 'wouter';
import { Mode } from '..';
import { MeltaTooltip } from '../../../common/MeltaTooltip';
import { IWorkspace, WorkspaceTypes } from '../../../interfaces/workspaces';
import { WorkspaceWizardValues } from '../Wizard';

interface IWorkspaceProps {
    workspace: IWorkspace;
    mode: Mode;
    openWizard: (workspace: WorkspaceWizardValues) => void;
}

export const Workspace: React.FC<IWorkspaceProps> = ({ workspace: { name, path, type, colors, _id }, mode, openWizard }) => {
    const workspaceIcon = useMemo(() => {
        switch (type) {
            case WorkspaceTypes.mlt:
                return Work;
            case WorkspaceTypes.dir:
            default:
                return Folder;
        }
    }, [type]);

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
                        if (mode === Mode.edit) openWizard({ name, type, colors, _id });
                    }}
                >
                    {React.createElement(workspaceIcon, { sx: { fontSize: '9rem', stroke: colors.primary, strokeWidth: '0.03rem' } })}

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
