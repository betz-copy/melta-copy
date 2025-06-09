import React from 'react';
import { IEntity } from '../../../interfaces/entities';
import { IMongoChildEntityTemplatePopulated } from '../../../interfaces/entityChildTemplates';
import UserInfoCard from '../mainPage/UserInfoCard';
import { Grid } from '@mui/material';

interface IUserInfoCardProps {
    currentUserFromSimba: IEntity;
    usersInfoChildTemplate: IMongoChildEntityTemplatePopulated;
}

const UserInfoPage: React.FC<IUserInfoCardProps> = ({ currentUserFromSimba, usersInfoChildTemplate }) => {
    return (
        <Grid padding="40px">
            <UserInfoCard currentUserFromSimba={currentUserFromSimba} usersInfoChildTemplate={usersInfoChildTemplate} displayTilte={false} />
        </Grid>
    );
};

export default UserInfoPage;
