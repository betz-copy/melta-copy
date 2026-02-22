import { ModuleRef } from '@nestjs/core';
import { RmqRecord } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import RabbitService from './rabbit.service';

const testQueueNames = ['test-queue-1', 'test-queue-2'];

interface MockClientRMQ {
    connect: jest.Mock;
    emit: jest.Mock;
    close: jest.Mock;
    registerDisconnectListener: undefined;
}

interface MockModuleRef {
    get: jest.Mock;
}

describe('RabbitService', () => {
    let service: RabbitService;
    let clientMock: MockClientRMQ;
    let moduleRefMock: MockModuleRef;

    beforeEach(async () => {
        clientMock = {
            connect: jest.fn().mockResolvedValue(undefined),
            emit: jest.fn().mockReturnValue({
                subscribe: jest.fn((callbacks) => {
                    if (callbacks?.next) callbacks.next();
                    return { unsubscribe: jest.fn() };
                }),
            }),
            registerDisconnectListener: undefined,
            close: jest.fn().mockResolvedValue(undefined),
        };

        moduleRefMock = {
            get: jest.fn().mockReturnValue(clientMock),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: RabbitService,
                    useFactory: (moduleRef: ModuleRef) => new RabbitService(moduleRef, testQueueNames),
                    inject: [ModuleRef],
                },
                {
                    provide: ModuleRef,
                    useValue: moduleRefMock,
                },
            ],
        }).compile();

        service = module.get<RabbitService>(RabbitService);

        service.onApplicationBootstrap();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('onApplicationBootstrap', () => {
        it('should call connect on client', () => {
            clientMock.connect.mockClear();

            service.onApplicationBootstrap();

            expect(clientMock.connect).toHaveBeenCalled();
            expect(moduleRefMock.get).toHaveBeenCalledWith(testQueueNames[0], { strict: false });
        });
    });

    describe('publishMessageToQueue', () => {
        it('should call client.emit with RmqRecord when headers are provided', () => {
            const eventName = 'testEvent';
            const payload = { key: 'value' };
            const headers = { workspaceId: 'headerValue' };

            service.publishMessageToQueue(testQueueNames[0], eventName, payload, headers);

            expect(clientMock.emit).toHaveBeenCalledWith(eventName, expect.any(RmqRecord));

            const emitCall = clientMock.emit.mock.calls[0];
            const messageArg = emitCall[1];

            expect(messageArg.data).toEqual(payload);
            expect(messageArg.options.headers).toEqual(headers);
            expect(clientMock.emit(eventName, messageArg).subscribe).toHaveBeenCalled();
        });

        it('should call client.emit with payload directly when headers are not provided', () => {
            const eventName = 'testEvent';
            const payload = { key: 'value' };

            service.publishMessageToQueue(testQueueNames[0], eventName, payload);

            expect(clientMock.emit).toHaveBeenCalledWith(eventName, payload);
            expect(clientMock.emit(eventName, payload).subscribe).toHaveBeenCalled();
        });
    });
});
