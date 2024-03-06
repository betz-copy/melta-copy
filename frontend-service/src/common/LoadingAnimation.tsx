import React from 'react';
import loadingAnimation from '../assets/icons/Melta_Logo.svg';
import '../css/loading.css';

export const LoadingAnimation: React.FC = () => {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40vh' }}>
            <img className="ld ld-bounce" src={loadingAnimation} width="300px" />
        </div>
    );
};
