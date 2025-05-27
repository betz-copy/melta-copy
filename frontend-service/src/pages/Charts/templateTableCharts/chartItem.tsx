import { Box } from '@mui/material';
import React from 'react';
import { ChartsAndGenerator, IChartType } from '../../../interfaces/charts';
import { useDarkModeStore } from '../../../stores/darkMode';
import { useUserStore } from '../../../stores/user';
import { GripVertical } from '../../../utils/icons/fontAwesome';
import { isWorkspaceAdmin } from '../../../utils/permissions/instancePermissions';
import { CardMenu } from '../../SystemManagement/components/CardMenu';
import { HighchartGenerator } from '../chartGenerator.tsx/HighChartgenerator';
import { NumberChartGenerator } from '../chartGenerator.tsx/NumberChartGenerator';

interface ChartItemProps {
    chartDetails: ChartsAndGenerator;
    isHoverOnCard: number | null;
    indexInGrid: number;
    onDelete: () => void;
    onEdit: () => void;
}

const ChartItem: React.FC<ChartItemProps> = ({
    chartDetails: { chart: chartData, type, name, description, metaData, _id, createdBy },
    isHoverOnCard,
    indexInGrid,
    onDelete,
    onEdit,
}) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const currentUser = useUserStore();

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
                            isDeleteDisabled: createdBy !== currentUser.user._id && !isWorkspaceAdmin(currentUser.user.currentWorkspacePermissions),
                            isEditDisabled: false,
                            tooltipTitle: '',
                        }}
                    />
                </Box>
            )}

            {type === IChartType.Number ? (
                <NumberChartGenerator data={chartData} name={name} description={description} enableResize />
            ) : (
                <HighchartGenerator
                    data={chartData}
                    isLoading={false}
                    isQueryEnabled
                    name={name}
                    description={description}
                    metaData={metaData}
                    type={type}
                    enableResize
                />
            )}
        </Box>
    );
};

export default ChartItem;
