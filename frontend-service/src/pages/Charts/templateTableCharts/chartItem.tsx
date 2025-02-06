import { Box } from '@mui/material';
import React from 'react';
import { useLocation } from 'wouter';
import { ChartsAndGenerator, IChartType } from '../../../interfaces/charts';
import { useUserStore } from '../../../stores/user';
import { isWorkspaceAdmin } from '../../../utils/permissions/instancePermissions';
import { CardMenu } from '../../SystemManagement/components/CardMenu';
import { NumberChartGenerator } from '../chartGenerator.tsx/NumberChartGenerator';
import { HiighchartGenerator } from '../chartGenerator.tsx/highChartgenerator';

interface ChartItemProps {
    chartDetails: ChartsAndGenerator;
    layout: any;
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
        <>
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
                        onNavigate={() => {
                            navigate(`${currentLocation}/${_id}/chart`);
                        }}
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
        </>
    );
};

export default ChartItem;
