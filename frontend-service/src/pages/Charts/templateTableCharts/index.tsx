import { Box } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import 'react-grid-layout/css/styles.css';
import { useMutation, useQueryClient } from 'react-query';
import 'react-resizable/css/styles.css';
import { toast } from 'react-toastify';
import { useLocation, useParams } from 'wouter';
import { ErrorToast } from '../../../common/ErrorToast';
import { GridLayout } from '../../../common/GridLayout';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { ChartsAndGenerator, IChartType } from '../../../interfaces/charts';
import { deleteChart } from '../../../services/chartsService';
import { CardMenu } from '../../SystemManagement/components/CardMenu';
import { NumberChartGenerator } from '../chartGenerator.tsx/NumberChartGenerator';
import { HiighchartGenerator } from '../chartGenerator.tsx/highChartgenerator';

const TemplateTableCharts: React.FC<{ templatesChart: ChartsAndGenerator[] }> = ({ templatesChart = [] }) => {
    const queryClient = useQueryClient();
    const { templateId } = useParams();

    const [currentLocation, navigate] = useLocation();

    const [mounted, setMounted] = useState(false);
    const [isHoverOnCard, setIsHoverOnCard] = useState<number | null>(null);
    const [deleteChartDialogState, setDeleteChartDialogState] = useState<{
        isDialogOpen: boolean;
        chartId: string | null;
    }>({
        isDialogOpen: false,
        chartId: null,
    });

    const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
    const rowHeight = 30;

    const layouts = {
        lg: templatesChart.map((_, index) => ({
            i: String(index),
            x: (index % 4) * 3,
            y: Math.floor(index / 4) * 3,
            w: 3,
            h: 11,
        })),
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    const { mutateAsync: deleteChartMutateAsync, isLoading: isDeleteChartLoading } = useMutation((id: string) => deleteChart(id), {
        onSuccess: () => {
            toast.success(i18next.t('charts.actions.deletedSuccessfully'));
            setDeleteChartDialogState({ isDialogOpen: false, chartId: null });
            queryClient.invalidateQueries({ queryKey: ['getCharts', templateId] });
        },
        onError: (error: AxiosError) => {
            toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('charts.actions.failedToDelete')} />);
        },
    });

    const generateCharts = useCallback(() => {
        return templatesChart.map(({ chart: chartData, type, name, description, metaData, _id }, index) => (
            <Box
                // eslint-disable-next-line react/no-array-index-key
                key={String(index)}
                style={{
                    background: '#f9f9f9',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                }}
                onMouseEnter={() => setIsHoverOnCard(index)}
                onMouseLeave={() => setIsHoverOnCard(null)}
            >
                {isHoverOnCard === index && (
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
                            onEditClick={() => {
                                navigate(`${currentLocation}/${_id}/chart`);
                            }}
                            onDeleteClick={() => setDeleteChartDialogState({ isDialogOpen: true, chartId: _id })}
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
                        enableRsize
                    />
                )}
            </Box>
        ));
    }, [currentLocation, isHoverOnCard, navigate, templatesChart]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', margin: 10 }}>
            <GridLayout
                style={{ direction: 'ltr' }}
                rowHeight={rowHeight}
                cols={cols}
                layouts={layouts}
                measureBeforeMount={false}
                useCSSTransforms={mounted}
                compactType="vertical"
                preventCollision
                generateDom={generateCharts}
            />
            <AreYouSureDialog
                open={deleteChartDialogState.isDialogOpen}
                handleClose={() => setDeleteChartDialogState({ isDialogOpen: false, chartId: null })}
                onYes={() => deleteChartMutateAsync(deleteChartDialogState.chartId!)}
                isLoading={isDeleteChartLoading}
            />
        </div>
    );
};

export { TemplateTableCharts };
