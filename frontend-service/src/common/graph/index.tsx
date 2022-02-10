import React, { Reducer, useReducer, useRef, useState } from 'react';
import { Dialog, DialogTitle, Typography } from '@mui/material';
import ForceGraph, { ForceGraphMethods, NodeObject } from 'react-force-graph-2d';
import { forceManyBody } from 'd3-force';
import { SizeMe } from 'react-sizeme';
import { useSelector } from 'react-redux';
import { Menu } from './Menu';
import { RootState } from '../../store';

const menuContextReducer: Reducer<
    { showMenu: boolean; top?: number; left?: number; node?: NodeObject },
    { type: 'show'; top: number; left: number; node: NodeObject } | { type: 'hide' }
> = (_state, action) => {
    switch (action.type) {
        case 'show':
            return { showMenu: true, top: action.top, left: action.left, node: action.node };
        case 'hide':
            return { showMenu: false, top: undefined, left: undefined, node: undefined };
        default:
            throw new Error('Unknown action type');
    }
};

const nodeDialogReducer: Reducer<
    { showDialog: boolean; data?: NodeObject['data'] },
    { type: 'show'; data: NodeObject['data'] } | { type: 'hide' }
> = (_state, action) => {
    switch (action.type) {
        case 'show':
            return { showDialog: true, data: action.data };
        case 'hide':
            return { showDialog: false, data: undefined };
        default:
            throw new Error('Unknown action type');
    }
};

const transtionTime = 1000;

const Graph: React.FC<{ data: { nodes: any[]; links: any[] }; centerOn?: number }> = ({ data, centerOn }) => {
    const { entityTemplates } = useSelector((state: RootState) => state.globalState);
    const forceRef = useRef<ForceGraphMethods | undefined>(undefined);
    const [nodeMenuState, dispatchNodeMenu] = useReducer(menuContextReducer, { showMenu: false });
    const [nodeDailogState, dispatchNodeDialog] = useReducer(nodeDialogReducer, { showDialog: false });
    const [shouldZoomToFit, setShouldZoomToFit] = useState(true);

    // manage forces in graph
    forceRef.current?.d3Force(
        'charge',
        // @ts-ignore
        forceManyBody()
            .strength(data.nodes.length > 30 ? -20 : -30)
            .distanceMax(100),
    );

    if (centerOn) {
        const nodeToCenter = data.nodes.find((item) => item.id === centerOn);

        if (nodeToCenter) {
            forceRef.current?.centerAt(nodeToCenter.x, nodeToCenter.y, transtionTime);
        }
    }

    const onShowDialog = (node: NodeObject) => {
        dispatchNodeDialog({ type: 'show', data: node.data });
    };

    const renderTooltip = (node: NodeObject) => {
        const templateDisplayName = entityTemplates.find((entityTemplate) => entityTemplate._id === node.data.templateId)!.displayName;
        return `<div style><b>${templateDisplayName}</b>: <span>מזהה - ${node.id}</span></div>`;
    };

    return (
        <SizeMe>
            {({ size }) => {
                return (
                    <>
                        <ForceGraph
                            height={800}
                            ref={forceRef}
                            graphData={data}
                            width={size.width!}
                            cooldownTime={2000}
                            nodeLabel={renderTooltip}
                            linkDirectionalArrowRelPos={1}
                            linkDirectionalArrowLength={3}
                            nodeAutoColorBy={(node) => node.data.templateId}
                            onNodeClick={(node) => dispatchNodeDialog({ type: 'show', data: node.data })}
                            onNodeRightClick={(node, event) => {
                                dispatchNodeMenu({ type: 'show', top: event.clientY, left: event.clientX, node });
                            }}
                            onEngineStop={() => {
                                if (shouldZoomToFit) {
                                    forceRef.current?.zoomToFit(transtionTime, 20);
                                    setShouldZoomToFit(false);
                                }
                            }}
                        />
                        <Menu
                            node={nodeMenuState.node!}
                            onShowDialog={onShowDialog}
                            showMenu={nodeMenuState.showMenu}
                            onCloseMenu={() => dispatchNodeMenu({ type: 'hide' })}
                            location={{ top: nodeMenuState.top!, left: nodeMenuState.left! }}
                        />
                        <Dialog onClose={() => dispatchNodeDialog({ type: 'hide' })} open={nodeDailogState.showDialog}>
                            <DialogTitle>Set backup account</DialogTitle>
                            <Typography>{JSON.stringify(nodeDailogState.data)}</Typography>
                        </Dialog>
                    </>
                );
            }}
        </SizeMe>
    );
};

export { Graph };
