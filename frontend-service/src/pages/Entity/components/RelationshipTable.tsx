import React, { useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import i18next from 'i18next';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IEntity } from '../../../interfaces/entities';
import { booleanColDef, dateColDef, numberColDef, stringColDef } from '../../../utils/agGrid/commonColDefs';

import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-material.css';
import '../../../css/components/templateTable.css';

const RelationshipTable: React.FC<{ connectedEntities: IEntity[]; entityTemplate: IMongoEntityTemplatePopulated }> = ({
    connectedEntities,
    entityTemplate,
}) => {
    const gridRef = useRef<any>(null);
    const headerNames: { [key: string]: string } = {};

    Object.keys(entityTemplate.properties.properties).forEach((name) => {
        headerNames[name] = entityTemplate.properties.properties[name].title;
    });

    const columnDefs: ColDef[] = Object.entries(entityTemplate.properties.properties).map(([key, value]) => {
        const { type, format } = value;

        if (type === 'number') return numberColDef(key, value);
        if (type === 'boolean') return booleanColDef(key, value);
        if (format === 'date' || format === 'date-time') return dateColDef(key, value);
        return stringColDef(key, value);
    });

    return (
        <AgGridReact
            className="ag-theme-material"
            containerStyle={{ height: 360, width: '100%', marginBottom: '30px', fontFamily: 'Rubik', fontSize: '16px', borderRadius: '70px' }}
            ref={gridRef}
            columnDefs={columnDefs}
            pagination
            paginationPageSize={5}
            rowHeight={50}
            rowData={connectedEntities.map((entity) => {
                return { ...entity.properties, _id: entity._id };
            })}
            columnHoverHighlight
            enableRtl
            enableCellTextSelection
            suppressCellFocus
            suppressCsvExport
            suppressContextMenu
            defaultColDef={{
                filterParams: {
                    suppressAndOrCondition: true,
                    buttons: ['reset'],
                },
                sortable: true,
                menuTabs: ['filterMenuTab'],
                minWidth: 200,
                flex: 1,
            }}
            sideBar={{
                toolPanels: [
                    {
                        id: 'columns',
                        labelDefault: 'Columns',
                        labelKey: 'columns',
                        iconKey: 'columns',
                        toolPanel: 'agColumnsToolPanel',
                        toolPanelParams: {
                            suppressRowGroups: true,
                            suppressValues: true,
                            suppressPivotMode: true,
                        },
                    },
                ],
                position: 'left',
            }}
            localeText={i18next.t('agGridLocaleText', { returnObjects: true })}
        />
    );
};

export { RelationshipTable };
