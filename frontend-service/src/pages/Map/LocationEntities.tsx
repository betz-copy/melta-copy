import * as Cesium from 'cesium';
import { Cartesian3, Color } from 'cesium';
import React from 'react';
import { BillboardGraphics, Entity, PointGraphics, PolygonGraphics, PolylineGraphics } from 'resium';
import { environment } from '../../globals';
import { getColoredLocationIcon } from '../../utils/icons/coloredLocationIcon';
import { calculateCenterOfPolygon, locationToWGS84String } from '../../utils/map';

export const MeltaPolygon = ({
    name,
    polygon,
    onClick,
    color = environment.map.polygonDefaultColor,
    outlineColor = Color.WHITE,
    fill = true,
    showCenteredPoint = true,
}: {
    name: string;
    polygon: Cartesian3[];
    onClick?: () => void;
    color?: string;
    fill?: boolean;
    outlineColor?: Cesium.Color;
    showCenteredPoint?: boolean;
}) => {
    const centroid = calculateCenterOfPolygon(polygon);

    return (
        <>
            <Entity name={name}>
                <PolylineGraphics positions={[...polygon, polygon[0]]} material={outlineColor} width={2} />
                <PolygonGraphics
                    hierarchy={polygon}
                    fill={fill}
                    material={fill ? Color.fromAlpha(Color.fromCssColorString(color), 0.3) : undefined}
                />
                {polygon.map((position, index) => (
                    <Entity key={`${position.x}, ${position.y} - ${index}`} position={position}>
                        <PointGraphics color={Color.WHITE} outlineColor={outlineColor} pixelSize={2} outlineWidth={2} />
                    </Entity>
                ))}
            </Entity>

            {showCenteredPoint && (
                <Entity name={name} description={locationToWGS84String(polygon)} position={centroid} onClick={onClick}>
                    <PointGraphics color={Color.fromCssColorString(color)} outlineColor={outlineColor} pixelSize={12} outlineWidth={2} />
                </Entity>
            )}
        </>
    );
};

export const MeltaCoordinate = ({ name, position, onClick, color }: { name: string; position: Cartesian3; onClick?: () => void; color?: string }) => (
    <Entity name={name} description={locationToWGS84String(position)} position={position} onClick={onClick}>
        <BillboardGraphics image={getColoredLocationIcon(color)} scale={1} verticalOrigin={Cesium.VerticalOrigin.BOTTOM} />
    </Entity>
);
