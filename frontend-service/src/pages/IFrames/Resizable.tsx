import React from 'react';
import { Panel, PanelResizeHandle } from 'react-resizable-panels';

const ResizablePanel: React.FC<any> = ({ children }) => {
    return (
        <>
            <Panel
                className="bg-slate-100 rounded-lg flex items-center justify-center text-center p-2"
                style={{ padding: '10px' }}
                // defaultSize={33}
                // minSize={20}
            >
                {children}
            </Panel>
            <PanelResizeHandle className="mx-1 w-2 h-2 bg-slate-300" />
        </>
    );
};

export default ResizablePanel;
