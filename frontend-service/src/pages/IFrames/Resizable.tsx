import React, { useCallback, useEffect, useState } from 'react';
import { Panel, PanelResizeHandle } from 'react-resizable-panels';

const ResizablePanel: React.FC<any> = ({ children, isFirst = false }) => {
    // const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // const handleResize = useCallback(({ event, direction, element, delta, panel }) => {
    //     setDimensions({
    //         width: element.offsetWidth,
    //         height: element.offsetHeight,
    //     });
    // }, []);
    return (
        <>
            <Panel
                className="bg-slate-100 rounded-lg flex items-center justify-center text-center p-2"
                style={{ padding: '10px', minWidth: '400px' }}
                // onResize={handleResize}
            >
                {children}
            </Panel>
            {isFirst && <PanelResizeHandle className="mx-1 w-2 h-2 bg-sl    ate-300" />}
        </>
    );
};

export default ResizablePanel;
