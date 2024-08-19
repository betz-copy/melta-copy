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
    // const [allIFrames, setAllIFrames] = useState<any>();
    console.log({ allIFrames });

    const iFramesOrderRef = useRef<any>(null);
    const [iFramesOrder, setIFramesOrder] = useState<any>();
    // useEffect(() => {
    //     setAllIFrames();
    // }, []);

    useEffect(() => {
        if (allIFrames) {
            console.log('helooooo', { allIFrames });
            setIFramesOrder(allIFrames);
            iFramesOrderRef.current = allIFrames;
            queryClient.invalidateQueries(queryKey);
        }
    }, [allIFrames]);
    console.log({ iFramesOrder });

    console.log('frgfwefjewf ', { iFramesOrder }, iFramesOrderRef.current);

    // const [dimensions, setDimensions] = useState({
    //     minHeight: 0,
    //     minWidth: 0,
    //     maxHeight: 0,
    //     maxWidth: 0,
    // });

    // useEffect(() => {
    //     const calculateDimensions = () => {
    //         const vw = window.innerWidth;
    //         const vh = window.innerHeight;
    //         setDimensions({
    //             minHeight: vh * 0.5,
    //             minWidth: vw * 0.47,
    //             maxHeight: vh * 0.8,
    //             maxWidth: vw * 0.94,
    //         });
    //     };

    //     calculateDimensions();

    //     window.addEventListener('resize', calculateDimensions);

    //     return () => window.removeEventListener('resize', calculateDimensions);
    // }, []);

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
                container
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    paddingLeft: 20,
                }}
            >
                <InfiniteScroll<IMongoIFrame>
                    queryKey={queryKey}
                    queryFunction={async ({ pageParam }) => {
                        console.log('kdkdkdkd', { iFramesOrderRef });

                        const index = pageParam ?? 0;
                        console.log(iFramesOrderRef.current, { allIFrames });

                        const currentOrder = iFramesOrderRef.current.slice(index, index + 4);

                        console.log({ currentOrder });

                        const iFrames = await searchIFrames({
                            search: searchInput,
                            ids: currentOrder.map((item) => item._id),
                        });
                        return iFrames;
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
                            <Resizable minHeight={500} minWidth={1000} maxHeight={800} maxWidth={2000} id={iFrame._id}>
                                <Grid padding={2} height="100%" width="100%">
                                    <IFramePage iFrame={iFrame} isIFramePage={false} />
                                </Grid>
                            </Resizable>
                        );
                    }}
                </InfiniteScroll>
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
