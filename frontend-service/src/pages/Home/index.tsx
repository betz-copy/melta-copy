import React, { Reducer, useCallback, useReducer, useRef, useState } from 'react';
import { Dialog, DialogTitle, Menu, MenuItem, Typography } from '@mui/material';
import ForceGraph2D, { ForceGraphMethods, NodeObject } from 'react-force-graph-2d';
import { SizeMe } from 'react-sizeme';

const data = {
    nodes: [
        { id: 'A', data: { name: 'A bla bla', age: 564 } },
        { id: 'B', data: { name: 'B bla bla', age: 564 } },
        { id: 'C', data: { name: 'C bla bla', age: 564 } },
        { id: 'D', data: { name: 'D bla bla', age: 564 } },
        { id: 'E', data: { name: 'E bla bla', age: 564 } },
        { id: 'F', data: { name: 'F bla bla', age: 564 } },
        { id: 'G', data: { name: 'G bla bla', age: 564 } },
        { id: 'H', data: { name: 'H bla bla', age: 564 } },
        { id: 'I', data: { name: 'I bla bla', age: 564 } },
    ],
    links: [
        { source: 'B', target: 'C', value: 6 },
        { source: 'D', target: 'A', value: 6 },
        { source: 'B', target: 'A', value: 6 },
        { source: 'B', target: 'D', value: 6 },
        { source: 'C', target: 'A', value: 6 },
        { source: 'E', target: 'H', value: 6 },
        { source: 'E', target: 'G', value: 6 },
        { source: 'B', target: 'G', value: 6 },
    ],
};

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

const nodeDialogReducer: Reducer<{ showDialog: boolean; data?: any }, { type: 'show'; data: any } | { type: 'hide' }> = (_state, action) => {
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

const Home = () => {
    const forceRef = useRef<ForceGraphMethods | undefined>(undefined);
    const [nodeMenuState, dispatchNodeMenu] = useReducer(menuContextReducer, { showMenu: false });
    const [nodeDailogState, dispatchNodeDialog] = useReducer(nodeDialogReducer, { showDialog: false });
    const [shouldZoomToFit, setShouldZoomToFit] = useState(true);
    const [graphData, setGraphData] = useState(data);

    const centerNode = useCallback(
        (node: NodeObject) => {
            forceRef.current?.centerAt(node.x, node.y, transtionTime);

            forceRef.current?.zoom(5, transtionTime);
        },
        [forceRef],
    );

    return (
        <SizeMe>
            {({ size }) => {
                return (
                    <>
                        <ForceGraph2D
                            graphData={graphData}
                            linkDirectionalArrowLength={3.5}
                            linkDirectionalArrowRelPos={1}
                            linkCurvature="curvature"
                            enablePointerInteraction
                            linkDirectionalParticleWidth={1}
                            height={800}
                            width={size.width!}
                            ref={forceRef}
                            nodeLabel={(node) => `<div style><b>${node.id}</b>: <span>${node.id}</span></div>`}
                            onNodeRightClick={(node, event) => {
                                dispatchNodeMenu({ type: 'show', top: event.clientY, left: event.clientX, node });
                            }}
                            onBackgroundClick={() => dispatchNodeMenu({ type: 'hide' })}
                            onBackgroundRightClick={() => {
                                dispatchNodeMenu({ type: 'hide' });
                                setGraphData((prevGraphData) => {
                                    return {
                                        nodes: [...prevGraphData.nodes, { id: 'Z', data: { name: 'Z bla bla', age: 564 } }],
                                        links: [...prevGraphData.links],
                                    };
                                });
                            }}
                            cooldownTime={2000}
                            onEngineStop={() => {
                                if (shouldZoomToFit) {
                                    forceRef.current?.zoomToFit(transtionTime, 200);
                                    setShouldZoomToFit(false);
                                }
                            }}
                            onNodeClick={(node) => dispatchNodeDialog({ type: 'show', data: (node as NodeObject & { data: any })?.data })}
                        />
                        <Menu
                            open={nodeMenuState.showMenu}
                            onClose={() => dispatchNodeMenu({ type: 'hide' })}
                            anchorReference="anchorPosition"
                            anchorPosition={nodeMenuState.showMenu ? { top: nodeMenuState.top!, left: nodeMenuState.left! } : undefined}
                            onContextMenu={(event) => {
                                event.preventDefault();
                                dispatchNodeMenu({ type: 'hide' });
                            }}
                        >
                            <MenuItem
                                onClick={() => {
                                    centerNode(nodeMenuState.node!);
                                    dispatchNodeMenu({ type: 'hide' });
                                }}
                            >
                                Center
                            </MenuItem>
                            <MenuItem
                                onClick={() => {
                                    dispatchNodeMenu({ type: 'hide' });
                                    dispatchNodeDialog({ type: 'show', data: (nodeMenuState.node as NodeObject & { data: any })?.data });
                                }}
                            >
                                Edit
                            </MenuItem>
                        </Menu>
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

export { Home };
