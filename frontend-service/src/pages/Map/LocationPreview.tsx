import * as Cesium from 'cesium';
import { Cartesian3 } from 'cesium';
import { useEffect, useRef } from 'react';
import { useQueryClient } from 'react-query';
import { CesiumComponentRef, Viewer } from 'resium';
import { IMongoChildTemplatePopulated } from '../../interfaces/childTemplates';
import { IEntity } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { BackendConfigState } from '../../services/backendConfigService';
import { useEntityWithLocationFields } from '../../utils/hooks/useLocation';
import { jerusalemCoordinates } from '../../utils/map';
import { convertWGS94ToECEF } from '../../utils/map/convert';
import { BaseLayers } from './BaseLayers';
import { MeltaCoordinate, MeltaPolygon } from './LocationEntities';

type Props = {
    entityProperties: IEntity['properties'];
    entityTemplate: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated;
};

const LocationPreview = ({ entityProperties, entityTemplate }: Props) => {
    const queryClient = useQueryClient();
    const config = queryClient.getQueryData<BackendConfigState>('getBackendConfig');

    const viewerRef = useRef<CesiumComponentRef<Cesium.Viewer>>(null);

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
