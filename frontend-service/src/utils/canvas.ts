/* eslint-disable no-param-reassign */
export const drawRectangle = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
};

export const getLineAngle = (x: number, y: number) => {
    let angle = Math.atan2(y, x);
    if (angle > Math.PI / 2) angle = -(Math.PI - angle);
    if (angle < -Math.PI / 2) angle = -(-Math.PI - angle);

    return angle;
};

export const drawText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) => {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
};

export const getRectangleDimensionsByString = (ctx: CanvasRenderingContext2D, text: string, nodeSize: number = 2) => {
    const fontSize = nodeSize;

    ctx.font = `${fontSize}px Sans-Serif`;
    const textWidth = ctx.measureText(text).width;
    return [textWidth, fontSize].map((n) => n + fontSize * 0.2);
};
