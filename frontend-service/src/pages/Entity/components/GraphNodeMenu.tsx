/* eslint-disable no-param-reassign */
import React from 'react';
import { Menu as MuiMenu, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { GraphData, NodeObject } from 'react-force-graph-2d';
import { useQuery, useQueryClient } from 'react-query';
import i18next from 'i18next';
import { IEntityExpanded } from '../../../interfaces/entities';
import { getExpandedEntityByIdRequest } from '../../../services/entitiesService';
import { expandedEntityToGraphData } from '../../../utils/graph';
import { IMongoRelationshipTemplate } from '../../../interfaces/relationshipTemplates';

const GraphNodeMenu: React.FC<{
    showMenu: boolean;
    node: NodeObject;
    onCloseMenu: () => void;
    location: { top: number; left: number };
    addNewGraphData: (graphData: GraphData) => void;
    graphData: GraphData;
}> = ({ showMenu, node, onCloseMenu, location, addNewGraphData, graphData }) => {
    const navigate = useNavigate();

    const queryClient = useQueryClient();
    const relationshipTemplates = queryClient.getQueryData<IMongoRelationshipTemplate[]>('getRelationshipTemplates');

    const { refetch: getExpandedData } = useQuery<IEntityExpanded>(
        ['getExpandedEntity', node.id, false],
        () => getExpandedEntityByIdRequest(node.id, { disabled: false }),
        {
            enabled: false,
            onSuccess: (data) => {
                const newGraphData = expandedEntityToGraphData(data, relationshipTemplates!);
                addNewGraphData(newGraphData);
            },
        },
    );

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
                    onCloseMenu();
                    navigate(`/entity/${node.id}/graph`);
                }}
            >
                {i18next.t('graph.center')}
            </MenuItem>
            <MenuItem
                onClick={async () => {
                    await getExpandedData();
                    onCloseMenu();
                }}
            >
                {i18next.t('graph.expand')}
            </MenuItem>
            {node.fx || node.fy ? (
                <MenuItem
                    onClick={() => {
                        node.fx = undefined;
                        node.fy = undefined;

                        node.locked = false;
                        onCloseMenu();
                    }}
                >
                    {i18next.t('graph.free')}
                </MenuItem>
            ) : (
                <MenuItem
                    onClick={() => {
                        node.fx = node.x;
                        node.fy = node.y;

                        node.locked = true;
                        onCloseMenu();
                    }}
                >
                    {i18next.t('graph.lock')}
                </MenuItem>
            )}
            <MenuItem
                onClick={() => {
                    node.mainHighlighted = !node.mainHighlighted;
                    const count = node.mainHighlighted ? 1 : -1;

                    graphData.links.forEach((link) => {
                        if (link.target === node) {
                            (link.source as NodeObject).highlighted += count;
                            link.highlighted += count;
                        }
                        if (link.source === node) {
                            (link.target as NodeObject).highlighted += count;
                            link.highlighted += count;
                        }
                    });

                    onCloseMenu();
                }}
            >
                {node.mainHighlighted ? i18next.t('graph.cancelHighlight') : i18next.t('graph.highlight')}
            </MenuItem>
        </MuiMenu>
    );
};

export { GraphNodeMenu };
