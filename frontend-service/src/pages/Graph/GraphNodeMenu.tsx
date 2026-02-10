import { MenuItem, Menu as MuiMenu } from '@mui/material';
import { IEntityExpanded } from '@packages/entity';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import i18next from 'i18next';
import React from 'react';
import { GraphData, NodeObject } from 'react-force-graph-2d';
import { useQuery, useQueryClient } from 'react-query';
import { useLocation } from 'wouter';
import { IGraphFilterBodyBatch } from '../../interfaces/graphFilter';
import { IChildTemplateMap } from '../../interfaces/template';
import { getExpandedEntityByIdRequest } from '../../services/entitiesService';
import { highlightNode } from '../../utils/graph';
import { useSearchParams } from '../../utils/hooks/useSearchParams';

const GraphNodeMenu: React.FC<{
    graphData: GraphData;
    filteredEntityTemplates: IMongoEntityTemplateWithConstraintsPopulated[];
    node: NodeObject;
    location: { top: number; left: number };
    onCloseMenu: () => void;
    filterRecord: IGraphFilterBodyBatch;
    onSuccessExpandGraph: (data: IEntityExpanded) => void;
}> = ({ graphData, filteredEntityTemplates, node, location, onCloseMenu, filterRecord, onSuccessExpandGraph }) => {
    const [_, navigate] = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const childTemplateId = searchParams.get('childTemplateId') ?? undefined;

    const queryClient = useQueryClient();
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildTemplates')!;

    const childEntityTemplate = [...childTemplates.values()].find(({ parentTemplate }) => parentTemplate._id === node.templateId);

    const expandedParams = JSON.parse(searchParams.get('expandedEntities')!) || {};
    const { refetch: getExpandedData } = useQuery<IEntityExpanded>(
        [
            'getExpandedEntity',
            node.id,
            {
                [node.id]: { maxLevel: node.numberOfConnectionsExpanded + 1 },
            },
            {
                disabled: false,
                templateIds: filteredEntityTemplates.map((entityTemplate) => entityTemplate._id),
                childTemplateId,
            },
            filterRecord,
        ],
        () =>
            getExpandedEntityByIdRequest(
                node.id,
                {
                    [node.id]: { maxLevel: node.numberOfConnectionsExpanded + 1 },
                },
                {
                    templateIds: filteredEntityTemplates.map((entityTemplate) => entityTemplate._id),
                    childTemplateId,
                },
                filterRecord,
            ),
        {
            enabled: false,
            onSuccess: (data) => {
                node.numberOfConnectionsExpanded++;
                onSuccessExpandGraph(data);
            },
        },
    );

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
                    onCloseMenu();

                    navigate(`/entity/${node.id}${childEntityTemplate ? `?childTemplateId=${childEntityTemplate._id}` : ''}`);
                }}
            >
                {i18next.t('graph.navigateToEntityPage')}
            </MenuItem>
            <MenuItem
                onClick={() => {
                    onCloseMenu();
                    navigate(`/entity/${node.id}/graph${childEntityTemplate ? `?childTemplateId=${childEntityTemplate._id}` : ''}`);
                }}
            >
                {i18next.t('graph.navigateToGraph')}
            </MenuItem>
            <MenuItem
                disabled={node.numberOfConnectionsExpanded >= 6}
                onClick={async () => {
                    await getExpandedData();
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
            {node.fx || node.fy || node.fz ? (
                <MenuItem
                    onClick={() => {
                        node.fx = undefined;
                        node.fy = undefined;
                        node.fz = undefined;

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
                        node.fz = node.z;

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
