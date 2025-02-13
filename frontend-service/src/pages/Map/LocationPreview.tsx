import React, { useEffect, useRef } from 'react';
import { Cartesian3, Color } from 'cesium';
import { Viewer, Entity, PolygonGraphics, PointGraphics, PolylineGraphics, BillboardGraphics } from 'resium';
import * as Cesium from 'cesium';
import { IEntity } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { useEntityWithLocationFields } from '../../utils/hooks/useLocation';
import { cartesian3ToString, jerusalemCoordinates } from '../../utils/map';
import { BaseLayers } from './BaseLayers';

export const MeltaPolygon = ({ name, polygon, onClick }: { name: string; polygon: Cartesian3[]; onClick?: () => void }) => (
    <Entity name={name} description={cartesian3ToString(polygon)} onClick={onClick}>
        <PolylineGraphics positions={[...polygon, polygon[0]]} material={Color.fromCssColorString('#11695a')} width={3} />
        <PolygonGraphics hierarchy={polygon} material={Color.fromAlpha(Color.GRAY, 0.3)} />
        {polygon.map((position) => (
            <Entity key={`${position.x}, ${position.y}`} position={position}>
                <PointGraphics color={Color.BLACK} outlineColor={Color.fromCssColorString('#11695a')} pixelSize={10} outlineWidth={2} />
            </Entity>
        ))}
    </Entity>
);

export const MeltaCoordinate = ({ name, position, onClick }: { name: string; position: Cartesian3; onClick?: () => void }) => (
    <Entity name={name} description={cartesian3ToString(position)} position={position} onClick={onClick}>
        <BillboardGraphics image="/icons/location.svg" scale={1} verticalOrigin={Cesium.VerticalOrigin.BOTTOM} />
    </Entity>
);

type Props = {
    entity: IEntity;
    entityTemplate: IMongoEntityTemplatePopulated;
};

const LocationPreview = ({ entity, entityTemplate }: Props) => {
    const viewerRef = useRef<any>(null);

    const { bounds, polygons, propertyDefinitions, markers } = useEntityWithLocationFields({
        entityTemplate,
        entity,
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
              >                
              {polygons.map(({ key, position: polygon }) => (
                    <MeltaPolygon key={key} name={propertyDefinitions[key].title} polygon={polygon} />
                ))}

                {markers.map(({ key, position }) => (
                    <MeltaCoordinate key={key} name={propertyDefinitions[key].title} position={Cartesian3.fromDegrees(position.x, position.y, 0)} />
                ))}

                <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '15px' }}>
                    <BaseLayers viewerRef={viewerRef} />
                </div>
            </Viewer>
        </div>
    );
};

export default LocationPreview;
