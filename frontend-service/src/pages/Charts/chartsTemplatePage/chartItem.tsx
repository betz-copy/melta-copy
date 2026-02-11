import { Box } from '@mui/material';
import { ChartsAndGenerator, IChartType } from '@packages/chart';
import React from 'react';
import { useDarkModeStore } from '../../../stores/darkMode';
import { useUserStore } from '../../../stores/user';
import { GripVertical } from '../../../utils/icons/fontAwesome';
import { isWorkspaceAdmin } from '../../../utils/permissions/instancePermissions';
import { CardMenu } from '../../SystemManagement/components/CardMenu';
import { HighchartGenerator } from '../chartGenerator.tsx/HighchartGenerator';
import { NumberChartGenerator } from '../chartGenerator.tsx/NumberChartGenerator';

interface ChartItemProps {
    chartDetails: ChartsAndGenerator;
    isHoverOnCard: number | null;
    indexInGrid: number;
    onDelete: () => void;
    onEdit: () => void;
}

const ChartItem: React.FC<ChartItemProps> = ({ chartDetails, isHoverOnCard, indexInGrid, onDelete, onEdit }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const currentUser = useUserStore((state) => state.user);
    const { createdBy, chart, type } = chartDetails;

    const hasWritePermission = createdBy !== currentUser._id && !isWorkspaceAdmin(currentUser.currentWorkspacePermissions);

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
                    padding: '4px',
                    borderRadius: '4px',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <GripVertical color={darkMode ? '#ccc' : 'grey'} size={16} />
            </Box>

            {isHoverOnCard === indexInGrid && (
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
                        disabledProps={{
                            isDeleteDisabled: hasWritePermission,
                            isEditDisabled: hasWritePermission,
                            tooltipTitle: '',
                        }}
                    />
                </Box>
            )}

            {type === IChartType.Number ? (
                <NumberChartGenerator data={chart} chartDetails={chartDetails} enableResize />
            ) : (
                <HighchartGenerator generatedChart={chart} chartDetails={chartDetails} isQueryEnabled enableResize />
            )}
        </Box>
    );
};

export default ChartItem;
