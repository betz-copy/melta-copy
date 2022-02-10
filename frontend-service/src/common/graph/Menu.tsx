import React from 'react';
import { Menu as MuiMenu, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { NodeObject } from 'react-force-graph-2d';

const Menu: React.FC<{
    onShowDialog: (node: NodeObject) => void;
    showMenu: boolean;
    node: NodeObject;
    onCloseMenu: () => void;
    location: { top: number; left: number };
}> = ({ onShowDialog, showMenu, node, onCloseMenu, location }) => {
    const navigate = useNavigate();

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
        </MuiMenu>
    );
};

export { Menu };
