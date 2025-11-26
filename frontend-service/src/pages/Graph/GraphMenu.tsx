/* eslint-disable no-param-reassign */

import { MenuItem, Menu as MuiMenu } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { GraphData } from 'react-force-graph-2d';

const GraphMenu: React.FC<{
    graphData: GraphData;
    location: { top: number; left: number };
    onCloseMenu: () => void;
    onCenterMain: () => void;
}> = ({ graphData, location, onCloseMenu, onCenterMain }) => {
    const areThereLockedNodes = graphData.nodes.some((node: any) => node.locked);
    const areThereHighlightedNodes = graphData.nodes.some((node: any) => node.highlighted || node.mainHighlighted);

    return (
        <MuiMenu
            open
            onClose={onCloseMenu}
            anchorReference="anchorPosition"
            anchorPosition={location}
            onContextMenu={(event) => {
                event.preventDefault();
                onCloseMenu();
            }}
        >
            <MenuItem
                onClick={() => {
                    graphData.nodes.forEach((node: any) => {
                        node.fx = undefined;
                        node.fy = undefined;
                        node.fz = undefined;
                        node.locked = false;
                    });

                    onCloseMenu();
                }}
                disabled={!areThereLockedNodes}
            >
                {i18next.t('graph.freeAll')}
            </MenuItem>
            <MenuItem
                onClick={() => {
                    graphData.nodes.forEach((node: any) => {
                        node.mainHighlighted = false;
                        node.highlighted = 0;
                    });
                    graphData.links.forEach((links: any) => {
                        links.highlighted = 0;
                    });

                    onCloseMenu();
                }}
                disabled={!areThereHighlightedNodes}
            >
                {i18next.t('graph.cancelAllHighlights')}
            </MenuItem>
            <MenuItem
                onClick={() => {
                    onCenterMain();
                    onCloseMenu();
                }}
            >
                {i18next.t('graph.center')}
            </MenuItem>
        </MuiMenu>
    );
};

export { GraphMenu };
