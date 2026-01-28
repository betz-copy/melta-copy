import { Grid } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { InfiniteScroll } from '../../common/InfiniteScroll';
import { IFrameWizard } from '../../common/wizards/iFrame';
import { environment } from '../../globals';
import { IMongoIFrame } from '../../interfaces/iFrames';
import { iFrameObjectToIFrameForm, searchIFrames } from '../../services/iFramesService';
import { LocalStorage } from '../../utils/localStorage';
import IFramePage from './IFramePage';
import IFramesPageHeadline from './IFramesHeadline';
import { Resizable } from './ResizableBox';

const { infiniteScrollPageCount, sideBarWidth, iFrameDimensionKey, sideBarOpenKey } = environment.iFrames;

const IFramesPage: React.FC<{ isSideBarOpen: boolean }> = ({ isSideBarOpen }) => {
    const queryClient = useQueryClient();

    const [iFrameWizardDialogState, setIFrameWizardDialogState] = useState<{
        isWizardOpen: boolean;
        iFrame: IMongoIFrame | null;
    }>({
        isWizardOpen: false,
        iFrame: null,
    });
    const [searchInput, setSearchInput] = useState<string>();
    const [iFramesOrder, setIFramesOrder] = useState<string[]>([]);
    const [isDimensionsChange, setIsDimensionsChange] = useState(false);
    const [iFrameDeleted, setIFrameDeleted] = useState(false);

    const localStorageKey = 'iFramesOrder';
    const queryKey = ['allIFrames', searchInput, iFramesOrder];
    const allIFrames = queryClient.getQueryData<IMongoIFrame[]>('allIFrames');
    const screenWidth = window.innerWidth;
    const sideBarWidthPrec = (screenWidth - sideBarWidth) / screenWidth;

    // biome-ignore lint/correctness/useExhaustiveDependencies: dependencies
    useEffect(() => {
        const iFramesIds = allIFrames?.map(({ _id }) => _id) || [];
        localStorage.setItem(localStorageKey, JSON.stringify(iFramesIds));
        setIFramesOrder(iFramesIds);
    }, [allIFrames, queryClient, iFrameDeleted]);

    useEffect(() => {
        const open = LocalStorage.get(sideBarOpenKey);
        Object.keys(localStorage)
            .filter((key) => key.startsWith(iFrameDimensionKey))
            .forEach((key) => {
                let value;
                try {
                    value = JSON.parse(localStorage.getItem(key)!);
                } catch (error) {
                    console.warn(
                        `[iFrameDimensions] Invalid JSON in localStorage for key: ${key}`,
                        error,
                    );
                    return
                }

                if (isSideBarOpen && !open) {
                    value.width *= sideBarWidthPrec;
                } else if (open && !isSideBarOpen) {
                    value.width /= sideBarWidthPrec;
                }

                localStorage.setItem(key, JSON.stringify(value));
            });

        localStorage.setItem(sideBarOpenKey, `${isSideBarOpen}`);
        setIsDimensionsChange(true);
    }, [isSideBarOpen, sideBarWidthPrec]);

    return (
        <Grid dir="ltr" style={{ display: 'flex', flexWrap: 'wrap' }}>
            <IFramesPageHeadline
                onSearch={(searchValue) => setSearchInput(searchValue || undefined)}
                setIFrameWizardDialogState={() => {
                    setIFrameWizardDialogState({ isWizardOpen: true, iFrame: null });
                }}
                iFramesOrder={iFramesOrder}
                setIFramesOrder={setIFramesOrder}
            />

            <Grid
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    paddingLeft: isSideBarOpen ? 30 : 25,
                    width: '100%',
                    boxSizing: 'border-box',
                }}
            >
                {iFramesOrder && (
                    <InfiniteScroll<IMongoIFrame>
                        queryKey={queryKey}
                        queryFunction={async ({ pageParam }) => {
                            const index = pageParam ?? 0;

                            if (searchInput) {
                                const currentOrder = iFramesOrder.slice(index, index + infiniteScrollPageCount);
                                return searchIFrames({
                                    search: searchInput,
                                    ids: currentOrder.map((iFrameId) => iFrameId),
                                });
                            }

                            return allIFrames ? allIFrames.slice(index, index + infiniteScrollPageCount) : [];
                        }}
                        onQueryError={(error) => {
                            console.error('Failed loading data:', error);
                            toast.error(i18next.t('iFrames.searchFailed'));
                        }}
                        getNextPageParam={(lastPage, allPages) => {
                            const nextPage = allPages.length * infiniteScrollPageCount;
                            return lastPage.length ? nextPage : undefined;
                        }}
                        emptyText={i18next.t('iFrames.noIFramesFound')}
                        useContainer={false}
                    >
                        {(iFrame) => {
                            return (
                                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                    <Resizable
                                        id={iFrame._id}
                                        isSideBarOpen={isSideBarOpen}
                                        isDimensionsChange={isDimensionsChange}
                                        setIsDimensionsChange={setIsDimensionsChange}
                                    >
                                        <Grid
                                            height="100%"
                                            width="100%"
                                            style={{
                                                borderRadius: '15px 15px 25px 15px',
                                                boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.2)',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <IFramePage
                                                iFrame={iFrame}
                                                isIFramePage={false}
                                                setIFramesOrder={setIFramesOrder}
                                                setIFrameDeleted={setIFrameDeleted}
                                            />
                                        </Grid>
                                    </Resizable>
                                </div>
                            );
                        }}
                    </InfiniteScroll>
                )}
            </Grid>
            <IFrameWizard
                open={iFrameWizardDialogState.isWizardOpen}
                handleClose={() => setIFrameWizardDialogState({ isWizardOpen: false, iFrame: null })}
                initialValues={iFrameObjectToIFrameForm(iFrameWizardDialogState.iFrame)}
                isEditMode={Boolean(iFrameWizardDialogState.iFrame)}
                setIFramesOrder={() => {}}
            />
        </Grid>
    );
};

export default IFramesPage;
