import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { ColumnsToolPanelModule } from '@ag-grid-enterprise/column-tool-panel';
import { LicenseManager } from '@ag-grid-enterprise/core';
import { MenuModule } from '@ag-grid-enterprise/menu';
import { ServerSideRowModelModule } from '@ag-grid-enterprise/server-side-row-model';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { StatusBarModule } from '@ag-grid-enterprise/status-bar';
import { GridChartsModule } from '@ag-grid-enterprise/charts';

import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-material.css';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    ServerSideRowModelModule,
    MenuModule,
    ColumnsToolPanelModule,
    SetFilterModule,
    StatusBarModule,
    GridChartsModule,
]);

LicenseManager.setLicenseKey('foo');
