import React, { useEffect, useRef } from 'react';
import { Cartesian3, Color } from 'cesium';
import { Viewer, Entity, PolygonGraphics, PointGraphics, PolylineGraphics, BillboardGraphics } from 'resium';
import * as Cesium from 'cesium';
import { useQueryClient } from 'react-query';
import { IEntity } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { useEntityWithLocationFields } from '../../utils/hooks/useLocation';
import { locationToWGS84String, jerusalemCoordinates } from '../../utils/map';
import { BaseLayers } from './BaseLayers';
import { BackendConfigState } from '../../services/backendConfigService';
import { convertWGS94ToECEF } from '../../utils/map/convert';
import { IMongoChildTemplatePopulated } from '../../interfaces/childTemplates';

export const MeltaPolygon = ({ name, polygon, onClick }: { name: string; polygon: Cartesian3[]; onClick?: () => void }) => (
    <Entity name={name} description={locationToWGS84String(polygon)} onClick={onClick}>
        <PolylineGraphics positions={[...polygon, polygon[0]]} material={Color.fromCssColorString('#11695a')} width={3} />
        <PolygonGraphics hierarchy={polygon} material={Color.fromAlpha(Color.GRAY, 0.3)} />
        {polygon.map((position, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <Entity key={`${position.x}, ${position.y} - ${index}`} position={position}>
                <PointGraphics color={Color.BLACK} outlineColor={Color.fromCssColorString('#11695a')} pixelSize={10} outlineWidth={2} />
            </Entity>
        ))}
    </Entity>
);

export const MeltaCoordinate = ({ name, position, onClick }: { name: string; position: Cartesian3; onClick?: () => void }) => (
    <Entity name={name} description={locationToWGS84String(position)} position={position} onClick={onClick}>
        <BillboardGraphics image="/icons/location.svg" scale={1} verticalOrigin={Cesium.VerticalOrigin.BOTTOM} />
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
