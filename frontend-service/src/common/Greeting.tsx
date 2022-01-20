import React from 'react';
import i18next from 'i18next';
import { Typography } from '@mui/material';
import { UserState } from '../store/user';

type GreetingProps = {
    name: UserState['name'];
};

const Greeting: React.FC<GreetingProps> = ({ name }) => {
    const currentDayTime = new Date().getHours();

    const getGreetingText = () => {
        if (currentDayTime >= 6 && currentDayTime < 12) {
            return i18next.t('greeting.morning');
        }
        if (currentDayTime >= 12 && currentDayTime < 17) {
            return i18next.t('greeting.noon');
        }
        if (currentDayTime >= 17 && currentDayTime < 21) {
            return i18next.t('greeting.evening');
        }
        return i18next.t('greeting.night');
    };

    return (
        <Typography variant="h6" noWrap>
            {`${getGreetingText()}, ${name.firstName} ${name.lastName}`}
        </Typography>
    );
};

export { Greeting };
