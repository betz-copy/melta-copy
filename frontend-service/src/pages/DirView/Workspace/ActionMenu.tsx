import { Check, DriveFileMove, Edit, FolderOff, MoreVert } from '@mui/icons-material';
import { Box, IconButton, ListItemIcon, Menu, MenuItem } from '@mui/material';
import { IWorkspace } from '@packages/workspace';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useLocation } from 'wouter';
import { ErrorToast } from '../../../common/ErrorToast';
import { updateOne } from '../../../services/workspacesService';
import { WorkspaceWizardValues, workspaceObjectToWorkspaceForm } from '../Wizard';

interface IActionMenuProps {
    workspace: IWorkspace;
    openEditWizard: () => void;
    setMovedWorkspace: (workspace: IWorkspace | null) => void;
    isMovedWorkspace: boolean;
}

export const ActionMenu: React.FC<IActionMenuProps> = ({ workspace, openEditWizard, setMovedWorkspace, isMovedWorkspace }) => {
    const [location] = useLocation();

    const queryClient = useQueryClient();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const { isLoading: isMoveWorkspaceLoading, mutateAsync: moveWorkspace } = useMutation(
        () => {
            const { _id, ...workspaceValues } = workspaceObjectToWorkspaceForm(workspace) as WorkspaceWizardValues & { _id: string };
            return updateOne(workspace._id, { ...workspaceValues, path: location });
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['getDir', location] });
                setMovedWorkspace(null);
                toast.success(i18next.t('workspaces.movedSuccessfully'));
            },
            onError: (error: AxiosError) => {
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('workspaces.failedToMove')} />);
            },
        },
    );

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        event.preventDefault();
    };

    const handleClose = () => setAnchorEl(null);

    const menuItems = isMovedWorkspace
        ? [
              <MenuItem key="approve" onClick={() => moveWorkspace()} disabled={isMoveWorkspaceLoading || workspace.path === location}>
                  <ListItemIcon>
                      <Check />
                  </ListItemIcon>
                  {i18next.t('workspaces.approveMove')}
              </MenuItem>,

              <MenuItem key="cancel" onClick={() => setMovedWorkspace(null)} disabled={isMoveWorkspaceLoading}>
                  <ListItemIcon>
                      <FolderOff />
                  </ListItemIcon>
                  {i18next.t('workspaces.cancelMove')}
              </MenuItem>,
          ]
        : [
              <MenuItem
                  key="edit"
                  onClick={() => {
                      openEditWizard();
                      handleClose();
                  }}
              >
                  <ListItemIcon>
                      <Edit />
                  </ListItemIcon>
                  {i18next.t('workspaces.edit')}
              </MenuItem>,

              <MenuItem key="move" onClick={() => setMovedWorkspace(workspace)}>
                  <ListItemIcon>
                      <DriveFileMove />
                  </ListItemIcon>
                  {i18next.t('workspaces.move')}
              </MenuItem>,
          ];

    return (
        <Box
            position="absolute"
            left="0%"
            sx={{ visibility: anchorEl || isMovedWorkspace ? 'visible !important' : '' }}
            className="actionMenu"
            onClick={(e) => e.preventDefault()}
        >
            <IconButton onClick={handleClick}>
                <MoreVert />
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                {menuItems}
            </Menu>
        </Box>
    );
};
