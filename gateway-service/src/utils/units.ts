import { IMongoUnit } from '@microservices/shared';
import UserService from '../externalServices/userService';

export const unflattenUnitHierarchy = async (workspaceId: string, userId: string): Promise<IMongoUnit[]> => {
    const hierarchy = await UserService.getUnitHierarchy(workspaceId, userId);
    const units: IMongoUnit[] = [];
    const stack = [...hierarchy];

    while (stack.length) {
        const current = stack.pop()!;
        const { children, ...rest } = current;
        units.push(rest as IMongoUnit);

        if (children?.length) stack.push(...children);
    }

    return units;
};
