import React from 'react';
import loadingAnimation from '../assets/icons/Melta_Logo.svg';
import '../css/loading.css';
import { environment } from '../globals';
import { useWorkspaceStore } from '../stores/workspace';

interface ILoadingAnimationProps {
    isLoading?: boolean;
}

export const LoadingAnimation: React.FC<ILoadingAnimationProps> = ({ isLoading }) => {
    const workspace = useWorkspaceStore((state) => state.workspace);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40vh' }}>
            {!isLoading && (
                <img
                    className="ld ld-bounce"
                    src={workspace?.logoFileId ? `/api${environment.api.storage}/${workspace.logoFileId}` : loadingAnimation}
                    width="300px"
                />
            )}
        </div>
    );
};
