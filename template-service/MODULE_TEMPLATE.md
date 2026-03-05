# Module Creation Template

Use this template to quickly create new modules following the established pattern.

## Quick Start

Replace `{ModuleName}` with your module name (e.g., `EntityTemplate`, `Rule`, etc.)

### 1. Create Directory Structure

```bash
mkdir -p src/nest/{moduleName}/{controllers,services,dto,schemas}
```

### 2. Schema Template

**File: `src/nest/{moduleName}/schemas/{moduleName}.schema.ts`**

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

export type {ModuleName}Document = HydratedDocument<{ModuleName}>;

@Schema({ timestamps: true, versionKey: false })
export class {ModuleName} {
    @ApiProperty({ example: 'example_value' })
    @Prop({ required: true })
    fieldName: string;

    // Add more fields here
}

export const {ModuleName}Schema = SchemaFactory.createForClass({ModuleName});

// Add indexes
{ModuleName}Schema.index({ fieldName: 1 });
```

### 3. DTO Template

**File: `src/nest/{moduleName}/dto/{moduleName}.dto.ts`**

```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Base schema
export const {ModuleName}Schema = z.object({
    fieldName: z.string().min(1),
    // Add more fields
});

// Create DTO
export class Create{ModuleName}Dto extends createZodDto(
    {ModuleName}Schema.pick({ fieldName: true })
) {}

// Update DTO
export class Update{ModuleName}Dto extends createZodDto(
    {ModuleName}Schema.partial()
) {}

// Query DTO
export const Get{ModuleName}QuerySchema = z.object({
    search: z.string().optional(),
    limit: z.coerce.number().default(10),
    skip: z.coerce.number().default(0),
});

export class Get{ModuleName}QueryDto extends createZodDto(Get{ModuleName}QuerySchema) {}
```

### 4. Service Template

**File: `src/nest/{moduleName}/services/{moduleName}.service.ts`**

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ClsService, DefaultMongoService, MongoModelFactory } from '@packages/utils';
import { Connection } from 'mongoose';
import config from '../../../config';
import { Create{ModuleName}Dto, Update{ModuleName}Dto } from '../dto/{moduleName}.dto';
import { {ModuleName}, {ModuleName}Schema } from '../schemas/{moduleName}.schema';

@Injectable()
export class {ModuleName}Service extends DefaultMongoService<{ModuleName}> {
    constructor(
        @InjectConnection() connection: Connection,
        cls: ClsService,
        mongoModelFactory: MongoModelFactory,
    ) {
        super(
            connection,
            cls,
            config.mongo.{collectionName},
            {ModuleName}Schema,
            mongoModelFactory,
            {ModuleName}.name
        );
    }

    async getAll(search?: string) {
        const query = search ? { name: { $regex: search, $options: 'i' } } : {};
        return this.model.find(query).lean().exec();
    }

    async getById(id: string) {
        const item = await this.model.findById(id).lean().exec();
        if (!item) {
            throw new NotFoundException(`{ModuleName} with ID ${id} not found`);
        }
        return item;
    }

    async create(data: Create{ModuleName}Dto) {
        const item = await this.model.create(data);
        return item.toObject();
    }

    async update(id: string, data: Update{ModuleName}Dto) {
        const item = await this.model.findByIdAndUpdate(id, data, { new: true }).lean().exec();
        if (!item) {
            throw new NotFoundException(`{ModuleName} with ID ${id} not found`);
        }
        return item;
    }

    async delete(id: string) {
        const item = await this.model.findByIdAndDelete(id).lean().exec();
        if (!item) {
            throw new NotFoundException(`{ModuleName} with ID ${id} not found`);
        }
        return item;
    }
}
```

### 5. Controller Template

**File: `src/nest/{moduleName}/controllers/{moduleName}.controller.ts`**

```typescript
import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { Create{ModuleName}Dto, Get{ModuleName}QueryDto, Update{ModuleName}Dto } from '../dto/{moduleName}.dto';
import { {ModuleName} } from '../schemas/{moduleName}.schema';
import { {ModuleName}Service } from '../services/{moduleName}.service';
import {
    ApiGetAll{ModuleName}s,
    ApiGet{ModuleName}ById,
    ApiCreate{ModuleName},
    ApiUpdate{ModuleName},
    ApiDelete{ModuleName}
} from './{moduleName}.swagger';

@ApiTags('{Module Name}')
@ApiExtraModels({ModuleName})
@Controller('api/{module-path}')
export class {ModuleName}Controller {
    constructor(private readonly service: {ModuleName}Service) {}

    @Get()
    @ApiGetAll{ModuleName}s()
    async getAll(@Query() query: Get{ModuleName}QueryDto) {
        return this.service.getAll(query.search);
    }

    @Get(':id')
    @ApiGet{ModuleName}ById()
    async getById(@Param('id') id: string) {
        return this.service.getById(id);
    }

    @Post()
    @ApiCreate{ModuleName}()
    async create(@Body() dto: Create{ModuleName}Dto) {
        return this.service.create(dto);
    }

    @Put(':id')
    @ApiUpdate{ModuleName}()
    async update(@Param('id') id: string, @Body() dto: Update{ModuleName}Dto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    @ApiDelete{ModuleName}()
    async delete(@Param('id') id: string) {
        return this.service.delete(id);
    }
}
```

### 6. Swagger Template

**File: `src/nest/{moduleName}/controllers/{moduleName}.swagger.ts`**

```typescript
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { {ModuleName} } from '../schemas/{moduleName}.schema';

export const ApiGetAll{ModuleName}s = () =>
    applyDecorators(
        ApiOperation({ summary: 'Get all {module names}' }),
        ApiQuery({ name: 'search', required: false, type: String }),
        ApiResponse({ status: 200, description: 'List of {module names}', type: [{ModuleName}] }),
    );

export const ApiGet{ModuleName}ById = () =>
    applyDecorators(
        ApiOperation({ summary: 'Get {module name} by ID' }),
        ApiParam({ name: 'id', description: 'MongoDB ObjectId' }),
        ApiResponse({ status: 200, description: '{Module name} found', type: {ModuleName} }),
        ApiResponse({ status: 404, description: 'Not found' }),
    );

export const ApiCreate{ModuleName} = () =>
    applyDecorators(
        ApiOperation({ summary: 'Create new {module name}' }),
        ApiResponse({ status: 201, description: 'Created successfully', type: {ModuleName} }),
        ApiResponse({ status: 400, description: 'Invalid input' }),
    );

export const ApiUpdate{ModuleName} = () =>
    applyDecorators(
        ApiOperation({ summary: 'Update {module name}' }),
        ApiParam({ name: 'id', description: 'MongoDB ObjectId' }),
        ApiResponse({ status: 200, description: 'Updated successfully', type: {ModuleName} }),
        ApiResponse({ status: 404, description: 'Not found' }),
    );

export const ApiDelete{ModuleName} = () =>
    applyDecorators(
        ApiOperation({ summary: 'Delete {module name}' }),
        ApiParam({ name: 'id', description: 'MongoDB ObjectId' }),
        ApiResponse({ status: 200, description: 'Deleted successfully', type: {ModuleName} }),
        ApiResponse({ status: 404, description: 'Not found' }),
    );
```

### 7. Module Template

**File: `src/nest/{moduleName}/{moduleName}.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { MongoModelFactory } from '@packages/utils';
import { {ModuleName}Controller } from './controllers/{moduleName}.controller';
import { {ModuleName}Service } from './services/{moduleName}.service';

@Module({
    imports: [], // Add dependent modules here
    controllers: [{ModuleName}Controller],
    providers: [{ModuleName}Service, MongoModelFactory],
    exports: [{ModuleName}Service],
})
export class {ModuleName}Module {}
```

### 8. Test Template

**File: `src/nest/{moduleName}/services/{moduleName}.service.spec.ts`**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Connection, Model } from 'mongoose';
import { ClsService, MongoModelFactory } from '@packages/utils';
import { {ModuleName}Service } from './{moduleName}.service';
import { Create{ModuleName}Dto } from '../dto/{moduleName}.dto';

describe('{ModuleName}Service', () => {
    let service: {ModuleName}Service;
    let mockModel: Partial<Model<any>>;
    let mockConnection: Partial<Connection>;
    let mockClsService: Partial<ClsService>;
    let mockMongoModelFactory: Partial<MongoModelFactory>;

    beforeEach(async () => {
        mockModel = {
            find: jest.fn().mockReturnThis(),
            findById: jest.fn().mockReturnThis(),
            findByIdAndUpdate: jest.fn().mockReturnThis(),
            findByIdAndDelete: jest.fn().mockReturnThis(),
            create: jest.fn(),
            lean: jest.fn().mockReturnThis(),
            exec: jest.fn(),
        };

        mockConnection = {
            model: jest.fn().mockReturnValue(mockModel),
        };

        mockClsService = {
            get: jest.fn(),
            set: jest.fn(),
        };

        mockMongoModelFactory = {
            getModel: jest.fn().mockReturnValue(mockModel),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {ModuleName}Service,
                { provide: getConnectionToken(), useValue: mockConnection },
                { provide: ClsService, useValue: mockClsService },
                { provide: MongoModelFactory, useValue: mockMongoModelFactory },
            ],
        }).compile();

        service = module.get<{ModuleName}Service>({ModuleName}Service);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getAll', () => {
        it('should return all items', async () => {
            const mockItems = [{ _id: '1', name: 'test' }];
            (mockModel.exec as jest.Mock).mockResolvedValue(mockItems);

            const result = await service.getAll();

            expect(mockModel.find).toHaveBeenCalledWith({});
            expect(result).toEqual(mockItems);
        });
    });

    describe('create', () => {
        it('should create an item', async () => {
            const dto: Create{ModuleName}Dto = { /* fill data */ };
            const mockCreated = {
                _id: '1',
                ...dto,
                toObject: jest.fn().mockReturnValue({ _id: '1', ...dto }),
            };

            (mockModel.create as jest.Mock).mockResolvedValue(mockCreated);

            const result = await service.create(dto);

            expect(mockModel.create).toHaveBeenCalledWith(dto);
            expect(result).toBeDefined();
        });
    });

    // Add more tests...
});
```

### 9. Update app.module.ts

```typescript
import { {ModuleName}Module } from './nest/{moduleName}/{moduleName}.module';

@Module({
    imports: [
        // ... existing modules
        {ModuleName}Module,
    ],
})
export class AppModule {}
```

### 10. Update config if needed

If your module needs a new collection, add to `src/config/index.ts`:

```typescript
mongo: {
    {collectionName}: env.get('MONGO_{COLLECTION_NAME}').required().asString(),
}
```

And add to environment variables:
```bash
MONGO_{COLLECTION_NAME}=collection-name
```

## Checklist

- [ ] Created directory structure
- [ ] Implemented Schema with @Prop decorators and indexes
- [ ] Created Zod DTOs (Create, Update, Query)
- [ ] Implemented Service extending DefaultMongoService
- [ ] Created Controller with all CRUD routes
- [ ] Added Swagger decorators
- [ ] Created Module and exported Service
- [ ] Written unit tests with >80% coverage
- [ ] Updated app.module.ts
- [ ] Updated config if needed
- [ ] Tested via Swagger UI
- [ ] Verified integration with dependent modules

## Common Patterns

### Pagination

```typescript
async getAll(limit: number = 10, skip: number = 0) {
    return this.model.find().limit(limit).skip(skip).lean().exec();
}
```

### Population (Mongoose relations)

```typescript
async getById(id: string) {
    return this.model
        .findById(id)
        .populate('category')
        .lean()
        .exec();
}
```

### Transactions

```typescript
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

async updateWithTransaction(id: string, data: any) {
    const session = await this.connection.startSession();
    session.startTransaction();
    
    try {
        const result = await this.model.findByIdAndUpdate(id, data, { session, new: true }).exec();
        await session.commitTransaction();
        return result;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}
```

### RabbitMQ Consumer

If your module needs to consume messages:

**File: `src/nest/{moduleName}/messaging/{moduleName}.consumer.ts`**

```typescript
import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { ClsService } from '@packages/utils';
import * as amqp from 'amqplib';
import config from '../../../config';
import { {ModuleName}Service } from '../services/{moduleName}.service';

@Controller()
export class {ModuleName}Consumer {
    constructor(
        private readonly cls: ClsService,
        private readonly service: {ModuleName}Service,
    ) {}

    @EventPattern(config.rabbit.queues.{queueName})
    async handle(@Payload() data: unknown, @Ctx() ctx: RmqContext) {
        const channel = ctx.getChannelRef() as amqp.Channel;
        const msg = ctx.getMessage() as amqp.Message;

        try {
            // Process message
            await this.service.processMessage(data);
            channel.ack(msg);
        } catch (err) {
            channel.nack(msg, false, false);
        }
    }
}
```

Don't forget to add the consumer to your module:

```typescript
@Module({
    controllers: [{ModuleName}Controller, {ModuleName}Consumer],
    // ...
})
```
