import { environment } from '../globals';

const { canvasSettings } = environment;

export const traceRectangle = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.moveTo(x + radius, y);

    if (width < radius * 2) radius = width / 2;
    if (height < radius * 2) radius = height / 2;

    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
};

export const drawRectangle = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string, radius: number) => {
    ctx.beginPath();
    traceRectangle(ctx, x, y, width, height, radius);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();
};

export const getLineAngle = (x: number, y: number) => {
    let angle = Math.atan2(y, x);
    if (angle > Math.PI / 2) angle = -(Math.PI - angle);
    if (angle < -Math.PI / 2) angle = -(-Math.PI - angle);

    return angle;
};

export const drawText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fontSize: number, color: string) => {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px Sans-Serif`;
    ctx.fillText(text, x, y);
};

export const getRectangleDimensionsByString = (ctx: CanvasRenderingContext2D, text: string, fontSize: number) => {
    ctx.font = `${fontSize}px Sans-Serif`;
    const textWidth = ctx.measureText(text).width;

    return {
        width: textWidth + canvasSettings.widthPaddingMultiplier * fontSize,
        height: fontSize + canvasSettings.heightPaddingMultiplier * fontSize,
        originalWidth: textWidth,
        originalHeight: fontSize,
    };
};
