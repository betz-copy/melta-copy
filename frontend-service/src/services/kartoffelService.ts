/* eslint-disable no-promise-executor-return */
import axios from '../axios';
import { environment } from '../globals';

const { users } = environment.api;

export interface IUser {
    id: string;
    displayName: string; // custom displayName, not of kartoffel: `${fullName} - ${hierarchy}/${jobTitle}`
    digitalIdentities: { uniqueId: string }[];
    firstName: string;
    lastName: string;
    fullName: string;
}

const searchUsersRequest = async (fullName: string) => {
    const { data } = await axios.get<IUser[]>(`${users}/search`, { params: { fullName } });
    return data;
};
const getUserByIdRequest = async (userId: string) => {
    const { data } = await axios.get<IUser>(`${users}/${userId}`);
    return data;
};

export { searchUsersRequest, getUserByIdRequest };
