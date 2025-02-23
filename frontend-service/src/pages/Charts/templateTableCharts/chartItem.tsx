import { Box } from '@mui/material';
import React from 'react';
import { useLocation } from 'wouter';
import { ChartsAndGenerator, IChartType } from '../../../interfaces/charts';
import { useUserStore } from '../../../stores/user';
import { GripVertical } from '../../../utils/icons/fontAwesome';
import { isWorkspaceAdmin } from '../../../utils/permissions/instancePermissions';
import { CardMenu } from '../../SystemManagement/components/CardMenu';
import { NumberChartGenerator } from '../chartGenerator.tsx/NumberChartGenerator';
import { HiighchartGenerator } from '../chartGenerator.tsx/highChartgenerator';

interface ChartItemProps {
    chartDetails: ChartsAndGenerator;
    isHoverOnCard: number | null;
    indexInGrid: number;
    onDelete: () => void;
}

const ChartItem: React.FC<ChartItemProps> = ({
    chartDetails: { chart: chartData, type, name, description, metaData, _id, createdBy },
    isHoverOnCard,
    indexInGrid,
    onDelete,
}) => {
    const currentUser = useUserStore();
    const [currentLocation, navigate] = useLocation();

    return (
        <Box style={{ width: '100%', height: '100%', position: 'relative' }} onClick={() => navigate(`${currentLocation}/${_id}/chart`)}>
            <Box
                className="drag-handle"
                style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 10,
                    cursor: 'grab',
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    padding: '4px',
                    borderRadius: '4px',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <GripVertical color="grey" size={16} />
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
                        disabledProps={{
                            isDeleteDisabled: createdBy !== currentUser.user._id || !isWorkspaceAdmin(currentUser.user.currentWorkspacePermissions),
                            isEditDisabled: false,
                            tooltipTitle: '',
                        }}
                    />
                </Box>
            )}

            {type === IChartType.Number ? (
                <NumberChartGenerator data={chartData} name={name} description={description} enableResize />
            ) : (
                <HiighchartGenerator
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
