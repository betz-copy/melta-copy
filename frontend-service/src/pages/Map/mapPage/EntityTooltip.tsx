import * as Cesium from 'cesium';
import i18next from 'i18next';
import React, { useEffect, useRef } from 'react';
import { Root, createRoot } from 'react-dom/client';
import { EntityPropertiesInternal } from '../../../common/EntityProperties';
import { IEntity } from '../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { CesiumComponentRef } from 'resium';
import { IPolygonSearchResult } from '../../../utils/map';

interface EntityTooltipProps {
    entity: IEntity;
    darkMode: boolean;
    entityTemplates: IEntityTemplateMap;
    arrowDirection?: 'up' | 'down';
}

export const EntityTooltip: React.FC<EntityTooltipProps> = ({ entity, darkMode, entityTemplates, arrowDirection }) => {
    return (
        <div
            style={{
                backgroundColor: '#F0F2F7',
                borderRadius: '6px',
                padding: '8px 10px',
                maxWidth: '350px',
                pointerEvents: 'none',
                fontSize: '0.85rem',
                position: 'relative',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '6px solid #F0F2F7',
                    ...(arrowDirection === 'down' ? { bottom: '-6px' } : { top: '-6px' }),
                }}
            />

            {entityTemplates.get(entity.templateId)!.propertiesPreview.length ? (
                <EntityPropertiesInternal
                    properties={entity.properties}
                    coloredFields={entity.coloredFields}
                    showPreviewPropertiesOnly
                    entityTemplate={entityTemplates.get(entity.templateId)!}
                    darkMode={darkMode}
                    mode="normal"
                    textWrap
                    viewFirstLineOfLongText
                    entityTemplates={entityTemplates}
                />
            ) : (
                i18next.t('graph.noPreviewProperties')
            )}
        </div>
    );
};

interface UseCesiumTooltipParams {
    viewerRef: React.RefObject<CesiumComponentRef<Cesium.Viewer> | null>;
    darkMode: boolean;
    entityTemplateMap: IEntityTemplateMap;
    searchedEntitiesPolygons: IPolygonSearchResult[];
    filteredPolygons: IPolygonSearchResult[];
}

export function useCesiumTooltip({ viewerRef, darkMode, entityTemplateMap, searchedEntitiesPolygons, filteredPolygons }: UseCesiumTooltipParams) {
    const rootRef = useRef<Root | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const viewer = viewerRef.current?.cesiumElement;
        if (!viewer) return;
        console.log('hii');

        const tooltip = document.createElement('div');
        tooltip.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 1000;
            display: none;
        `;
        document.body.appendChild(tooltip);
        tooltipRef.current = tooltip;

        const root = createRoot(tooltip);
        rootRef.current = root;

        const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

        handler.setInputAction(({ endPosition }: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
            const pickedObject = viewer.scene.pick(endPosition);
            const entity = pickedObject?.id;

            viewer.canvas.style.cursor = entity ? 'pointer' : 'default';

            if (!entity) {
                tooltip.style.display = 'none';
                return;
            }

            const nodeData: IEntity | undefined = entity?.properties?.__node?.getValue?.() ?? entity.properties?.__node;

            if (!nodeData) {
                tooltip.style.display = 'none';
                return;
            }

            const mouseX = endPosition.x;
            const mouseY = endPosition.y;

            tooltip.style.display = 'block';

            requestAnimationFrame(() => {
                const { width, height } = tooltip.getBoundingClientRect();
                const gap = 20;

                let top = mouseY - height - gap;
                let direction: 'up' | 'down' = 'down';

                if (top < 0) {
                    top = mouseY + gap;
                    direction = 'up';
                }

                tooltip.style.left = `${mouseX - width / 2}px`;
                tooltip.style.top = `${top}px`;

                root.render(<EntityTooltip darkMode={darkMode} entity={nodeData} entityTemplates={entityTemplateMap} arrowDirection={direction} />);
            });
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        return () => {
            handler.destroy();
            root.unmount();
            tooltip.remove();
        };
    }, [searchedEntitiesPolygons.length, filteredPolygons.length]);
}
