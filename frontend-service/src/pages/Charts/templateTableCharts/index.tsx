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
import { LocalStorage } from '../../../utils/localStorage';
import ChartItem from './chartItem';

const TemplateTableCharts: React.FC<{ templatesChart: ChartsAndGenerator[]; textSearch: string | undefined }> = ({
    templatesChart = [],
    textSearch,
}) => {
    const queryClient = useQueryClient();
    const { templateId } = useParams();

    const [mounted, setMounted] = useState(false);
    const [isHoverOnCard, setIsHoverOnCard] = useState<number | null>(null);

    const [layout, setLayout] = useState<LayoutItem[]>([]);

    const [deleteChartDialogState, setDeleteChartDialogState] = useState<{
        isDialogOpen: boolean;
        chartId: string | null;
    }>({
        isDialogOpen: false,
        chartId: null,
    });

    const cols = { lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 };

    const layoutDetails: Layouts = Object.keys(cols).reduce((acc, col) => {
        acc[col] = templatesChart.map(({ _id }, index) => ({
            i: _id,
            x: (index % 3) * 4,
            y: Math.floor(index / 3) * 3,
            w: 4,
            h: 11,
        }));
        return acc;
    }, {} as Layouts);

    useEffect(() => {
        const savedLayout: LayoutItem[] | null = LocalStorage.get(`chartsOrder_${templateId}`);

        if (savedLayout) setLayout(savedLayout);
        else setLayout(layoutDetails.lg);

        setMounted(true);
    }, []);

    useEffect(() => {
        const savedLayout: LayoutItem[] | null = LocalStorage.get(`chartsOrder_${templateId}`);
        if (savedLayout) {
            if (!textSearch) setLayout(savedLayout);
            else setLayout(savedLayout.filter((l) => templatesChart.some((chart) => chart._id === l.i)));
        }
    }, [templatesChart, textSearch]);

    const { mutateAsync: deleteChartMutateAsync, isLoading: isDeleteChartLoading } = useMutation((id: string) => deleteChart(id), {
        onSuccess: (data) => {
            toast.success(i18next.t('charts.actions.deletedSuccessfully'));
            setDeleteChartDialogState({ isDialogOpen: false, chartId: null });
            const savedLayout: LayoutItem[] | null = LocalStorage.get(`chartsOrder_${templateId}`);

            LocalStorage.set(
                `chartsOrder_${templateId}`,
                savedLayout?.filter((layoutItem) => layoutItem.i !== data._id),
            );
            setLayout(layout.filter((layoutItem) => layoutItem.i !== data._id));
            queryClient.invalidateQueries({ queryKey: ['getCharts', templateId] });
        },
        onError: (error: AxiosError) => {
            toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('charts.actions.failedToDelete')} />);
        },
    });

    const handleLayoutChange = (newLayout: LayoutItem[]) => {
        const savedLayout: LayoutItem[] | null = LocalStorage.get(`chartsOrder_${templateId}`);

        if (newLayout.length) {
            setLayout((prevLayout) => {
                if (prevLayout.length < newLayout.length && savedLayout && !textSearch) return savedLayout;

                const updatedLayout = newLayout.map((newItem, index) => {
                    const existingItem = prevLayout[index];

                    return existingItem ? { ...existingItem, x: newItem.x, y: newItem.y, w: newItem.w, h: newItem.h } : newItem;
                });

                if (savedLayout && savedLayout.length > newLayout.length) updatedLayout.push(savedLayout[savedLayout.length - 1]);

                if (!textSearch) LocalStorage.set(`chartsOrder_${templateId}`, updatedLayout);
                return updatedLayout;
            });
        }
    };

    const generateCharts = () =>
        templatesChart.map((chart, index) => {
            return (
                <div
                    // eslint-disable-next-line react/no-array-index-key
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
                        onDelete={() => {
                            setDeleteChartDialogState({ chartId: chart._id, isDialogOpen: true });
                        }}
                    />
                </div>
            );
        });

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
                    layouts={{ md: layout, lg: layout, sm: layout, xs: layout, xxs: layout }}
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
