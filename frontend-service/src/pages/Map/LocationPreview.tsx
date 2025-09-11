import * as Cesium from 'cesium';
import { Cartesian3, Color } from 'cesium';
import React, { useEffect, useRef } from 'react';
import { useQueryClient } from 'react-query';
import { BillboardGraphics, Entity, PointGraphics, PolygonGraphics, PolylineGraphics, Viewer } from 'resium';
import { IMongoChildTemplatePopulated } from '../../interfaces/childTemplates';
import { IEntity } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { BackendConfigState } from '../../services/backendConfigService';
import { useEntityWithLocationFields } from '../../utils/hooks/useLocation';
import { calculateCenterOfPolygon, jerusalemCoordinates, locationToWGS84String } from '../../utils/map';
import { convertWGS94ToECEF } from '../../utils/map/convert';
import { BaseLayers } from './BaseLayers';
import { getColoredLocationIcon } from '../../utils/icons/coloredLocationIcon';
import { environment } from '../../globals';

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

type Props = {
    entityProperties: IEntity['properties'];
    entityTemplate: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated;
};

const LocationPreview = ({ entityProperties, entityTemplate }: Props) => {
    const queryClient = useQueryClient();
    const config = queryClient.getQueryData<BackendConfigState>('getBackendConfig');

    const viewerRef = useRef<any>(null);

    const { bounds, polygons, propertyDefinitions, markers } = useEntityWithLocationFields({
        entityTemplate,
        entityProperties,
    });

    useEffect(() => {
        const animateCamera = () => {
            const viewer = viewerRef.current?.cesiumElement;
            if (!viewer) return;
            const { camera } = viewer;

            if (bounds !== null) {
                const boundingSphere = new Cesium.BoundingSphere(bounds.center, bounds.radius);

                camera.flyToBoundingSphere(boundingSphere, {
                    duration: 1.5,
                    offset: new Cesium.HeadingPitchRange(0, -Cesium.Math.toRadians(90), bounds.radius * 10),
                });
            } else {
                camera.flyTo({
                    destination: jerusalemCoordinates,
                    duration: 1.5,
                });
            }
        };

        const animationFrameId = requestAnimationFrame(animateCamera);
        return () => cancelAnimationFrame(animationFrameId);
    }, [bounds]);

    return (
        <div style={{ position: 'relative', height: '800px', width: '600px' }}>
            <Viewer
                full
                ref={viewerRef}
                baseLayerPicker={false}
                animation={false}
                timeline={false}
                geocoder={false}
                homeButton={false}
                sceneModePicker={false}
                vrButton={false}
                fullscreenButton={false}
                navigationHelpButton={false}
            >
                {polygons.map(({ key, position: polygon }) => (
                    <MeltaPolygon key={key} name={propertyDefinitions[key].title} polygon={polygon} />
                ))}

                {markers.map(({ key, position }) => (
                    <MeltaCoordinate key={key} name={propertyDefinitions[key].title} position={convertWGS94ToECEF(position) as Cartesian3} />
                ))}

                <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '15px' }}>
                    {config && <BaseLayers viewerRef={viewerRef} config={config} />}
                </div>
            </Viewer>
        </div>
    );
};

export default LocationPreview;
