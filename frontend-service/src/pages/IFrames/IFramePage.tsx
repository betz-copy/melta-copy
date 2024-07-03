import React, { useState } from 'react';
import Iframe from 'react-iframe';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { CircularProgress } from '@mui/material';
import IFramesHeadline from './Headline';
import { IFrame, IMongoIFrame } from '../../interfaces/iFrames';
import { getIFrameById, updateIFrame } from '../../services/iFramesService';

interface IFramePageProps {
    iFrame?: IMongoIFrame;
}

const IFramePage: React.FC<IFramePageProps> = ({ iFrame }) => {
    const { iFrameId } = useParams();
    const queryClient = useQueryClient();

    // const navigate = useNavigate();
    // const [sideBarOpen, setSideBarOpen] = useLocalStorage(iFrameSettings.isSidebarOpenLocalStorageKey, true);

    // const [edit, setEdit] = useState<boolean>(false);
    console.log({ iFrameId });

    const queryKey = ['getIFrame', iFrameId];
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const iFrameData = iFrameId ? useQuery(queryKey, async () => getIFrameById(iFrameId!)).data : iFrame!;
    console.log({ iFrameData });

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

    if (!iFrame) return <CircularProgress />;

    return (
        <>
            <IFramesHeadline iFrame={iFrameData!} />
            <Iframe
                url={iFrameData!.url}
                title={iFrameData!.name}
                width="100%"
                height="100%"
                styles={{
                    // maxHeight: '500px',
                    // overflow: 'auto',
                    borderBottomLeftRadius: 'inherit',
                    borderBottomRightRadius: 'inherit',
                }}
            />
        </>
    );
};
export default IFramePage;
