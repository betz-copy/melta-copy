import { initModelPerWorkspace } from './initModelPerWorkspace';

export const getTemplatesWithFiles = (workspaceId: string) => {
    const entityTemplateModel = initModelPerWorkspace(workspaceId);

    return entityTemplateModel
        .find({
            $expr: {
                $or: [
                    {
                        $in: [
                            'fileId',
                            {
                                $map: {
                                    input: { $objectToArray: '$properties.properties' },
                                    as: 'entry',
                                    in: '$$entry.v.format',
                                },
                            },
                        ],
                    },
                    {
                        $in: [
                            'fileId',
                            {
                                $map: {
                                    input: { $objectToArray: '$properties.properties' },
                                    as: 'entry',
                                    in: '$$entry.v.items.format',
                                },
                            },
                        ],
                    },
                ],
            },
        })
        .lean()
        .exec();
};
