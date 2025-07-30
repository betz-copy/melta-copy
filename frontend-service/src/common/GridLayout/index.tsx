import React from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './gridLayout.css';
import { Breakpoints, CompactType, LayoutItem, Layouts } from './interface';

const ResponsiveReactGridLayout = WidthProvider(Responsive);

interface GridLayoutProps {
    style: React.CSSProperties;
    rowHeight: number;
    cols: Record<Breakpoints, number>;
    layouts: Layouts;
    onLayoutChange?: (layout: LayoutItem[], allLayouts: Layouts) => void;
    handleBreakpointChange?: (breakpoint: string) => void;
    useCSSTransforms: boolean;
    compactType: CompactType;
    generateDom: () => React.ReactNode[];
    draggableHandle?: string;
}

const GridLayout: React.FC<GridLayoutProps> = ({
    style,
    rowHeight,
    cols,
    layouts,
    onLayoutChange,
    handleBreakpointChange,
    useCSSTransforms,
    compactType,
    generateDom,
    draggableHandle,
}) => {
    return (
        <ResponsiveReactGridLayout
            className="layout"
            style={style}
            rowHeight={rowHeight}
            cols={cols}
            layouts={layouts}
            onBreakpointChange={handleBreakpointChange}
            onLayoutChange={onLayoutChange}
            measureBeforeMount={false}
            useCSSTransforms={useCSSTransforms}
            compactType={compactType}
            preventCollision={!compactType}
            autoSize
            draggableHandle={draggableHandle}
            resizeHandles={['sw']}
        >
            {generateDom()}
        </ResponsiveReactGridLayout>
    );
};

export { GridLayout };
