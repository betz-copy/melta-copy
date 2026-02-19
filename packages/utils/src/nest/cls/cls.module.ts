import { Global, Module } from '@nestjs/common';
import { Request } from 'express';
import { ClsModule } from 'nestjs-cls';
import { v4 as uuid } from 'uuid';
import config from '../../config';

@Global()
@Module({
    imports: [
        ClsModule.forRoot({
            global: true,
            middleware: {
                mount: true,
                idGenerator: (req: Request) => (req.headers[config.requestHeaders.correlationIdHeader] as string | null) ?? uuid(),
            },
        }),
    ],
    exports: [ClsModule],
})
class AppClsModule {}

export default AppClsModule;
