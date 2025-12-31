// !This whole page is written without mui - in order to render a large scale tree fast

import ShortcutIcon from '@mui/icons-material/Shortcut';
import React from 'react';
import { EntityPropertiesInternal } from '../../../../common/EntityProperties';
import { IEntity } from '../../../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IRelationshipTemplateMap } from '../../../../interfaces/relationshipTemplates';
import { EntityDates } from '../EntityDates';
import { IEntityTreeNode } from './ComponentToPrint';

interface IEntityComponentToPrintProps {
    entityTemplate: IMongoEntityTemplatePopulated;
    entity: IEntity;
    options: {
        showEntityDates: boolean;
        showDisabled: boolean;
        addEntityCheckbox?: boolean;
        showPreviewPropertiesOnly?: boolean;
    };
    hierarchicalChildren?: IEntityTreeNode[];
    depth?: number;
    entityTemplates: IEntityTemplateMap;
    relationships: IRelationshipTemplateMap;
}

const EntityComponentToPrint: React.FC<IEntityComponentToPrintProps> = React.memo(
    ({ entityTemplate, entity, options, hierarchicalChildren, depth = 0, entityTemplates, relationships }) => {
        const rowStyle: React.CSSProperties = {
            display: 'flex',
            flexDirection: 'column',
            padding: depth > 0 ? '10px 0px 0px 20px' : '20px 0px',
            width: '100%',
        };

        const containerStyle: React.CSSProperties = {
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: depth === 1 ? '#CCCFE526' : 'transparent',
            marginTop: depth === 0 ? '10px' : '0px',
            paddingBottom: '10px',
            borderRadius: '8px',
            width: '100%',
        };

        const rootEntityComponent = (
            <div style={{ backgroundColor: '#CCCFE526', border: '1px solid #CCCFE5', borderRadius: '12px', width: '100%', padding: '1rem' }}>
                <EntityPropertiesInternal
                    properties={entity.properties}
                    coloredFields={entity.coloredFields}
                    entityTemplate={entityTemplate}
                    darkMode={false}
                    showPreviewPropertiesOnly={options.showPreviewPropertiesOnly}
                    mode="normal"
                    textWrap
                    isPrintingMode
                    showByGroups
                    style={{ width: '100%', display: 'flex', flexDirection: 'row' }}
                />
                {options.showEntityDates && <EntityDates createdAt={entity.properties.createdAt} updatedAt={entity.properties.updatedAt} toPrint />}
            </div>
        );

        const connectionRow = (
            <div style={{ display: 'flex', width: '100%', gap: '10px', alignItems: 'center', flexDirection: 'row' }}>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', alignItems: 'center' }}>
                    {depth > 1 && <ShortcutIcon sx={{ fontSize: 16, color: '#9398C2', transform: 'rotate(180deg)' }} />}
                    {options.addEntityCheckbox && <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: '1px solid black' }} />}
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
                        minWidth: 0,
                        width: '100%',
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
                            showPreviewPropertiesOnly={options.showPreviewPropertiesOnly}
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

        return (
            <div style={rowStyle}>
                {depth === 0 ? rootEntityComponent : connectionRow}
                {hierarchicalChildren?.length ? (
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
                                        hierarchicalChildren={child.children}
                                        entityTemplates={entityTemplates}
                                        relationships={relationships}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ marginTop: '10px' }} />
                )}
            </div>
        );
    },
);

export { EntityComponentToPrint };
