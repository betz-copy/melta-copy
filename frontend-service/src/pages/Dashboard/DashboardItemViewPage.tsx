import { Box, Card, Grid } from '@mui/material';
import React, { useRef } from 'react';
import Iframe from 'react-iframe';
import { useQueryClient } from 'react-query';
import { useLocation } from 'wouter';
import i18next from 'i18next';
import { Download, TableRowsOutlined } from '@mui/icons-material';
import { BlueTitle } from '../../common/BlueTitle';
import EntitiesTableOfTemplate, { EntitiesTableOfTemplateRef } from '../../common/EntitiesTableOfTemplate';
import { IChartType } from '../../interfaces/charts';
import { DashboardItemType, MongoDashboardItemPopulated } from '../../interfaces/dashboard';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import { useDarkModeStore } from '../../stores/darkMode';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import { GripVertical } from '../../utils/icons/fontAwesome';
import { HighchartGenerator } from '../Charts/chartGenerator.tsx/HighChartgenerator';
import { NumberChartGenerator } from '../Charts/chartGenerator.tsx/NumberChartGenerator';
import { CardMenu } from '../SystemManagement/components/CardMenu';
import { TableButton } from '../../common/TableButton';
import { IEntity } from '../../interfaces/entities';
import { ResetFilterButton } from '../../common/EntitiesPage/ResetFilterButton';
import { TableView } from './tableView';
import { isWorkspaceAdmin } from '../../utils/permissions/instancePermissions';

interface DashboardItemViewPageProps {
    chartDetails: MongoDashboardItemPopulated;
    isHoverOnCard: number | null;
    indexInGrid: number;
    onDelete: () => void;
    onEdit: () => void;
}

const DashboardItemViewPage: React.FC<DashboardItemViewPageProps> = ({
    chartDetails: { type, metaData },
    isHoverOnCard,
    indexInGrid,
    onDelete,
    onEdit,
}) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const currentUser = useUserStore((state) => state.user);
    const [currentLocation, navigate] = useLocation();
    const entitiesTableRef = useRef<EntitiesTableOfTemplateRef<IEntity>>(null);

    const { metadata: agGridMetaData } = useWorkspaceStore((state) => state.workspace);
    const { defaultRowHeight, defaultFontSize } = agGridMetaData.agGrid;
    const { headlineTitleFontSize } = agGridMetaData.mainFontSizes;

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    return (
        <Box style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Box
                className="drag-handle"
                style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 10,
                    cursor: 'grab',
                    padding: '10px',
                    borderRadius: '4px',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <GripVertical color={darkMode ? '#ccc' : 'grey'} size={16} />
            </Box>

            {isHoverOnCard === indexInGrid && isWorkspaceAdmin(currentUser.currentWorkspacePermissions) && (
                <Box
                    style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        zIndex: 10,
                        cursor: 'default',
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <CardMenu
                        onDeleteClick={onDelete}
                        onEditClick={onEdit}
                        // disabledProps={{
                        //     isDeleteDisabled: !isWorkspaceAdmin(currentUser.currentWorkspacePermissions),
                        //     isEditDisabled: false,
                        //     tooltipTitle: '',
                        // }}
                    />
                </Box>
            )}
            {type === DashboardItemType.Chart &&
                (metaData.type === IChartType.Number ? (
                    <NumberChartGenerator data={metaData.chart} name={metaData.name} description={metaData.description} enableResize />
                ) : (
                    <HighchartGenerator
                        data={metaData.chart}
                        isLoading={false}
                        isQueryEnabled
                        name={metaData.name}
                        description={metaData.description}
                        metaData={metaData.metaData}
                        type={metaData.type}
                        enableResize
                    />
                ))}

            {
                type === DashboardItemType.Table && <TableView metaData={metaData} />
                // <Grid item container width="100%" height="70%" alignItems="center" justifyContent="center" paddingTop="20px">
                //     <Card sx={{ width: '98%', height: 'fit-content', borderRadius: '7px', border: '1px #CCCFE5', gap: 2 }}>
                //         <BlueTitle
                //             title={metaData.name || ''}
                //             component="h4"
                //             variant="h4"
                //             style={{ fontSize: headlineTitleFontSize, justifySelf: 'center' }}
                //         />
                //         <EntitiesTableOfTemplate
                //             ref={entitiesTableRef}
                //             template={entityTemplates.get(metaData.templateId)!}
                //             getRowId={(currentEntity) => currentEntity.properties._id}
                //             getEntityPropertiesData={(currentEntity) => currentEntity.properties}
                //             rowHeight={defaultRowHeight}
                //             fontSize={`${defaultFontSize}px`}
                //             rowModelType="infinite"
                //             saveStorageProps={{
                //                 shouldSaveFilter: false,
                //                 shouldSaveWidth: false,
                //                 shouldSaveVisibleColumns: false,
                //                 shouldSaveSorting: false,
                //                 shouldSaveColumnOrder: false,
                //                 shouldSavePagination: false,
                //                 shouldSaveScrollPosition: false,
                //             }}
                //             showNavigateToRowButton={false}
                //             editable={false}
                //             defaultFilter={metaData.filter}
                //             columnsToShow={metaData.columns}
                //             // infiniteModeWithoutExpand
                //         />
                //     </Card>
                // </Grid>
            }

            {type === DashboardItemType.Iframe && (
                <Grid sx={{ width: '100%', height: 'fit-content', borderRadius: '7px', border: '1px #CCCFE5', gap: 2 }}>
                    <BlueTitle
                        title={metaData.name || ''}
                        component="h4"
                        variant="h4"
                        style={{ fontSize: headlineTitleFontSize, justifySelf: 'center', padding: '20px' }}
                    />
                    <Grid
                        style={{
                            height: 'calc(100vh - 48px)',
                            width: '100%',
                            overflow: 'hidden',
                        }}
                    >
                        <Iframe url={metaData!.url} title={metaData!.name} width="100%" height="100%" frameBorder={0} />
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export { DashboardItemViewPage };
