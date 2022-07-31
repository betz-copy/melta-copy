/* eslint-disable no-param-reassign */
import React from 'react';
import { Menu as MuiMenu, MenuItem } from '@mui/material';
import { GraphData } from 'react-force-graph-2d';
import i18next from 'i18next';

const GraphMenu: React.FC<{
    showMenu: boolean;
    onCloseMenu: () => void;
    location: { top: number; left: number };
    graphData: GraphData;
}> = ({ showMenu, onCloseMenu, location, graphData }) => {
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
                    graphData.nodes.forEach((node) => {
                        node.fx = undefined;
                        node.fy = undefined;
                        node.locked = false;
                    });

                    onCloseMenu();
                }}
            >
                {i18next.t('graph.freeAll')}
            </MenuItem>
            <MenuItem
                onClick={() => {
                    graphData.nodes.forEach((node) => {
                        node.mainHighlighted = false;
                        node.highlighted = 0;
                    });
                    graphData.links.forEach((links) => {
                        links.highlighted = 0;
                    });

                    onCloseMenu();
                }}
            >
                {i18next.t('graph.cancelAllHighlights')}
            </MenuItem>
        </MuiMenu>
    );
};

export { GraphMenu };
