import React from 'react';
import Iframe from 'react-iframe';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { CircularProgress, Grid } from '@mui/material';
import IFramesHeadline from './Headline';
import { IMongoIFrame } from '../../interfaces/iFrames';
import { getIFrameById } from '../../services/iFramesService';

interface IFramePageProps {
    iFrame?: IMongoIFrame;
}

const IFramePage: React.FC<IFramePageProps> = ({ iFrame }) => {
    const { iFrameId } = useParams();
    const navigate = useNavigate();

    const { data: iFrameData, isLoading } = useQuery(['getIFrame', iFrameId], async () => getIFrameById(iFrameId!), {
        initialData: iFrame,
        retry: false,
        onError: (err) => {
            console.log(err);
            navigate('/404');
        },
    });
    // const { mutateAsync: updateIFrameMutateAsync, isLoading: isUpdateIFrameLoading } = useMutation(
    //     (params: Parameters<typeof updateIFrame>) => updateIFrame(...params),
    //     {
    //         onSuccess: (updatedIFrame) => {
    //             queryClient.setQueryData(queryKey, updatedIFrame);
    //             setEdit(false);
    //             toast.success(i18next.t('iFrames.actions.updatedSuccessfully'));
    //         },
    //         onError: (error: AxiosError) => {
    //             toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('iFrames.actions.failedToUpdate')} />);
    //         },
    //     },
    // );
    // const { mutateAsync: deleteIFrameMutateAsync, isLoading: isDeleteIFrameLoading } = useMutation((id: string) => deleteIFrame(id), {
    //     onSuccess: () => {
    //         navigate('/iFrames');
    //         toast.success(i18next.t('iFrames.actions.deletedSuccessfully'));
    //     },
    //     onError: (error: AxiosError) => {
    //         toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('iFrames.actions.failedToDelete')} />);
    //     },
    // });

    if (isLoading) {
        return (
            <Grid container justifyContent="center">
                <CircularProgress />
            </Grid>
        );
    }

    return (
        <Grid
            dir="rtl"
            style={{
                position: 'absolute',
                left: 1,
                right: 80,
                bottom: 47,
                top: 0,
            }}
        >
            <IFramesHeadline iFrame={iFrameData!} />
            <Iframe url={iFrameData!.url} title={iFrameData!.name} width="100%" height="100%" />
        </Grid>
    );
};
export default IFramePage;
