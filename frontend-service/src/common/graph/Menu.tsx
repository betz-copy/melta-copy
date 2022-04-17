import React, { useState } from 'react';
import { Menu as MuiMenu, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { NodeObject } from 'react-force-graph-2d';
import { useMutation } from 'react-query';
import { deleteEntityRequest } from '../../services/entitiesService';
import { AreYouSureDialog } from '../dialogs/AreYouSureDialog';

const Menu: React.FC<{
    onShowDialog: (node: NodeObject) => void;
    showMenu: boolean;
    node: NodeObject;
    onCloseMenu: () => void;
    location: { top: number; left: number };
}> = ({ onShowDialog, showMenu, node, onCloseMenu, location }) => {
    const { isLoading, mutateAsync } = useMutation((entityId: string) => deleteEntityRequest(entityId));
    const navigate = useNavigate();

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    const closeDeleteDialog = () => {
        setOpenDeleteDialog(false);
    };

    return (
        <MuiMenu
            open={showMenu}
            onClose={onCloseMenu}
            anchorReference="anchorPosition"
            anchorPosition={showMenu ? location : undefined}
            onContextMenu={(event) => {
                event.preventDefault();
                onCloseMenu();
            }}
        >
            <MenuItem
                onClick={() => {
                    navigate(`/graph/${node.id}`);
                }}
            >
                Center
            </MenuItem>
            <MenuItem
                onClick={() => {
                    onCloseMenu();
                    onShowDialog(node);
                }}
            >
                Edit
            </MenuItem>
            <MenuItem
                onClick={() => {
                    setOpenDeleteDialog(true);
                }}
            >
                Delete
            </MenuItem>
            <AreYouSureDialog
                open={openDeleteDialog}
                handleClose={closeDeleteDialog}
                onYes={async () => {
                    await mutateAsync(String(node.id));
                    closeDeleteDialog();
                    onCloseMenu();
                }}
                isLoading={isLoading}
            />
        </MuiMenu>
    );
};

export { Menu };
