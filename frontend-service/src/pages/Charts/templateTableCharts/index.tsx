/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-param-reassign */
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import 'react-grid-layout/css/styles.css';
import { useMutation, useQueryClient } from 'react-query';
import 'react-resizable/css/styles.css';
import { toast } from 'react-toastify';
import { useParams } from 'wouter';
import { ErrorToast } from '../../../common/ErrorToast';
import { GridLayout } from '../../../common/GridLayout';
import { LayoutItem, Layouts } from '../../../common/GridLayout/interface';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { ChartsAndGenerator } from '../../../interfaces/charts';
import { deleteChart } from '../../../services/chartsService';
import { useLocalStorage } from '../../../utils/hooks/useLocalStorage';
import ChartItem from './chartItem';

const TemplateTableCharts: React.FC<{ templatesChart: ChartsAndGenerator[] }> = ({ templatesChart = [] }) => {
    const queryClient = useQueryClient();
    const { templateId } = useParams();

    const [mounted, setMounted] = useState(false);
    const [isHoverOnCard, setIsHoverOnCard] = useState<number | null>(null);
    const [layout, setLayout] = useLocalStorage<Layouts['lg']>(`chartsOrder_${templateId}`, []);
    const [deleteChartDialogState, setDeleteChartDialogState] = useState<{
        isDialogOpen: boolean;
        chartId: string | null;
    }>({
        isDialogOpen: false,
        chartId: null,
    });

    const cols = { lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 };

    const layoutDetails: Layouts = Object.keys(cols).reduce((acc, col) => {
        acc[col] = templatesChart.map((_, index) => ({
            i: String(index),
            x: (index % 3) * 4,
            y: Math.floor(index / 3) * 3,
            w: 4,
            h: 11,
        }));
        return acc;
    }, {} as Layouts);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (!layout.length) setLayout(layoutDetails.lg);
    }, [templatesChart]);

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

    const handleLayoutChange = (newLayout: LayoutItem[]) => {
        if (newLayout.length > 0) setLayout(newLayout);
    };

    const generateCharts = () =>
        templatesChart.map((chart, index) => (
            <div
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
                data-grid={layout[index]}
            >
                <ChartItem
                    chartDetails={chart}
                    indexInGrid={index}
                    isHoverOnCard={isHoverOnCard}
                    layout={layout[index]}
                    onDelete={() => setDeleteChartDialogState({ chartId: chart._id, isDialogOpen: true })}
                />
            </div>
        ));

    return (
        <div style={{ width: '100%', height: '100%' }}>
            {layout.length > 0 && (
                <GridLayout
                    style={{ direction: 'ltr', width: '100%', height: '100%' }}
                    rowHeight={30}
                    cols={cols}
                    useCSSTransforms={mounted}
                    compactType="vertical"
                    generateDom={generateCharts}
                    layouts={{ ...layoutDetails, lg: layout }}
                    onLayoutChange={handleLayoutChange}
                />
            )}
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
