/** biome-ignore-all lint/a11y/useKeyWithClickEvents: woohoo */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: woohoo */
import i18next from 'i18next';
import React, { useState } from 'react';
import { useLocation } from 'wouter';
import './index.css';

const ErrorPage: React.FC<{ errorText: string; navigateToRoot?: boolean }> = ({ errorText, navigateToRoot = false }) => {
    const [_, navigate] = useLocation();

    const [showEasterEgg, setShowEasterEgg] = useState(false);
    const [showEasterEgg2, setShowEasterEgg2] = useState(false);

    return (
        <div className="seaContainer">
            <div
                className="text__container"
                onClick={(event) => {
                    if (event.detail === 3) {
                        console.error(atob('JWNZb3UncmUgZ29ubmEgbmVlZCBhIGJpZ2dlciBib2F0'), 'color: blue; font-size:30px');
                        setShowEasterEgg2((prev) => !prev);
                    }
                }}
            >
                <p>{i18next.t('errorPage.oops')}</p>
                <p>{errorText}</p>
            </div>
            <div
                className={`submarine__container ${showEasterEgg2 ? 'submarine__container__animation' : ''}`}
                onClick={(event) => {
                    if (event.detail === 3) {
                        setShowEasterEgg((prev) => !prev);
                        console.error(atob('JWNIb3VzdG9uLCB3ZSBoYXZlIGEgcHJvYmxlbQ=='), 'color: blue; font-size:30px');
                    }
                }}
            >
                <div className={`light ${showEasterEgg ? 'light__animation' : ''}`} />
                <div className="submarine__periscope" />
                <div className="submarine__periscope-glass" />
                <div className="submarine__sail">
                    <div className="submarine__sail-shadow dark1" />
                    <div className="submarine__sail-shadow light1" />
                    <div className="submarine__sail-shadow dark2" />
                </div>
                <div className="submarine__body">
                    <div className={`submarine__window one ${showEasterEgg ? '' : 'submarine__window__animation'}`} />
                    <div className={`submarine__window two ${showEasterEgg ? '' : 'submarine__window__animation'}`} />
                    <div className="submarine__shadow-dark" />
                    <div className="submarine__shadow-light" />
                    <div className="submarine__shadow-arcLight" />
                </div>
                <div className="submarine__propeller">
                    <div
                        className={`propeller__perspective ${
                            showEasterEgg ? 'propeller__perspective__slowdown__animation' : 'propeller__perspective__animation'
                        }`}
                    >
                        <div className="submarine__propeller-parts darkOne" />
                        <div className="submarine__propeller-parts lightOne" />
                    </div>
                </div>
            </div>
            <button
                className="return_to_home"
                type="button"
                onClick={() => {
                    navigate(`${navigateToRoot ? '~' : ''}/`);
                }}
            >
                {i18next.t('errorPage.backToHome')}
            </button>
            <div
                className={`bubbles__container ${showEasterEgg ? 'bubbles__container__animation' : ''} ${
                    showEasterEgg2 ? 'bubbles__container__none' : ''
                }`}
            >
                <span className="bubbles bubble-1" />
                <span className="bubbles bubble-2" />
                <span className="bubbles bubble-3" />
                <span className="bubbles bubble-4" />
            </div>
            <div className="ground__container">
                <div className="ground ground1">
                    <span className="up-2" />
                    <span className="up-3" />
                    <span className="up-4" />
                    <span className="up-5" />
                    <span className="up-6" />
                    <span className="up-7" />
                    <span className="up-8" />
                    <span className="up-9" />
                    <span className="up-10" />
                </div>
                <div className="ground ground2">
                    <span className="up-1" />
                    <span className="up-2" />
                    <span className="up-3" />
                    <span className="up-4" />
                    <span className="up-5" />
                    <span className="up-6" />
                    <span className="up-7" />
                    <span className="up-8" />
                    <span className="up-9" />
                    <span className="up-10" />
                    <span className="up-11" />
                    <span className="up-12" />
                    <span className="up-13" />
                    <span className="up-14" />
                    <span className="up-15" />
                    <span className="up-16" />
                    <span className="up-17" />
                    <span className="up-18" />
                    <span className="up-19" />
                    <span className="up-20" />
                </div>
            </div>
        </div>
    );
};

export default ErrorPage;
