import {
    CreateProcessReqBody,
    IMongoProcessInstancePopulated,
    IMongoProcessTemplatePopulated,
    IMongoStepInstance,
    IProcessInstance,
    ServiceError,
    Status,
    UpdateProcessReqBody,
    UpdateStepReqBody,
} from '@microservices/shared';
import { Express } from 'express';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import request from 'supertest';
import StepInstanceManager from '../src/express/instances/steps/manager';
import Server from '../src/express/server';
import processInstanceExample1, { errStepsPropertiesExample1, stepsPropertiesExample1 } from './mock/instances';
import processTemplateExample1 from './mock/templates';

const { OK: okStatus, BAD_REQUEST: badRequest, NOT_FOUND: notFoundStatus, INTERNAL_SERVER_ERROR: internalServerErrorStatus } = StatusCodes;

const testUrl = 'mongodb://localhost:27017/test';
const randomMongoId = () => {
    return String(new mongoose.Types.ObjectId());
};
const removeAllCollections = async () => {
    const collections = Object.keys(mongoose.connection.collections);

    for (const collectionName of collections) {
        const collection = mongoose.connection.collections[collectionName];
        await collection.deleteMany({});
    }
};

const prepareProcessTemplateToUpdate = (processTemplate: IMongoProcessTemplatePopulated) => {
    const { _id, ...cleanTemplateProcess } = JSON.parse(JSON.stringify(processTemplate));
    const cleanSteps = cleanTemplateProcess.steps.map((step) => {
        const { ...cleanStep } = step;
        return cleanStep;
    });
    return { ...cleanTemplateProcess, steps: cleanSteps };
};

const prepareDataForCreateProcessInstance = (
    processTemplate: IMongoProcessTemplatePopulated,
    processInstanceData: Pick<IProcessInstance, 'name' | 'details' | 'startDate' | 'endDate'>,
): CreateProcessReqBody => {
    return {
        templateId: processTemplate._id,
        name: processInstanceData.name,
        startDate: processInstanceData.startDate,
        endDate: processInstanceData.endDate,
        details: processInstanceData.details,
        steps: processTemplate.steps.reduce((acc, obj) => {
            acc[obj._id] = [];
            return acc;
        }, {}),
    };
};

const prepareDataForUpdateProcessInstance = (
    processInstanceData: Partial<Omit<IProcessInstance, 'templateId' | 'steps' | 'reviewedAt' | 'status'>>,
    steps: IMongoStepInstance[],
): UpdateProcessReqBody => {
    const updateData: UpdateProcessReqBody = {
        details: processInstanceData.details,
        name: processInstanceData.name,
        steps: steps.reduce((acc, obj) => {
            acc[obj._id] = [randomMongoId(), randomMongoId()];
            return acc;
        }, {}),
    };
    return updateData;
};
const errPropertiesType = (instanceProperties: Record<string, any>): Record<string, any> => {
    return Object.entries(instanceProperties).reduce((acc, [key, value]) => {
        let newValue: any;

        if (typeof value === 'number') {
            newValue = String(value);
        } else if (typeof value === 'string') {
            newValue = Boolean(value);
        } else if (typeof value === 'boolean') {
            newValue = value ? 1 : 0;
        }

        // Add the changed values directly to the accumulator object
        acc[key] = newValue;

        return acc;
    }, {});
};
describe('Test Process Service', () => {
    let app: Express;
    let processTemplate: IMongoProcessTemplatePopulated;
    let processInstance: IMongoProcessInstancePopulated;

    beforeAll(async () => {
        await mongoose.connect(testUrl, { useUnifiedTopology: true });
        app = Server.createExpressApp();
    });

    afterAll(async () => {
        await removeAllCollections();
        await mongoose.disconnect();
    });

    describe('Test the root path', () => {
        describe('/isAlive', () => {
            it('Should return 200 and "alive"', async () => {
                const response = await request(app).get('/isAlive');
                expect(response.status).toBe(okStatus);
                expect(response.text).toBe('alive');
            });
        });

        describe('/Invalid Route', () => {
            it('Should return 404 and "Invalid Route"', async () => {
                const response = await request(app).get('/invalid-route');
                expect(response.status).toBe(notFoundStatus);
                expect(response.text).toBe('Invalid Route');
            });
        });
    });
    describe('Templates', () => {
        describe('POST /api/processes/templates', () => {
            it('Should create a new process template and return 200', async () => {
                const response = await request(app).post('/api/processes/templates').send(processTemplateExample1);
                expect(response.status).toBe(okStatus);

                processTemplate = response.body;
                expect(processTemplate.name).toEqual(processTemplateExample1.name);
                expect(processTemplate.displayName).toEqual(processTemplateExample1.displayName);
            });
            it('Should try create a new process template and return 500 because duplicate error', async () => {
                const response = await request(app).post('/api/processes/templates').send(processTemplateExample1);
                expect(response.status).toBe(internalServerErrorStatus);
                expect(response.text).toContain('duplicate');
            });
            it('Should try create a new process template and return 500 because duplicate error', async () => {
                const response = await request(app)
                    .post('/api/processes/templates')
                    .send({ ...processTemplateExample1, name: 'ChangeChange' });
                // also need to fail because of steps name duplicate
                expect(response.status).toBe(internalServerErrorStatus);
                expect(response.text).toContain('duplicate');
            });
        });

        describe('GET /api/processes/templates/:id', () => {
            it('Should return 200 and the process template', async () => {
                const response = await request(app).get(`/api/processes/templates/${processTemplate._id}`);
                expect(response.status).toBe(okStatus);
                expect(response.body).toEqual(processTemplate);
            });
        });

        describe('PUT /api/processes/templates/:id', () => {
            it('Should return validation error', async () => {
                const response = await request(app).put('/api/processes/templates/1').send({});
                expect(response.status).toBe(badRequest);
            });

            it('Should try update the process template with wrong body, fail and return 400', async () => {
                const response = await request(app).put(`/api/processes/templates/${processTemplate._id}`).send(processTemplate);
                expect(response.status).toBe(badRequest);
                expect(response.text).toContain('is not allowed');
            });

            it('Should update the process template name, and return 200', async () => {
                const updatedProcessTemplate = prepareProcessTemplateToUpdate(processTemplate);
                const newName = `${updatedProcessTemplate.name}change`;
                updatedProcessTemplate.name = newName;
                const response = await request(app).put(`/api/processes/templates/${processTemplate._id}`).send(updatedProcessTemplate);
                expect(response.status).toBe(okStatus);
                expect(response.body.name).toBe(newName);
            });

            it('Should update the step template name and return 200', async () => {
                const updatedProcessTemplate = prepareProcessTemplateToUpdate(processTemplate);
                const newStepName = `${updatedProcessTemplate.steps[0].name}change`;
                updatedProcessTemplate.steps[0].name = newStepName;
                const response = await request(app).put(`/api/processes/templates/${processTemplate._id}`).send(updatedProcessTemplate);
                expect(response.status).toBe(okStatus);
                expect(response.body.steps[0].name).toBe(newStepName);
            });

            it('Should update the process template and modify steps length and return 200', async () => {
                const updatedProcessTemplate = prepareProcessTemplateToUpdate(processTemplate);
                updatedProcessTemplate.steps = updatedProcessTemplate.steps.splice(1, 1);
                const response = await request(app).put(`/api/processes/templates/${processTemplate._id}`).send(updatedProcessTemplate);
                expect(response.status).toBe(okStatus);
                expect(response.body.steps.length).toBe(updatedProcessTemplate.steps.length);
            });
            it('Should update property type, and return 200', async () => {
                const updatedProcessTemplate = prepareProcessTemplateToUpdate(processTemplate);
                const [firstPropertyKey] = Object.keys(updatedProcessTemplate.details.properties.properties);

                // Check the current type of the first property and set a new type
                const currentType = updatedProcessTemplate.details.properties.properties[firstPropertyKey].type;
                let newType: 'string' | 'boolean' | 'number' = 'boolean';
                if (currentType === 'boolean') {
                    newType = 'string';
                }

                updatedProcessTemplate.details.properties.properties[firstPropertyKey].type = newType;
                const response = await request(app).put(`/api/processes/templates/${processTemplate._id}`).send(updatedProcessTemplate);
                expect(response.status).toBe(okStatus);
                expect(response.body.details.properties.properties[firstPropertyKey].type).toBe(newType);
            });
            it('Should update the processTemplate, return it and return 200', async () => {
                const updatedProcessTemplate = prepareProcessTemplateToUpdate(processTemplate);
                const newIconFileId = `123icon_file_id.png`;
                updatedProcessTemplate.displayName = `${updatedProcessTemplate.displayName}newName`;
                updatedProcessTemplate.steps[0].iconFileId = newIconFileId;
                const response = await request(app).put(`/api/processes/templates/${processTemplate._id}`).send(updatedProcessTemplate);

                expect(response.status).toBe(okStatus);

                // Extract relevant properties from response.body and processTemplate
                const { updatedAt, steps, ...responseBodyWithoutUpdatedAt } = response.body;
                const { updatedAt: originalUpdatedAt, steps: originalSteps, ...originalProcessTemplateWithoutUpdatedAt } = processTemplate;

                // Check if the displayName property is updated correctly
                expect(responseBodyWithoutUpdatedAt).toEqual({
                    ...originalProcessTemplateWithoutUpdatedAt,
                    displayName: `${processTemplate.displayName}newName`,
                });

                // Check if updatedAt is greater than the original updatedAt
                expect(new Date(updatedAt).getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime());

                steps.forEach((step, index) => {
                    const { updatedAt: stepUpdatedAt, ...stepWithoutUpdatedAt } = step;
                    const { updatedAt: originalStepUpdatedAt, ...originalStepWithoutUpdatedAt } = originalSteps[index];

                    // Check if the step properties except updatedAt are the same
                    if (index === 0) {
                        expect(stepWithoutUpdatedAt).toEqual({
                            ...originalStepWithoutUpdatedAt,
                            iconFileId: newIconFileId,
                        });
                    } else {
                        expect({ ...stepWithoutUpdatedAt }).toEqual(originalStepWithoutUpdatedAt);
                    }

                    // Check if the step's updatedAt is greater than the original step's updatedAt
                    expect(new Date(stepUpdatedAt).getTime()).toBeGreaterThan(new Date(originalStepUpdatedAt).getTime());
                    processTemplate = response.body;
                });
            });
        });
        describe('POST /api/processes/templates/search', () => {
            it('Should return processTemplate and 200', async () => {
                const response = await request(app).post('/api/processes/templates/search').send({
                    displayName: processTemplate.displayName,
                });
                expect(response.status).toBe(okStatus);
                expect(response.body).toContainEqual(processTemplate);
            });
            it('Should return empty array and 200', async () => {
                const response = await request(app).post('/api/processes/templates/search').send({
                    displayName: 'aaaaaaaaaaaaaaaaaaaaa',
                });
                expect(response.status).toBe(okStatus);
                expect(response.body).toHaveLength(0);
            });
            it('Should check reviewer permission and return processTemplate with 200', async () => {
                const response = await request(app).post('/api/processes/templates/search').send({
                    reviewerId: processTemplate.steps[0].reviewers[0],
                });

                expect(response.status).toBe(okStatus);
                expect(response.body).toContainEqual(processTemplate);
            });
            it('Should check reviewer permission and return emptyArray with 200', async () => {
                const response = await request(app).post('/api/processes/templates/search').send({
                    reviewerId: randomMongoId(),
                });
                expect(response.status).toBe(okStatus);
                expect(response.body).toHaveLength(0);
            });
        });

        describe('DELETE /api/processes/templates/:id', () => {
            it('Should return 404', async () => {
                const response = await request(app).delete(`/api/processes/templates/${randomMongoId()}`);
                expect(response.status).toBe(notFoundStatus);
                expect(response.text).toContain('not found');
            });
            it('Should delete the processTemplate and return it with status code 200', async () => {
                const response = await request(app).delete(`/api/processes/templates/${processTemplate._id}`);
                expect(response.status).toBe(okStatus);
                expect(response.body).toStrictEqual(processTemplate);
            });
        });
    });
    describe('Instances', () => {
        beforeAll(async () => {
            const response = await request(app).post('/api/processes/templates').send(processTemplateExample1);
            processTemplate = response.body;
        });
        describe('POST /api/processes/instances', () => {
            it('Should try create instance with wrong templateId and return 404', async () => {
                const instanceToCreate = prepareDataForCreateProcessInstance({ ...processTemplate, _id: randomMongoId() }, processInstanceExample1);
                const response = await request(app).post('/api/processes/instances').send(instanceToCreate);
                expect(response.status).toBe(notFoundStatus);
                expect(response.text).toContain('not found');
                throw new ServiceError(notFoundStatus, 'Main error', { error: response.error });
            });

            it('Should try create instance with wrong stepsTemplateId and return 400', async () => {
                const { steps } = processTemplate;
                const errSteps = steps.map((step) => {
                    return {
                        ...step,
                        _id: randomMongoId(),
                    };
                });
                const instanceToCreate = prepareDataForCreateProcessInstance({ ...processTemplate, steps: errSteps }, processInstanceExample1);
                const response = await request(app).post('/api/processes/instances').send(instanceToCreate);
                expect(response.status).toBe(badRequest);
                expect(response.text).toContain('TemplateValidationError');
            });

            it('Should try create instance with wrong details properties and return 400', async () => {
                const instanceToCreate = prepareDataForCreateProcessInstance(processTemplate, {
                    ...processInstanceExample1,
                    details: errPropertiesType(processInstanceExample1.details),
                });

                const response = await request(app).post('/api/processes/instances').send(instanceToCreate);
                expect(response.status).toBe(badRequest);
                expect(response.text).toContain('TemplateValidationError');
            });

            it('Should create instance and return 200', async () => {
                const instanceToCreate = prepareDataForCreateProcessInstance(processTemplate, processInstanceExample1);
                const response = await request(app).post('/api/processes/instances').send(instanceToCreate);
                expect(response.status).toBe(okStatus);
                expect(response.body.name).toBe(instanceToCreate.name);
                processInstance = response.body;
            });

            it('Should try create the same instance and return 500 with duplicate error', async () => {
                const instanceToCreate = prepareDataForCreateProcessInstance(processTemplate, processInstanceExample1);
                const response = await request(app).post('/api/processes/instances').send(instanceToCreate);
                expect(response.status).toBe(internalServerErrorStatus);
                expect(response.text).toContain('duplicate');
            });
        });
        describe('GET /api/processes/instances/:id', () => {
            it('Should get the process instance and return 200', async () => {
                const response = await request(app).get(`/api/processes/instances/${processInstance._id}`);
                expect(response.status).toBe(okStatus);
                expect(response.body).toStrictEqual(processInstance);
            });
            it('Should return not found error with 404', async () => {
                const response = await request(app).get(`/api/processes/instances/${randomMongoId()}`);
                expect(response.status).toBe(notFoundStatus);
                expect(response.text).toContain('not found');
            });
            it('Should return validation error and 400', async () => {
                const response = await request(app).get('/api/processes/instances/1');
                expect(response.status).toBe(badRequest);
                expect(response.text).toContain('ValidationError');
            });
        });
        describe('PUT /api/processes/instances/:id', () => {
            it('Should try update details with wrong properties type, fail and return 400', async () => {
                const updatedData = prepareDataForUpdateProcessInstance(
                    { ...processInstanceExample1, details: errPropertiesType(processInstanceExample1.details) },
                    processInstance.steps,
                );
                const response = await request(app).put(`/api/processes/instances/${processInstance._id}`).send(updatedData);
                expect(response.status).toBe(badRequest);
                expect(response.text).toContain('TemplateValidationError');
            });
            it('Should try update process steps ids steps and return 404', async () => {
                const { steps } = processInstance;
                const errSteps = steps.map((step) => {
                    return {
                        ...step,
                        _id: randomMongoId(),
                    };
                });
                const updatedData = prepareDataForUpdateProcessInstance(processInstanceExample1, errSteps);
                const response = await request(app).put(`/api/processes/instances/${processInstance._id}`).send(updatedData);
                expect(response.status).toBe(notFoundStatus);
                expect(response.text).toContain('No matching step Templates found');
            });
            it('Should return updated process with 200', async () => {
                const updatedData = prepareDataForUpdateProcessInstance({ ...processInstanceExample1 }, processInstance.steps);
                const response = await request(app).put(`/api/processes/instances/${processInstance._id}`).send(updatedData);

                expect(response.status).toBe(okStatus);
                const { updatedAt, steps, ...updatedProcessInstance } = response.body as IMongoProcessInstancePopulated;
                const { updatedAt: originalUpdatedAt, steps: originalSteps, ...originalProcessWithoutUpdatedAt } = processInstance;
                expect(updatedProcessInstance).toStrictEqual(originalProcessWithoutUpdatedAt);
                expect(new Date(updatedAt).getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime());
                steps.forEach((step, index) => {
                    const { updatedAt: stepUpdatedAt, ...stepWithoutUpdatedAt } = step;
                    const { updatedAt: originalStepUpdatedAt, ...originalStepWithoutUpdatedAt } = originalSteps[index];

                    expect({ ...stepWithoutUpdatedAt }).toEqual(originalStepWithoutUpdatedAt);

                    // Check if the step's updatedAt is greater than the original step's updatedAt
                    expect(new Date(stepUpdatedAt).getTime()).toBeGreaterThan(new Date(originalStepUpdatedAt).getTime());
                    processInstance = response.body;
                });
            });
        });
        describe('POST /api/processes/instances/search', () => {
            it('Should return processInstance and 200', async () => {
                const response = await request(app).post('/api/processes/instances/search').send({
                    name: processInstance.name,
                });
                expect(response.status).toBe(okStatus);
                expect(response.body).toContainEqual(processInstance);
            });
            it('Should return empty array and 200', async () => {
                const response = await request(app).post('/api/processes/instances/search').send({
                    name: 'aaaaaaaaaaaaaaaaaaaaa',
                });
                expect(response.status).toBe(okStatus);
                expect(response.body).toHaveLength(0);
            });
            it('should check (instance) reviewer permission and processInstance in array with 200', async () => {
                const response = await request(app).post('/api/processes/instances/search').send({
                    reviewerId: processInstance.steps[0].reviewers[0],
                });
                expect(response.status).toBe(okStatus);
                expect(response.body).toContainEqual(processInstance);
            });
            it('should check (template) reviewer permission and processInstance in array with 200', async () => {
                const response = await request(app).post('/api/processes/instances/search').send({
                    reviewerId: processTemplate.steps[0].reviewers[0],
                });
                expect(response.status).toBe(okStatus);
                expect(response.body).toContainEqual(processInstance);
            });
            it('should check reviewer permission and return empty array with 200', async () => {
                const response = await request(app).post('/api/processes/instances/search').send({
                    reviewerId: randomMongoId(),
                });
                expect(response.status).toBe(okStatus);
                expect(response.body).toHaveLength(0);
            });
        });

        describe('DELETE /api/processes/instances/:id', () => {
            it('Should return 404', async () => {
                const response = await request(app).delete(`/api/processes/instances/${randomMongoId()}`);
                expect(response.status).toBe(notFoundStatus);
                expect(response.text).toContain('not found');
            });
            it('Should try delete process template and fail because it has instance, return status 400', async () => {
                const response = await request(app).delete(`/api/processes/templates/${processTemplate._id}`);

                expect(response.status).toBe(badRequest);
                expect(response.text).toContain('still has instances');
            });
            it('Should delete the process Instance and return it with status code 200, also should delete steps from steps collection', async () => {
                const response = await request(app).delete(`/api/processes/instances/${processInstance._id}`);

                expect(response.status).toBe(okStatus);
                expect(response.body).toStrictEqual(processInstance);
            });
            it('Should delete steps from steps collection', async () => {
                await Promise.all(
                    processInstance.steps.map(async ({ _id }) => {
                        const response = StepInstanceManager.getStepById(_id);
                        await expect(response).rejects.toThrowError(/not found/);
                    }),
                );
            });
            it('Delete process template return it with 200', async () => {
                const response = await request(app).delete(`/api/processes/templates/${processTemplate._id}`);
                expect(response.status).toBe(okStatus);
                expect(response.body).toStrictEqual(processTemplate);
            });
        });

        describe('Step Instance', () => {
            beforeAll(async () => {
                const { body: templateBody } = await request(app).post('/api/processes/templates').send(processTemplateExample1);
                processTemplate = templateBody;
                const instanceToCreate = prepareDataForCreateProcessInstance(processTemplate, processInstanceExample1);
                const { body: instanceBody } = await request(app).post('/api/processes/instances').send(instanceToCreate);
                processInstance = instanceBody;
            });
            describe('PATCH api/processes/instances/steps/:id', () => {
                it('Should update step properties and return it', async () => {
                    await Promise.all(
                        processInstance.steps.map(async ({ _id }, index) => {
                            const response = await request(app).patch(`/api/processes/instances/steps/${_id}`).send(stepsPropertiesExample1[index]);
                            expect(response.status).toBe(okStatus);
                            expect(response.body.properties).toStrictEqual(stepsPropertiesExample1[index].properties);
                        }),
                    );
                });
                it('Should try update error step properties and return 400', async () => {
                    await Promise.all(
                        processInstance.steps.map(async ({ _id }, index) => {
                            const response = await request(app)
                                .patch(`/api/processes/instances/steps/${_id}`)
                                .send(errStepsPropertiesExample1[index]);

                            expect(response.status).toBe(badRequest);
                            expect(response.text).toContain('TemplateValidationError');
                        }),
                    );
                });
                it('should update step status and return step with status 200', async () => {
                    for (const { _id } of processInstance.steps) {
                        const response = await request(app)
                            .patch(`/api/processes/instances/steps/${_id}`)
                            .send({
                                statusReview: {
                                    status: Status.Rejected,
                                    reviewerId: randomMongoId(),
                                    processId: processInstance._id,
                                },
                            } as unknown as UpdateStepReqBody);

                        expect(response.status).toBe(okStatus);
                        expect(response.body.status).toBe(Status.Rejected);

                        const { status: processInstanceStatus } = (await request(app).get(`/api/processes/instances/${processInstance._id}`)).body;
                        expect(processInstanceStatus).toBe(Status.Rejected);
                        throw new ServiceError(undefined, 'test error', { error: response.error });
                    }
                });
                it('should update step status and return step with status 200', async () => {
                    const comments = 'test-test-test';
                    for (const { _id } of processInstance.steps) {
                        const response = await request(app)
                            .patch(`/api/processes/instances/steps/${_id}`)
                            .send({
                                statusReview: {
                                    status: Status.Approved,
                                    reviewerId: randomMongoId(),
                                    processId: processInstance._id,
                                },
                                comments,
                            } as unknown as UpdateStepReqBody);

                        expect(response.status).toBe(okStatus);
                        expect(response.body.status).toBe(Status.Approved);
                        expect(response.body.comments).toBe(comments);
                    }
                    const { status: processInstanceStatus } = (await request(app).get(`/api/processes/instances/${processInstance._id}`)).body;
                    expect(processInstanceStatus).toBe(Status.Approved);
                });

                it('should not update step when it is not part of process', async () => {
                    const instanceToCreate = prepareDataForCreateProcessInstance(processTemplate, {
                        ...processInstanceExample1,
                        name: 'test-test',
                    });
                    const { body: instanceBody } = await request(app).post('/api/processes/instances').send(instanceToCreate);

                    for (const { _id } of processInstance.steps) {
                        const response = await request(app)
                            .patch(`/api/processes/instances/steps/${_id}`)
                            .send({
                                statusReview: {
                                    status: Status.Approved,
                                    reviewerId: randomMongoId(),
                                    processId: instanceBody._id,
                                },
                            });

                        expect(response.status).toBe(badRequest);
                        expect(response.text).toContain('not part of');
                    }
                });
            });
        });
    });
});
