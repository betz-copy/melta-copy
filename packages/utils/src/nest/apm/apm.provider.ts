import { Provider } from '@nestjs/common';
import apm from 'elastic-apm-node';

export const APM_AGENT = Symbol('APM_AGENT');

export type ApmAgent = typeof apm;

export const apmAgentProvider: Provider<ApmAgent> = {
    provide: APM_AGENT,
    useValue: apm,
};
