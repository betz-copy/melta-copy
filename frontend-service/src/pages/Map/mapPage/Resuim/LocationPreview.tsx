import React, { useRef } from 'react';
import { Cartesian3, Color, Ion } from 'cesium';
import { Viewer, Entity, PolygonGraphics, PointGraphics, CameraFlyTo } from 'resium';
import i18next from 'i18next';
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

    return (
        <div style={{ position: 'relative', height: '800px', width: '600px' }}>
            <Viewer full ref={viewerRef} id="cesiumContainer">
                <CameraFlyTo duration={0} destination={bounds !== null ? ({ ...bounds?.center } as Cartesian3) : jerusalemCoordinates} />
                {polygons.map(({ key, position: polygon }) => (
                    <Entity key={key} name={propertyDefinitions[key].title} description={`${i18next.t('location.polygon')}: ${polygon}`}>
                        <PolygonGraphics
                            hierarchy={polygon.map((position) => Cartesian3.fromDegrees(position.x, position.y, position.x))}
                            material={Color.fromAlpha(Color.BLUE, 0.5)}
                        />
                    </Entity>
                ))}

                {markers.map(({ key, position }) => (
                    <Entity
                        key={key}
                        name={propertyDefinitions[key].title}
                        description={`${i18next.t('location.coordinate')}: ${cartesian3ToString(position)}`}
                        position={Cartesian3.fromDegrees(position.x, position.y, 0)}
                    >
                        {/* <GeoJsonDataSource
                            data={{
                                type: 'Feature',
                                properties: preview?.entity.properties,
                                geometry: { type: 'Point', coordinates: [position.x, position.y] },
                            }}
                        /> */}
                        <PointGraphics color={Color.RED} pixelSize={10} />
                    </Entity>
                ))}
            </Viewer>
        </div>
    );
};

export default LocationPreview;
