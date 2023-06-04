import * as request from 'supertest';
import * as mongoose from 'mongoose';
import { Express } from 'express';
import config from '../src/config';
import Server from '../src/express/server';
import processTemplateExample1 from './mock/templates';
import { IMongoProcessTemplatePopulated } from '../src/express/templates/processes/interface';
import {
    CreateProcessReqBody,
    IMongoProcessInstancePopulated,
    IProcessInstance,
    Status,
    UpdateProcessReqBody,
} from '../src/express/instances/processes/interface';
import processInstanceExample1, { errStepsPropertiesExample1, stepsPropertiesExample1 } from './mock/instances';
import { IMongoStepInstance } from '../src/express/instances/steps/interface';
import StepInstanceManager from '../src/express/instances/steps/manager';

const { mongo } = config;

const randomMongoId = () => {
    return String(new mongoose.Types.ObjectId());
};
const removeAllCollections = async () => {
    const collections = Object.keys(mongoose.connection.collections);

    // eslint-disable-next-line no-restricted-syntax
    for (const collectionName of collections) {
        const collection = mongoose.connection.collections[collectionName];
        // eslint-disable-next-line no-await-in-loop
        await collection.deleteMany({});
    }
};

const prepareProcessTemplateToUpdate = (processTemplate: IMongoProcessTemplatePopulated) => {
    const { _id, createdAt: processCreatedAt, updatedAt: processUpdatedAt, ...cleanTemplateProcess } = JSON.parse(JSON.stringify(processTemplate));
    const cleanSteps = cleanTemplateProcess.steps.map((step) => {
        const { createdAt, updatedAt, ...cleanStep } = step;
        return cleanStep;
    });
    return { ...cleanTemplateProcess, steps: cleanSteps };
};

const prepareDataForCreateProcessInstance = (
    processTemplate: IMongoProcessTemplatePopulated,
    processInstanceData: Pick<IProcessInstance, 'name' | 'details'>,
): CreateProcessReqBody => {
    return {
        templateId: processTemplate._id,
        name: processInstanceData.name,
        details: processInstanceData.details,
        steps: processTemplate.steps.reduce((acc, obj) => {
            acc[obj._id] = [];
            return acc;
        }, {}),
    };
};

const prepareDataForUpdateProcessInstance = (
    processInstanceData: Partial<Pick<Omit<IProcessInstance, 'templateId' | 'steps'>, 'status'>> &
        Omit<IProcessInstance, 'templateId' | 'steps' | 'status'>,
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
    if (processInstanceData.status) updateData.status = processInstanceData.status;
    if (processInstanceData.reviewerId) updateData.reviewerId = processInstanceData.reviewerId;
    if (processInstanceData.summaryDetails) updateData.summaryDetails = processInstanceData.summaryDetails;
    return updateData;
};
const errPropertiesType = (instanceProperties: Record<string, any>): Record<string, any> => {
    return Object.entries(instanceProperties).reduce((acc, [key, value]) => {
        let newValue;

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
        await mongoose.connect(mongo.uri);
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
                expect(response.status).toBe(200);
                expect(response.text).toBe('alive');
            });
        });

        describe('/Invalid Route', () => {
            it('Should return 404 and "Invalid Route"', async () => {
                const response = await request(app).get('/invalid-route');
                expect(response.status).toBe(404);
                expect(response.text).toBe('Invalid Route');
            });
        });
    });
    describe('Templates', () => {
        describe('POST /api/processes/templates', () => {
            it('Should create a new process template and return 200', async () => {
                const response = await request(app).post('/api/processes/templates').send(processTemplateExample1);
                expect(response.status).toBe(200);
                processTemplate = response.body;
                expect(processTemplate.name).toEqual(processTemplateExample1.name);
                expect(processTemplate.displayName).toEqual(processTemplateExample1.displayName);
            });
            it('Should try create a new process template and return 500 because duplicate error', async () => {
                const response = await request(app).post('/api/processes/templates').send(processTemplateExample1);
                expect(response.status).toBe(500);
                expect(response.text).toContain('duplicate');
            });
            it('Should try create a new process template and return 500 because duplicate error', async () => {
                const response = await request(app)
                    .post('/api/processes/templates')
                    .send({ ...processTemplateExample1, name: 'ChangeChange' });
                // also need to fail because of steps name duplicate
                expect(response.status).toBe(500);
                expect(response.text).toContain('duplicate');
            });
        });

        describe('GET /api/processes/templates/:id', () => {
            it('Should return 200 and the process template', async () => {
                const response = await request(app).get(`/api/processes/templates/${processTemplate._id}`);
                expect(response.status).toBe(200);
                expect(response.body).toEqual(processTemplate);
            });
        });

        describe('PUT /api/processes/templates/:id', () => {
            it('Should return validation error', async () => {
                const response = await request(app).put('/api/processes/templates/1').send({});
                expect(response.status).toBe(400);
            });

            it('Should try update the process template with wrong body, fail and return 400', async () => {
                const response = await request(app).put(`/api/processes/templates/${processTemplate._id}`).send(processTemplate);
                expect(response.status).toBe(400);
                expect(response.text).toContain('is not allowed');
            });

            it('Should try update the process template name, fail and return 400', async () => {
                const errTemplateProcess = prepareProcessTemplateToUpdate(processTemplate);
                errTemplateProcess.name = `${errTemplateProcess.name}change`;
                const response = await request(app).put(`/api/processes/templates/${processTemplate._id}`).send(errTemplateProcess);
                expect(response.status).toBe(400);
                expect(response.text).toContain('can not change step template name');
            });

            it('Should try update the step template name, fail and return 400', async () => {
                const errTemplateProcess = prepareProcessTemplateToUpdate(processTemplate);
                errTemplateProcess.steps[0].name = `${errTemplateProcess.steps[0].name}change`;
                const response = await request(app).put(`/api/processes/templates/${processTemplate._id}`).send(errTemplateProcess);
                expect(response.status).toBe(400);
                expect(response.text).toContain('can not change step[0] name');
            });

            it('Should try update the process template and modify steps length, fail and return 400', async () => {
                const errTemplateProcess = prepareProcessTemplateToUpdate(processTemplate);
                errTemplateProcess.steps = errTemplateProcess.steps.splice(1, 1);
                const response = await request(app).put(`/api/processes/templates/${processTemplate._id}`).send(errTemplateProcess);
                expect(response.status).toBe(400);
                expect(response.text).toContain('can not delete or add steps');
            });
            it('Should try update property type, fail and return 400', async () => {
                const errTemplateProcess = prepareProcessTemplateToUpdate(processTemplate);
                const [firstPropertyKey] = Object.keys(errTemplateProcess.details.properties.properties);

                // Check the current type of the first property and set a new type
                const currentType = errTemplateProcess.details.properties.properties[firstPropertyKey].type;
                let newType: 'string' | 'boolean' | 'number' = 'boolean';
                if (currentType === 'boolean') {
                    newType = 'string';
                }

                errTemplateProcess.details.properties.properties[firstPropertyKey].type = newType;
                const response = await request(app).put(`/api/processes/templates/${processTemplate._id}`).send(errTemplateProcess);
                expect(response.status).toBe(400);
                expect(response.text).toContain('can not change property type');
            });
            it('Should return update the processTemplate, return it and return 200', async () => {
                const updatedProcessTemplate = prepareProcessTemplateToUpdate(processTemplate);
                const newIconFileId = `123icon_file_id.png`;
                updatedProcessTemplate.displayName = `${updatedProcessTemplate.displayName}newName`;
                updatedProcessTemplate.steps[0].iconFileId = newIconFileId;
                const response = await request(app).put(`/api/processes/templates/${processTemplate._id}`).send(updatedProcessTemplate);

                expect(response.status).toBe(200);

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
                expect(response.status).toBe(200);
                expect(response.body).toContainEqual(processTemplate);
            });
            it('Should return empty array and 200', async () => {
                const response = await request(app).post('/api/processes/templates/search').send({
                    displayName: 'aaaaaaaaaaaaaaaaaaaaa',
                });
                expect(response.status).toBe(200);
                expect(response.body).toHaveLength(0);
            });
        });

        describe('DELETE /api/processes/templates/:id', () => {
            it('Should return 404', async () => {
                const response = await request(app).delete(`/api/processes/templates/${randomMongoId()}`);
                expect(response.status).toBe(404);
                expect(response.text).toContain('not found');
            });
            it('Should delete the processTemplate and return it with status code 200', async () => {
                const response = await request(app).delete(`/api/processes/templates/${processTemplate._id}`);
                expect(response.status).toBe(200);
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
                expect(response.status).toBe(404);
                expect(response.text).toContain('not found');
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
                expect(response.status).toBe(400);
                expect(response.text).toContain('TemplateValidationError');
            });

            it('Should try create instance with wrong details properties and return 400', async () => {
                const instanceToCreate = prepareDataForCreateProcessInstance(processTemplate, {
                    ...processInstanceExample1,
                    details: errPropertiesType(processInstanceExample1.details),
                });

                const response = await request(app).post('/api/processes/instances').send(instanceToCreate);
                expect(response.status).toBe(400);
                expect(response.text).toContain('TemplateValidationError');
            });

            it('Should create instance and return 200', async () => {
                const instanceToCreate = prepareDataForCreateProcessInstance(processTemplate, processInstanceExample1);
                const response = await request(app).post('/api/processes/instances').send(instanceToCreate);
                expect(response.status).toBe(200);
                expect(response.body.name).toBe(instanceToCreate.name);
                processInstance = response.body;
            });

            it('Should try create the same instance and return 500 with duplicate error', async () => {
                const instanceToCreate = prepareDataForCreateProcessInstance(processTemplate, processInstanceExample1);
                const response = await request(app).post('/api/processes/instances').send(instanceToCreate);
                expect(response.status).toBe(500);
                expect(response.text).toContain('duplicate');
            });
        });
        describe('GET /api/processes/instances/:id', () => {
            it('Should get the process instance and return 200', async () => {
                const response = await request(app).get(`/api/processes/instances/${processInstance._id}`);
                expect(response.status).toBe(200);
                expect(response.body).toStrictEqual(processInstance);
            });
            it('Should return not found error with 404', async () => {
                const response = await request(app).get(`/api/processes/instances/${randomMongoId()}`);
                expect(response.status).toBe(404);
                expect(response.text).toContain('not found');
            });
            it('Should return validation error and 400', async () => {
                const response = await request(app).get('/api/processes/instances/1');
                expect(response.status).toBe(400);
                expect(response.text).toContain('ValidationError');
            });
        });
        describe('PUT /api/processes/instances/:id', () => {
            it('Should try update summaryDetails with wrong properties type, fail and return 400', async () => {
                const updatedData = prepareDataForUpdateProcessInstance(
                    { ...processInstanceExample1, summaryDetails: errPropertiesType(processInstanceExample1.summaryDetails) },
                    processInstance.steps,
                );
                const response = await request(app).put(`/api/processes/instances/${processInstance._id}`).send(updatedData);
                expect(response.status).toBe(400);
                expect(response.text).toContain('TemplateValidationError');
            });
            it('Should try update details with wrong properties type, fail and return 400', async () => {
                const updatedData = prepareDataForUpdateProcessInstance(
                    { ...processInstanceExample1, details: errPropertiesType(processInstanceExample1.details) },
                    processInstance.steps,
                );
                const response = await request(app).put(`/api/processes/instances/${processInstance._id}`).send(updatedData);
                expect(response.status).toBe(400);
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
                expect(response.status).toBe(404);
                expect(response.text).toContain('No matching step Templates found');
            });
            it('Should try update status without send reviewerId, fail and return 400', async () => {
                const updatedData = prepareDataForUpdateProcessInstance(
                    { ...processInstanceExample1, status: Status.Rejected },
                    processInstance.steps,
                );
                const response = await request(app).put(`/api/processes/instances/${processInstance._id}`).send(updatedData);
                expect(response.status).toBe(400);
                expect(response.text).toContain('ValidationError');
            });
            it('Should return updated process with 200', async () => {
                const updatedData = prepareDataForUpdateProcessInstance(
                    { ...processInstanceExample1, status: Status.Rejected, reviewerId: randomMongoId() },
                    processInstance.steps,
                );
                const timeBeforeUpdate = new Date();
                const response = await request(app).put(`/api/processes/instances/${processInstance._id}`).send(updatedData);
                expect(response.status).toBe(200);
                const { reviewerId, summaryDetails, status, updatedAt, steps, reviewedAt, ...updatedProcessInstance } =
                    response.body as IMongoProcessInstancePopulated;
                const {
                    status: originalStatus,
                    updatedAt: originalUpdatedAt,
                    steps: originalSteps,
                    ...originalProcessWithoutUpdatedAt
                } = processInstance;
                expect(updatedProcessInstance).toStrictEqual(originalProcessWithoutUpdatedAt);
                expect(new Date(updatedAt).getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime());
                expect(new Date(reviewedAt!).getTime()).toBeGreaterThan(timeBeforeUpdate.getTime());
                steps.forEach((step, index) => {
                    const { updatedAt: stepUpdatedAt, reviewers: updatedReviewers, ...stepWithoutUpdatedAt } = step;
                    const { updatedAt: originalStepUpdatedAt, reviewers: originalReviewers, ...originalStepWithoutUpdatedAt } = originalSteps[index];

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
                expect(response.status).toBe(200);
                expect(response.body).toContainEqual(processInstance);
            });
            it('Should return empty array and 200', async () => {
                const response = await request(app).post('/api/processes/instances/search').send({
                    name: 'aaaaaaaaaaaaaaaaaaaaa',
                });
                expect(response.status).toBe(200);
                expect(response.body).toHaveLength(0);
            });
        });

        describe('DELETE /api/processes/instances/:id', () => {
            it('Should return 404', async () => {
                const response = await request(app).delete(`/api/processes/instances/${randomMongoId()}`);
                expect(response.status).toBe(404);
                expect(response.text).toContain('not found');
            });
            it('Should try delete process template and fail because it has instance, return status 400', async () => {
                const response = await request(app).delete(`/api/processes/templates/${processTemplate._id}`);

                expect(response.status).toBe(400);
                expect(response.text).toContain('still has instances');
            });
            it('Should delete the process Instance and return it with status code 200, also should delete steps from steps collection', async () => {
                const response = await request(app).delete(`/api/processes/instances/${processInstance._id}`);

                expect(response.status).toBe(200);
                expect(response.body).toStrictEqual(processInstance);
            });
            it('Should delete steps from steps collection', async () => {
                await Promise.all(
                    processInstance.steps.map(async ({ _id }) => {
                        const response = StepInstanceManager.getStepById(_id);
                        await expect(response).rejects.toThrowError(new RegExp('not found'));
                    }),
                );
            });
            it('Delete process template return it with 200', async () => {
                const response = await request(app).delete(`/api/processes/templates/${processTemplate._id}`);
                expect(response.status).toBe(200);
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
            describe('/ PATCH api/processes/instances/steps/:id/properties', () => {
                it('Should update step properties and return it', async () => {
                    await Promise.all(
                        processInstance.steps.map(async ({ _id }, index) => {
                            const response = await request(app)
                                .patch(`/api/processes/instances/steps/${_id}/properties`)
                                .send(stepsPropertiesExample1[index]);
                            expect(response.status).toBe(200);
                            expect(response.body.properties).toStrictEqual(stepsPropertiesExample1[index].properties);
                        }),
                    );
                });
                it('Should try update error step properties and return 400', async () => {
                    await Promise.all(
                        processInstance.steps.map(async ({ _id }, index) => {
                            const response = await request(app)
                                .patch(`/api/processes/instances/steps/${_id}/properties`)
                                .send(errStepsPropertiesExample1[index]);

                            expect(response.status).toBe(400);
                            expect(response.text).toContain('TemplateValidationError');
                        }),
                    );
                });
                describe('/ PATCH api/processes/instances/steps/:id/status', () => {
                    it('should update step status and return step with status 200', async () => {
                        await Promise.all(
                            processInstance.steps.map(async ({ _id }) => {
                                const response = await request(app).patch(`/api/processes/instances/steps/${_id}/status`).send({
                                    status: Status.Rejected,
                                    reviewerId: randomMongoId(),
                                    processId: processInstance._id,
                                });

                                expect(response.status).toBe(200);
                                expect(response.body.status).toBe(Status.Rejected);
                            }),
                        );
                    });
                    it('should update step status and return step with status 200', async () => {
                        await Promise.all(
                            processInstance.steps.map(async ({ _id }) => {
                                const response = await request(app).patch(`/api/processes/instances/steps/${_id}/status`).send({
                                    status: Status.Approved,
                                    processId: processInstance._id,
                                });

                                expect(response.status).toBe(400);
                                expect(response.text).toContain('reviewerId');
                            }),
                        );
                    });
                    it('should not update step when it is not part of process', async () => {
                        const instanceToCreate = prepareDataForCreateProcessInstance(processTemplate, {
                            ...processInstanceExample1,
                            name: 'test-test',
                        });
                        const { body: instanceBody } = await request(app).post('/api/processes/instances').send(instanceToCreate);

                        await Promise.all(
                            processInstance.steps.map(async ({ _id }) => {
                                const response = await request(app).patch(`/api/processes/instances/steps/${_id}/status`).send({
                                    status: Status.Approved,
                                    reviewerId: randomMongoId(),
                                    processId: instanceBody._id,
                                });

                                expect(response.status).toBe(400);
                                expect(response.text).toContain('not part of');
                            }),
                        );
                    });
                });
            });
        });
    });
});
