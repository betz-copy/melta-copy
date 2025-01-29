import React, { useEffect, useRef } from 'react';
import { Cartesian3, Color, Ion } from 'cesium';
import { Viewer, Entity, PolygonGraphics, PointGraphics, PolylineGraphics, BillboardGraphics } from 'resium';
import * as Cesium from 'cesium';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IEntity } from '../../../../interfaces/entities';
import { cartesian3ToString, jerusalemCoordinates } from '../../../../utils/map';
import { useEntityWithLocationFields } from '../../../../utils/hooks/useLocation';

type Props = {
    entity: IEntity;
    entityTemplate: IMongoEntityTemplatePopulated;
};

const LocationPreview = ({ entity, entityTemplate }: Props) => {
    Ion.defaultAccessToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjZWI5M2EyNC1lODE3LTQwYTQtYTUxZi00NDlhODAyZDM0NTMiLCJpZCI6MjcwNDM5LCJpYXQiOjE3Mzc0NDk3MzN9.WLi4Zcm4D_PMstHcM3YNMJsw1xPhiNGuJyizwg_4nbg';

    const viewerRef = useRef<any>(null);

    const { bounds, polygons, propertyDefinitions, markers } = useEntityWithLocationFields({
        entityTemplate,
        entity,
    });

    useEffect(() => {
        setTimeout(() => {
            const viewer = viewerRef.current?.cesiumElement;

            if (!viewer) return;
            const { camera } = viewer;

            if (bounds !== null) {
                const boundingSphere = new Cesium.BoundingSphere(bounds.center, bounds.radius);

                camera.flyToBoundingSphere(boundingSphere, {
                    duration: 1.5,
                    offset: new Cesium.HeadingPitchRange(0, -Cesium.Math.toRadians(90), bounds.radius * 50),
                });
            } else {
                camera.flyTo({
                    destination: jerusalemCoordinates,
                    duration: 1.5,
                });
            }
        }, 1);
    }, [bounds]);

    return (
        <div style={{ position: 'relative', height: '800px', width: '600px' }}>
            <Viewer full ref={viewerRef} id="cesiumContainer">
                {polygons.map(({ key, position: polygon }) => (
                    <Entity key={key} name={propertyDefinitions[key].title} description={cartesian3ToString(polygon)}>
                        <PolylineGraphics positions={[...polygon, polygon[0]]} material={Color.fromCssColorString('#11695a')} width={3} />
                        <PolygonGraphics hierarchy={polygon} material={Color.fromAlpha(Color.GRAY, 0.3)} />
                        {polygon.map((position) => (
                            <Entity key={`${position.x}, ${position.y}`} position={position}>
                                <PointGraphics
                                    color={Color.BLACK}
                                    outlineColor={Color.fromCssColorString('#11695a')}
                                    pixelSize={10}
                                    outlineWidth={2}
                                />
                            </Entity>
                        ))}
                    </Entity>
                ))}

                {markers.map(({ key, position }) => (
                    <Entity
                        key={key}
                        name={propertyDefinitions[key].title}
                        description={cartesian3ToString(position)}
                        position={Cartesian3.fromDegrees(position.x, position.y, 0)}
                    >
                        <BillboardGraphics image="/public/icons/location.svg" scale={1} verticalOrigin={Cesium.VerticalOrigin.BOTTOM} />
                    </Entity>
                ))}
            </Viewer>
        </div>
    );
};

export default LocationPreview;
