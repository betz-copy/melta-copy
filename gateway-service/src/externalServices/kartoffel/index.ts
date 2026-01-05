import { BadRequestError } from '@packages/utils';
import axios from 'axios';
import config from '../../config';
import { IKartoffelUser } from './interface';

const {
    kartoffel: { url, baseEntitiesRoute, searchRoute, fieldToSearch, getByIdRoute, requestTimeout, profilePath, maxPageSize },
} = config;

class Kartoffel {
    private static kartoffel = axios.create({
        baseURL: `${url}${baseEntitiesRoute}`,
        timeout: requestTimeout,
        params: { expanded: true },
    });

    static searchUsers = async (queryString: string): Promise<IKartoffelUser[]> => {
        const { data } = await this.kartoffel.get<IKartoffelUser[]>(searchRoute, {
            params: {
                fields: fieldToSearch,
                queryString,
            },
        });

        return data;
    };

    static getUserById = async (id: string) => {
        const { data } = await this.kartoffel.get<IKartoffelUser>(`${getByIdRoute}/${id}`);
        return data;
    };

    static getUsersByIds = async (ids: string[]) => {
        const { data } = await this.kartoffel.get<IKartoffelUser[]>(``, {
            params: {
                ids: ids,
                page: 1,
                pageSize: maxPageSize,
            },
        });
        return data;
    };

    static getUserProfile = async (kartoffelId: string) => {
        const { identityCard, personalNumber } = await this.getUserById(kartoffelId);
        try {
            const { data } = await axios.get(`${url}${baseEntitiesRoute}/${personalNumber ?? identityCard}/${profilePath}`, {
                responseType: 'stream',
            });
            return data;
        } catch (error) {
            throw new BadRequestError('Kartoffel profile not found', { error });
        }
    };

    // identityCards refer to tz, but the kartoffel field name is identityCard
    static getUsersByIdentityCards = async (identityCards: string[]): Promise<IKartoffelUser[]> => {
        const { data } = await this.kartoffel.get<IKartoffelUser[]>(``, {
            params: {
                identityCards: identityCards,
                page: 1,
                pageSize: maxPageSize,
            },
        });

        return data;
    };
}

export default Kartoffel;
