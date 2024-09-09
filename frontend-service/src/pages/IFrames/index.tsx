/* eslint-disable react/no-array-index-key */
import React, { useEffect, useState } from 'react';
import { useQueryClient } from 'react-query';
import { Grid } from '@mui/material';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { iFrameObjectToIFrameForm, searchIFrames } from '../../services/iFramesService';
import IFramesPageHeadline from './IFramesHeadline';
import { IMongoIFrame } from '../../interfaces/iFrames';
import { IFrameWizard } from '../../common/wizards/iFrame';
import IFramePage from './IFramePage';
import { InfiniteScroll } from '../../common/InfiniteScroll';
import { Resizable } from './ResizableBox';
import { environment } from '../../globals';

const IFramesPage: React.FC<{ isSideBarOpen: boolean }> = ({ isSideBarOpen }) => {
    const { infiniteScrollPageCount } = environment.iFrames;
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

    const localStorageKey = 'iFramesOrder';
    const queryKey = ['allIFrames', searchInput, iFramesOrder];
    const allIFrames = queryClient.getQueryData<IMongoIFrame[]>('allIFrames');

    const screenWidth = window.innerWidth;
    const sideBarWidth = 200;
    const sideBarWidthPrec = (screenWidth - sideBarWidth) / screenWidth;

    useEffect(() => {
        const iFramesIds = allIFrames?.map(({ _id }) => _id) || [];
        localStorage.setItem(localStorageKey, JSON.stringify(iFramesIds));
        setIFramesOrder(iFramesIds);
    }, [allIFrames, queryClient]);

    useEffect(() => {
        const open: string = localStorage.getItem('isSideBarOpen') ?? 'false';
        Object.keys(localStorage)
            .filter((key) => key.startsWith('iFrameDimension_'))
            .forEach((key) => {
                const value = JSON.parse(localStorage.getItem(key)!);
                if (isSideBarOpen && open !== 'true') {
                    value.width *= sideBarWidthPrec;
                } else if (open === 'true' && !isSideBarOpen) {
                    value.width /= sideBarWidthPrec;
                }

                localStorage.setItem(key, JSON.stringify(value));
            });

        localStorage.setItem('isSideBarOpen', `${isSideBarOpen}`);
        setIsDimensionsChange(true);
    }, [isSideBarOpen]);

    return (
        <Grid dir="ltr" style={{ maxHeight: '1000px', display: 'flex', flexWrap: 'wrap' }}>
            <Grid container>
                <IFramesPageHeadline
                    onSearch={(searchValue) => setSearchInput(searchValue || undefined)}
                    setIFrameWizardDialogState={() => {
                        setIFrameWizardDialogState({ isWizardOpen: true, iFrame: null });
                    }}
                    iFramesOrder={iFramesOrder}
                    setIFramesOrder={setIFramesOrder}
                />
            </Grid>

            <Grid
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    paddingLeft: isSideBarOpen ? 25 : 13,
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
                            console.log('Failed loading data:', error);
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
                                            item
                                            height="100%"
                                            width="100%"
                                            style={{
                                                borderRadius: '15px 15px 25px 15px',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <IFramePage iFrame={iFrame} isIFramePage={false} setIFramesOrder={setIFramesOrder} />
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
