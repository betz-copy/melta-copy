import React from 'react';
import { Panel, PanelResizeHandle } from 'react-resizable-panels';

const ResizablePanel: React.FC<any> = ({ children, isFirst = false }) => {
    return (
        <>
            <Panel
                className="bg-slate-100 rounded-lg flex items-center justify-center text-center p-2"
                style={{ padding: '10px', minHeight: '50px', minWidth: '50px' }}
            >
                {children}
            </Panel>
            {isFirst && <PanelResizeHandle className="mx-1 w-2 h-2 bg-slate-300" />}
        </>
    );
};

export default ResizablePanel;
