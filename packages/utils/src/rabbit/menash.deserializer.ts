import { Deserializer } from '@nestjs/microservices';

type IncomingPacket = {
    pattern?: unknown;
    data?: unknown;
    id?: string;
};

// TODO: once all services that use rabbit migrate, remove this
// This was created because menashmq is a stupid lib so the event patterns were not being processed by the nest consumer

class RmqDeserializer implements Deserializer<unknown, IncomingPacket> {
    constructor(private readonly fallbackPattern: string) {}

    deserialize(value: unknown, options?: Record<string, unknown>) {
        const packet = this.isNestPacket(value) ? (value as IncomingPacket) : this.mapToSchema(value, options);

        if (packet?.pattern !== undefined) {
            return packet;
        }

        return {
            id: packet?.id,
            pattern: this.fallbackPattern,
            data: packet?.data ?? value,
        };
    }

    private isNestPacket(value: unknown): value is IncomingPacket {
        if (!value) return false;
        const packet = value as IncomingPacket;
        return packet.pattern !== undefined || packet.data !== undefined;
    }

    private mapToSchema(value: unknown, options?: Record<string, unknown>): IncomingPacket {
        if (!options) {
            return { pattern: undefined, data: undefined };
        }
        return {
            pattern: (options as { channel?: unknown }).channel,
            data: value,
        };
    }
}

export default RmqDeserializer;
