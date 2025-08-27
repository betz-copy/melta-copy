import React, { useEffect, useRef } from 'react';
import { Cartesian3, Color } from 'cesium';
import { Viewer, Entity, PolygonGraphics, PointGraphics, PolylineGraphics, BillboardGraphics } from 'resium';
import * as Cesium from 'cesium';
import { useQueryClient } from 'react-query';
import { IEntity } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { useEntityWithLocationFields } from '../../utils/hooks/useLocation';
import { locationToWGS84String, jerusalemCoordinates, calculateCenterOfPolygon } from '../../utils/map';
import { BaseLayers } from './BaseLayers';
import { BackendConfigState } from '../../services/backendConfigService';
import { convertWGS94ToECEF } from '../../utils/map/convert';
import { IMongoChildTemplatePopulated } from '../../interfaces/childTemplates';

export const MeltaPolygon = ({ name, polygon, onClick, color }: { name: string; polygon: Cartesian3[]; onClick?: () => void; color?: string }) => {
    const centroid = calculateCenterOfPolygon(polygon);

    return (
        <>
            <Entity name={name} description={locationToWGS84String(polygon)}>
                <PolylineGraphics positions={[...polygon, polygon[0]]} material={Color.fromCssColorString('#ffffffff')} width={2} />
                <PolygonGraphics hierarchy={polygon} material={Color.fromAlpha(Color.fromCssColorString(color ?? '#11695a'), 0.3)} />
                {polygon.map((position, index) => (
                    <Entity key={`${position.x}, ${position.y} - ${index}`} position={position}>
                        <PointGraphics color={Color.WHITE} outlineColor={Color.fromCssColorString('#ffffffff')} pixelSize={2} outlineWidth={2} />
                    </Entity>
                ))}
            </Entity>

            <Entity position={centroid} onClick={onClick}>
                <PointGraphics color={Color.fromCssColorString(color ?? '#11695a')} outlineColor={Color.WHITE} pixelSize={12} outlineWidth={2} />
            </Entity>
        </>
    );
};

const getColoredLocationIcon = (hex: string) => {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"
         viewBox="-12.8 -12.8 89.60 89.60" fill="${hex}" stroke="${hex}">
      <path d="M32,0C18.746,0,8,10.746,8,24c0,5.219,1.711,10.008,4.555,13.93
               l16,24C29.414,63.332,30.664,64,32,64s2.586-0.668,3.328-1.781l16-24
               C54.289,34.008,56,29.219,56,24C56,10.746,45.254,0,32,0z
               M32,32c-4.418,0-8-3.582-8-8s3.582-8,8-8s8,3.582,8,8S36.418,32,32,32z"/>
    </svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const MeltaCoordinate = ({ name, position, onClick, color }: { name: string; position: Cartesian3; onClick?: () => void; color?: string }) => (
    <Entity name={name} description={locationToWGS84String(position)} position={position} onClick={onClick}>
        <BillboardGraphics image={getColoredLocationIcon(color ?? '#FF006B')} scale={1} verticalOrigin={Cesium.VerticalOrigin.BOTTOM} />
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
