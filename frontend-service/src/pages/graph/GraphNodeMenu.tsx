/* eslint-disable no-param-reassign */
import React from 'react';
import { Menu as MuiMenu, MenuItem } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GraphData, NodeObject } from 'react-force-graph-2d';
import { useQuery, useQueryClient } from 'react-query';
import i18next from 'i18next';
import { IMongoRelationshipTemplate } from '../../interfaces/relationshipTemplates';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IEntityExpanded } from '../../interfaces/entities';
import { getExpandedEntityByIdRequest } from '../../services/entitiesService';
import { expandedEntityToGraphData, highlightNode } from '../../utils/graph';

const GraphNodeMenu: React.FC<{
    showMenu: boolean;
    node: NodeObject;
    onCloseMenu: () => void;
    location: { top: number; left: number };
    addNewGraphData: (graphData: GraphData) => void;
    graphData: GraphData;
}> = ({ showMenu, node, onCloseMenu, location, addNewGraphData, graphData }) => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const queryClient = useQueryClient();
    const relationshipTemplates = queryClient.getQueryData<IMongoRelationshipTemplate[]>('getRelationshipTemplates');
    const templateIds = queryClient.getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!.map((entityTemplate) => entityTemplate._id);

    const { refetch: getExpandedData } = useQuery<IEntityExpanded>(
        ['getExpandedEntity', node.id, { disabled: false, templateIds, numberOfConnections: node.numberOfConnectionsExpanded + 1 }],
        () => getExpandedEntityByIdRequest(node.id, { disabled: false, templateIds, numberOfConnections: node.numberOfConnectionsExpanded + 1 }),
        {
            enabled: false,
            onSuccess: (data) => {
                const newGraphData = expandedEntityToGraphData(data, relationshipTemplates!);
                node.numberOfConnectionsExpanded++;

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
                disabled={node.numberOfConnectionsExpanded >= 6}
                onClick={async () => {
                    await getExpandedData();
                    const expandedParams = JSON.parse(searchParams.get('expandedEntities')!);

                    const updatedExpandedEntities = {
                        ...expandedParams,
                        [node.id]: node.numberOfConnectionsExpanded,
                    };

                    setSearchParams({ expandedEntities: JSON.stringify(updatedExpandedEntities) });
                    onCloseMenu();
                }}
            >
                {i18next.t('graph.expand')} {node.numberOfConnectionsExpanded !== 0 && `(x${node.numberOfConnectionsExpanded})`}
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
                    highlightNode(node, graphData, !node.mainHighlighted);

                    onCloseMenu();
                }}
            >
                {node.mainHighlighted ? i18next.t('graph.cancelHighlight') : i18next.t('graph.highlight')}
            </MenuItem>
        </MuiMenu>
    );
};

export { GraphNodeMenu };
