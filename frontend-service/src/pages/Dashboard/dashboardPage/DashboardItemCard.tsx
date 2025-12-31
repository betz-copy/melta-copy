import { Box } from '@mui/material';
import React from 'react';
import { IChartType } from '../../../interfaces/charts';
import { DashboardItemType, MongoDashboardItemPopulated } from '../../../interfaces/dashboard';
import { useDarkModeStore } from '../../../stores/darkMode';
import { useUserStore } from '../../../stores/user';
import { GripVertical } from '../../../utils/icons/fontAwesome';
import { isWorkspaceAdmin } from '../../../utils/permissions/instancePermissions';
import { HighchartGenerator } from '../../Charts/chartGenerator.tsx/HighchartGenerator';
import { NumberChartGenerator } from '../../Charts/chartGenerator.tsx/NumberChartGenerator';
import { CardMenu } from '../../SystemManagement/components/CardMenu';
import IFrameCard from './IFrameCard';
import TableCard from './TableCard';

interface DashboardItemCardProps {
    itemDetails: MongoDashboardItemPopulated;
    isHoverOnCard: number | null;
    indexInGrid: number;
    onDelete: () => void;
    onEdit: () => void;
}

const DashboardItemContent = React.memo(({ itemDetails }: { itemDetails: MongoDashboardItemPopulated }) => {
    switch (itemDetails.type) {
        case DashboardItemType.Chart: {
            const chartMetaData = itemDetails.metaData;

            if (chartMetaData.type === IChartType.Number)
                return <NumberChartGenerator data={chartMetaData.chart} chartDetails={chartMetaData} enableResize />;

            return <HighchartGenerator generatedChart={chartMetaData.chart} chartDetails={chartMetaData} isQueryEnabled enableResize />;
        }

        case DashboardItemType.Table:
            return <TableCard metaData={{ ...itemDetails.metaData, _id: itemDetails._id }} />;

        case DashboardItemType.Iframe:
            return <IFrameCard metaData={itemDetails.metaData} />;

        default:
            return null;
    }
});

const DashboardItemCard: React.FC<DashboardItemCardProps> = ({ itemDetails, isHoverOnCard, indexInGrid, onDelete, onEdit }) => {
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
            <DashboardItemContent itemDetails={itemDetails} />
        </Box>
    );
};

export default DashboardItemCard;
