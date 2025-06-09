import { Box } from '@mui/material';
import React from 'react';
import { IChartType } from '../../interfaces/charts';
import { DashboardItemType, MongoDashboardItemPopulated } from '../../interfaces/dashboard';
import { useDarkModeStore } from '../../stores/darkMode';
import { useUserStore } from '../../stores/user';
import { GripVertical } from '../../utils/icons/fontAwesome';
import { isWorkspaceAdmin } from '../../utils/permissions/instancePermissions';
import { HighchartGenerator } from '../Charts/chartGenerator.tsx/HighChartgenerator';
import { NumberChartGenerator } from '../Charts/chartGenerator.tsx/NumberChartGenerator';
import { CardMenu } from '../SystemManagement/components/CardMenu';
import { IframeView } from './iframeView';
import { TableView } from './tableView';

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
                    <CardMenu onDeleteClick={onDelete} onEditClick={onEdit} />
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

            {type === DashboardItemType.Table && <TableView metaData={metaData} />}

            {type === DashboardItemType.Iframe && <IframeView metaData={metaData} />}
        </Box>
    );
};

export { DashboardItemViewPage };
