// !This whole page is written without mui - in order to render a large scale tree fast

import ShortcutIcon from '@mui/icons-material/Shortcut';
import React from 'react';
import { EntityPropertiesInternal } from '../../../../common/EntityProperties';
import { IEntity } from '../../../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IRelationshipTemplateMap } from '../../../../interfaces/relationshipTemplates';
import { IEntityTreeNode } from './ComponentToPrint';

interface IEntityComponentToPrintProps {
    entityTemplate: IMongoEntityTemplatePopulated;
    entity: IEntity;
    options: {
        showEntityDates: boolean;
        showDisabled: boolean;
        addEntityCheckbox?: boolean;
    };
    showPreviewPropertiesOnly?: boolean;
    hierarchicalChildren?: IEntityTreeNode[];
    depth?: number;
    entityTemplates: IEntityTemplateMap;
    relationships: IRelationshipTemplateMap;
}

const EntityComponentToPrint: React.FC<IEntityComponentToPrintProps> = React.memo(
    ({ entityTemplate, entity, options, showPreviewPropertiesOnly, hierarchicalChildren, depth = 0, entityTemplates, relationships }) => {
        const rowStyle: React.CSSProperties = {
            display: 'flex',
            flexDirection: 'column',
            padding: depth > 0 ? '10px 0px 0px 30px' : '20px 0px',
            width: '100%',
        };

        const containerStyle: React.CSSProperties = {
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: depth === 1 ? '#CCCFE526' : 'transparent',
            marginTop: '10px',
            paddingBottom: '10px',
            borderRadius: '8px',
            width: '100%',
        };

        const renderRow = () => {
            const isRoot = depth === 0;

            if (isRoot) {
                return (
                    <div style={{ backgroundColor: '#CCCFE526', border: '1px solid #CCCFE5', borderRadius: '12px', width: '100%', padding: '1rem' }}>
                        <EntityPropertiesInternal
                            properties={entity.properties}
                            coloredFields={entity.coloredFields}
                            entityTemplate={entityTemplate}
                            darkMode={false}
                            showPreviewPropertiesOnly={showPreviewPropertiesOnly}
                            mode="normal"
                            textWrap
                            isPrintingMode
                            showByGroups
                            style={{ width: '100%', display: 'flex', flexDirection: 'row' }}
                        />
                    </div>
                );
            }

            return (
                <div style={{ display: 'flex', width: '100%', gap: '10px', alignItems: 'center', flexDirection: 'row' }}>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', alignItems: 'center' }}>
                        {depth > 1 && <ShortcutIcon sx={{ fontSize: 16, color: '#9398C2', transform: 'rotate(180deg)' }} />}
                        {options.addEntityCheckbox && (
                            <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: '1px solid black' }} />
                        )}
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            border: '1px solid #CCCFE5',
                            borderRadius: '8px',
                            padding: '0 10px',
                            alignItems: 'center',
                            gap: '10px',
                            backgroundColor: 'white',
                            width: '90%',
                            minWidth: 0,
                            flexWrap: 'nowrap',
                        }}
                    >
                        <span style={{ fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap' }}>{entityTemplate.displayName}</span>
                        <span style={{ color: '#CCCFE580' }}>|</span>
                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                            <EntityPropertiesInternal
                                properties={entity.properties}
                                coloredFields={entity.coloredFields}
                                entityTemplate={entityTemplate}
                                darkMode={false}
                                showPreviewPropertiesOnly={showPreviewPropertiesOnly}
                                mode="normal"
                                isPrintingMode
                                showByGroups
                                textWrap
                                style={{ width: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center' }}
                            />
                        </div>
                    </div>
                </div>
            );
        };

        return (
            <div style={rowStyle}>
                {renderRow()}
                {hierarchicalChildren && (
                    <div style={containerStyle}>
                        {hierarchicalChildren.map((child) => {
                            const template = entityTemplates.get(child.templateId);
                            const relationship = relationships.get(child.relationshipId);
                            if (!template || !relationship) return null;

                            return (
                                <div key={child.properties._id} style={{ paddingRight: depth > 0 ? '30px' : '0px' }}>
                                    <EntityComponentToPrint
                                        depth={depth + 1}
                                        entityTemplate={template}
                                        entity={child}
                                        options={options}
                                        showPreviewPropertiesOnly
                                        hierarchicalChildren={child.children}
                                        entityTemplates={entityTemplates}
                                        relationships={relationships}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    },
);

export { EntityComponentToPrint };
