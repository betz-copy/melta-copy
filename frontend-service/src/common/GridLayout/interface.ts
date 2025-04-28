export type Breakpoints = 'lg' | 'md' | 'sm' | 'xs' | 'xxs';

type Directions = 's' | 'w' | 'e' | 'n' | 'sw' | 'nw' | 'se' | 'ne';

export type CompactType = 'horizontal' | 'vertical' | null;

export interface LayoutItem {
    i: string;

    x: number;
    y: number;
    w: number;
    h: number;

    minW?: number;
    maxW?: number;
    minH?: number;
    maxH?: number;

    static?: boolean;
    isDraggable?: boolean;
    isResizable?: boolean;
    resizeHandles?: Array<Directions>;
    isBounded?: boolean;
}

export type Layouts = Record<Breakpoints, LayoutItem[]>;
