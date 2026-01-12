import { IEntity } from '@packages/entity';
import { IEntityTemplateMap, IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { IMongoPrintingTemplate } from '@packages/printing-template';
import { IRelationshipTemplateMap } from '@packages/relationship-template';
import React from 'react';
import { EntityPropertiesInternal } from '../../../../common/EntityProperties';
import { IPrintOptions } from '../../../../common/print/PrintOptionsDialog';
import { EntityDates } from '../EntityDates';
import { IEntityTreeNode } from './ComponentToPrint';

interface IEntityComponentToPrintProps {
    entityTemplate: IMongoEntityTemplateWithConstraintsPopulated;
    entity: IEntity;
    options: Pick<IPrintOptions, 'showEntitiesDates' | 'addEntityCheckbox' | 'showPreviewPropertiesOnly'>;
    hierarchicalChildren?: IEntityTreeNode[];
    depth?: number;
    isFirstChild?: boolean;
    entityTemplates: IEntityTemplateMap;
    relationships: IRelationshipTemplateMap;
    printingTemplate?: IMongoPrintingTemplate;
}

const EntityComponentToPrint: React.FC<IEntityComponentToPrintProps> = React.memo(
    ({ entityTemplate, entity, options, hierarchicalChildren, depth = 0, entityTemplates, relationships, printingTemplate }) => {
        const rowStyle: React.CSSProperties = {
            display: 'flex',
            flexDirection: 'column',
            padding: '0px',
            width: '100%',
            marginTop: depth > 0 ? '13px' : '0px',
        };

        const containerStyle: React.CSSProperties = {
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: depth === 1 ? '#CCCFE526' : 'transparent',
            marginTop: depth === 1 ? '10px' : '0px',
            padding: depth === 1 ? '0px 13px 10px 20px' : '0px',
            borderRadius: '8px',
            width: '100%',
        };

        const selectedTemplate = printingTemplate?.sections.find((section) => section.entityTemplateId === entityTemplate._id);

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
                    printingTemplateSection={selectedTemplate}
                />
                {options.showEntitiesDates && <EntityDates createdAt={entity.properties.createdAt} updatedAt={entity.properties.updatedAt} toPrint />}
            </div>
        );

        const connectionRow = (
            <div
                style={{
                    display: 'flex',
                    width: '100%',
                    gap: '10px',
                    alignItems: 'center',
                    flexDirection: 'row',
                    paddingRight: depth > 2 ? `${(depth - 2) * 30}px` : '0px',
                }}
            >
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
                        opacity: entity.properties.disabled ? 0.5 : 1,
                        pageBreakInside: 'avoid',
                        breakInside: 'avoid',
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
                            printingTemplateSection={selectedTemplate}
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
                        {hierarchicalChildren.map((child, index) => {
                            const template = entityTemplates.get(child.templateId);
                            const relationship = relationships.get(child.relationshipId);
                            if (!template || !relationship) return null;

                            return (
                                <div key={child.properties._id}>
                                    <EntityComponentToPrint
                                        depth={depth + 1}
                                        isFirstChild={index === 0}
                                        entityTemplate={template}
                                        entity={child}
                                        options={options}
                                        hierarchicalChildren={child.children}
                                        entityTemplates={entityTemplates}
                                        relationships={relationships}
                                        printingTemplate={printingTemplate}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ) : null}
            </div>
        );
    },
);

export { EntityComponentToPrint };
