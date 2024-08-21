/* eslint-disable react/no-array-index-key */
import React, { useEffect, useRef, useState } from 'react';
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

const IFramesPage: React.FC = () => {
    const [iFrameWizardDialogState, setIFrameWizardDialogState] = useState<{
        isWizardOpen: boolean;
        iFrame: IMongoIFrame | null;
    }>({
        isWizardOpen: false,
        iFrame: null,
    });
    const [searchInput, setSearchInput] = useState<string>();
    const queryClient = useQueryClient();

    const queryKey = ['searchIFrames', searchInput];
    const allIFrames = queryClient.getQueryData<IMongoIFrame[]>('allIFrames');
    const [iFramesOrder, setIFramesOrder] = useState<any>(null);
    const localStorageKey = 'iFramesOrder';
        queryClient.invalidateQueries(queryKey);

    useEffect(() => {
        console.log('refreshhhhhhhhh');

        if (allIFrames) {
            console.log('helooooo', { allIFrames });
            queryClient.invalidateQueries(queryKey);
        }
    }, [allIFrames]);

    useEffect(() => {
        console.log('nice to meet you');

        const order = localStorage.getItem(localStorageKey);
        if (!order) {
            const iFramesData = allIFrames?.map(({ name, _id }) => ({ name, id: _id })) || [];

            localStorage.setItem(localStorageKey, JSON.stringify(iFramesData));
        }
        const order2 = localStorage.getItem(localStorageKey);
        setIFramesOrder(JSON.parse(localStorage.getItem(localStorageKey)!));
        console.log({ order2 }, { iFramesOrder });
    }, []);

    useEffect(() => {
        console.log('i think the order change ', { iFramesOrder });
        queryClient.invalidateQueries(queryKey);
    }, [iFramesOrder]);

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
                // container
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    paddingLeft: 20,
                    width: '100%',
                }}
            >
                {iFramesOrder && (
                    <InfiniteScroll<IMongoIFrame>
                        queryKey={queryKey}
                        queryFunction={async ({ pageParam }) => {
                            console.log('kdkdkdkd', { iFramesOrder });

                            const index = pageParam ?? 0;
                            // const z = iFramesOrder;
                            // const currentOrder = z.slice(index, index + 4);
                            const currentOrder = iFramesOrder.slice(index, index + 4);
                            const iFramesIdsOrder = currentOrder.map((iFrame) => iFrame.id);

                            console.log({ currentOrder }, { iFramesIdsOrder });

                            const iFrames = await searchIFrames({
                                search: searchInput,
                                // ids: currentOrder.map((item) => item._id),
                                ids: iFramesIdsOrder,
                            });
                            return iFrames;
                            //   console.log('kdkdkdkd', { iFramesOrderRef });
                            //   console.log(iFramesOrderRef.current, { allIFrames });

                            //   const index = pageParam ?? 0;
                            //   const currentOrder = iFramesOrderRef.current.slice(index, index + 4);
                            //   console.log({ currentOrder });

                            //   const iFrames = await searchIFrames({
                            //       search: searchInput,
                            //       ids: currentOrder.map((item) => item._id),
                            //   });
                            //   return iFrames;
                        }}
                        onQueryError={(error) => {
                            console.log('Failed loading data:', error);
                            toast.error(i18next.t('iFrames.searchFailed'));
                        }}
                        getNextPageParam={(lastPage, allPages) => {
                            const nextPage = allPages.length * 4;
                            return lastPage.length ? nextPage : undefined;
                        }}
                        emptyText={i18next.t('iFrames.noIFramesFound')}
                        useContainer={false}
                    >
                        {(iFrame) => {
                            return (
                                <Resizable minHeight={500} minWidth={900} maxHeight={800} maxWidth={1800} id={iFrame._id}>
                                    <Grid padding={2} height="100%" width="100%">
                                        <IFramePage iFrame={iFrame} isIFramePage={false} />
                                    </Grid>
                                </Resizable>
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
            />
        </Grid>
    );
};

export default IFramesPage;
