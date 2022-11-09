import { APIGatewayProxyEvent, Context } from 'aws-lambda';

import { Sindry } from "./sindry.class";
import { broadcastMessage } from './symbols'
import { errorSerializer } from './serializer'
import { ITransporter, ITransporterOptions } from './interfaces'
import { LEVELS } from './enum'

export class Transporter implements ITransporter {
    private transporter: any;
    private externalTransporterOptions: any;
    private MAX_EVENT_FIRED: number = 5;
    private EVENT_FIRED: number = 0;

    constructor(private sindry: Sindry, public options: ITransporterOptions = { level: '' }) {
        const _levels = Object.values(LEVELS)

        if (!_levels.includes(options.level.toUpperCase())) {
            throw new Error(`The level ${options.level} is not present in the levels enum`)
        }

        errorSerializer();
        this.listen();
    }

    /**
     * > The `listen` function listens for the `broadcastMessage` event and if the `level` option is
     * equal to the `level` property of the `data` object, then it increments the `EVENT_FIRED`
     * property and calls the `broadcast` function of the `transporter` class
     */
    private listen(): void {
        this.sindry.on(broadcastMessage, async (data) => {
            const errorLevel = this.options.level

            if (errorLevel.toUpperCase() === LEVELS[data.level] || !errorLevel) {
                ++this.EVENT_FIRED

                try {
                    if (this.EVENT_FIRED < this.MAX_EVENT_FIRED) {
                        await new this.transporter().broadcast.call(this)
                    }
                } catch (error) {
                    console.error('TRANSPORTER ERROR =>', error)
                    this.sindry.error(error, 'Transporter ERROR')
                }
            }
        })
    }

    public register(externalTransporter: any, externalTransporterOptions = {}) {
        this.externalTransporterOptions = externalTransporterOptions;
        this.transporter = externalTransporter;
    }
}