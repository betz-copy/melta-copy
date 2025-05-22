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
import { LayoutItem } from '../../../common/GridLayout/interface';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { environment } from '../../../globals';
import { ChartsAndGenerator } from '../../../interfaces/charts';
import { deleteChart } from '../../../services/chartsService';
import { generateLayoutDetails, generateNewItemSizes } from '../../../utils/charts/defaultChartSizes';
import { LocalStorage } from '../../../utils/localStorage';
import ChartItem from './chartItem';

const { chartsOrderKey, defaultColumnSizes } = environment.charts;

const TemplateTableCharts: React.FC<{
    templatesChart: ChartsAndGenerator[];
    layout: LayoutItem[];
    setLayout: React.Dispatch<React.SetStateAction<LayoutItem[]>>;
    textSearch: string | undefined;
}> = ({ templatesChart = [], layout, setLayout, textSearch }) => {
    const queryClient = useQueryClient();
    const { templateId } = useParams();

    const [mounted, setMounted] = useState(false);
    const [isHoverOnCard, setIsHoverOnCard] = useState<number | null>(null);
    const [deleteChartDialogState, setDeleteChartDialogState] = useState<{
        isDialogOpen: boolean;
        chartId: string | null;
    }>({
        isDialogOpen: false,
        chartId: null,
    });

    const getSavedLayout = (): LayoutItem[] => LocalStorage.get(`${chartsOrderKey}${templateId}`) || [];

    useEffect(() => {
        const savedLayout = getSavedLayout();
        setLayout(savedLayout.length ? savedLayout : generateLayoutDetails(templatesChart as ChartsAndGenerator[]).lg);
        setMounted(true);
    }, []);

    useEffect(() => {
        const savedLayout = getSavedLayout();
        if (!savedLayout && templatesChart.length > 0) setLayout(generateLayoutDetails(templatesChart as ChartsAndGenerator[]).lg);
        if (templatesChart.length > savedLayout.length) {
            const updatedLayout = [...savedLayout];

            templatesChart.forEach((chart) => {
                if (!updatedLayout.some((item) => item.i === chart._id)) updatedLayout.push(generateNewItemSizes(templateId!, chart._id));
            });

            setLayout(updatedLayout);
        }

        if (textSearch) savedLayout.filter((l) => templatesChart.some((chart) => chart._id === l.i));
    }, [templatesChart, textSearch]);

    const { mutateAsync: deleteChartMutateAsync, isLoading: isDeleteChartLoading } = useMutation((id: string) => deleteChart(id), {
        onSuccess: (data) => {
            toast.success(i18next.t('charts.actions.deletedSuccessfully'));
            setDeleteChartDialogState({ isDialogOpen: false, chartId: null });

            const updatedLayout = layout.filter((item) => item.i !== data._id);
            LocalStorage.set(`${chartsOrderKey}${templateId}`, updatedLayout);
            setLayout(updatedLayout);

            queryClient.invalidateQueries({ queryKey: ['getCharts', templateId, textSearch] });
        },
        onError: (error: AxiosError) => {
            toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('charts.actions.failedToDelete')} />);
        },
    });

    const handleLayoutChange = (newLayout: LayoutItem[]) => {
        const savedLayout = getSavedLayout();

        if (newLayout.length) {
            setLayout((prevLayout) => {
                if (prevLayout.length < newLayout.length && savedLayout && !textSearch) return savedLayout;

                const updatedLayout = newLayout.map((newItem, index) => {
                    const existingItem = prevLayout[index];
                    return existingItem ? { ...newItem, i: existingItem.i } : newItem;
                });

                if (savedLayout && savedLayout.length > newLayout.length) updatedLayout.push(savedLayout[savedLayout.length - 1]);

                if (!textSearch) LocalStorage.set(`${chartsOrderKey}${templateId}`, updatedLayout);

                return updatedLayout;
            });
        }
    };

    const generateCharts = () =>
        templatesChart.map((chart, index) => (
            <div
                key={chart._id}
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
                    cols={defaultColumnSizes}
                    useCSSTransforms={mounted}
                    compactType="vertical"
                    generateDom={generateCharts}
                    layouts={{ md: layout, lg: layout, sm: layout, xs: layout, xxs: layout }}
                    onLayoutChange={handleLayoutChange}
                    draggableHandle=".drag-handle"
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
