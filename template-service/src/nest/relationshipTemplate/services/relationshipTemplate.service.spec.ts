import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { ClsService, MongoModelFactory } from '@packages/utils';
import { RelationshipTemplateService } from './relationshipTemplate.service';

describe('RelationshipTemplateService', () => {
    let service: RelationshipTemplateService;
    let mockModel: any;

    beforeEach(async () => {
        mockModel = {
            find: jest.fn().mockReturnThis(),
            findById: jest.fn().mockReturnThis(),
            findByIdAndUpdate: jest.fn().mockReturnThis(),
            findByIdAndDelete: jest.fn().mockReturnThis(),
            deleteMany: jest.fn().mockReturnThis(),
            create: jest.fn(),
            lean: jest.fn().mockReturnThis(),
            exec: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RelationshipTemplateService,
                { provide: getConnectionToken(), useValue: { model: jest.fn().mockReturnValue(mockModel) } },
                { provide: ClsService, useValue: { get: jest.fn(), set: jest.fn() } },
                { provide: MongoModelFactory, useValue: { getModel: jest.fn().mockReturnValue(mockModel) } },
            ],
        }).compile();

        service = module.get<RelationshipTemplateService>(RelationshipTemplateService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
