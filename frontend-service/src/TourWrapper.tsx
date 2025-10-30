import { StepType, TourProvider } from '@reactour/tour';
import i18next from 'i18next';
import React, { ReactNode } from 'react';
import hebrew from './i18n/hebrew';

const TourWrapper: React.FC<{ children?: ReactNode }> = ({ children }) => {
    const tourText = i18next.t('tourText', { returnObjects: true }) as (typeof hebrew)['tourText'];

    const steps: StepType[] = [
        {
            selector: '[data-tour="side-bar"]',
            content: tourText.sideBar,
        },
        {
            selector: '[data-tour="my-permissions"]',
            content: tourText.myPermissions,
        },
        {
            selector: '[data-tour="template-filter"]',
            content: tourText.templateFilter,
        },
        {
            selector: '[data-tour="search-input"]',
            content: tourText.searchInput,
        },
        {
            selector: '[data-tour="create-entity"]',
            content: tourText.createEntity,
        },
        {
            selector: '.ag-side-button',
            content: tourText.columnsFilter,
        },
        {
            selector: '[data-tour="entity-page"]',
            content: tourText.entityPage,
            disableActions: true,
            stepInteraction: true,
        },
        {
            selector: '[data-tour="entity-details"]',
            content: tourText.entityDetails,
        },
        {
            selector: '[data-tour="connected-entities"]',
            content: tourText.connectedEntities,
        },
        {
            selector: '[data-tour="create-relationship"]',
            content: tourText.createRelationship,
        },
    ];

    return (
        <TourProvider
            steps={steps}
            rtl
            styles={{
                maskArea: (base) => ({ ...base, rx: 10, marginTop: 10 }),
                popover: (base) => ({
                    ...base,
                    borderRadius: 10,
                    marginTop: 10,
                    color: '#000000',
                }),
                close: (base) => ({ ...base, right: 8, left: 'auto', top: 8, width: '12px', height: '12px' }),
                arrow: (base) => ({ ...base, height: '18px', width: '24px' }),
                dot: (base) => ({ ...base, cursor: 'default' }),
            }}
            prevButton={({ Button }) => <Button kind="prev" hideArrow />} // prevButton removed because some steps go between pages, so going backward is difficult
            nextButton={({ Button, currentStep }) => <Button kind="next" hideArrow={currentStep === 6} />} // nextButton removed so the user must enter entity page
            disableKeyboardNavigation={['right']}
            onClickMask={({ currentStep, setIsOpen }) => currentStep === steps.length - 1 && setIsOpen(false)}
            disableDotsNavigation
        >
            {children}
        </TourProvider>
    );
};

export { TourWrapper };
