import { APIGatewayProxyEvent, Context } from 'aws-lambda';

import { Sindry } from "./sindry.class";
import { broadcastMessage } from './symbols'
import { errorSerializer } from './serializer'
import { ITransporter, ITransporterOptions } from './interfaces'
import { LEVELS } from './enum'
import { writer } from './writer'

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
     * The function listens for the broadcastMessage event, and when it's fired, it checks if the error
     * level is the same as the one specified in the options, and if it is, it increments the
     * EVENT_FIRED variable, and if it's less than the MAX_EVENT_FIRED, it calls the transporter
     * function
     */
    private listen(): void {
        this.sindry.on(broadcastMessage, async (data) => {
            const errorLevel = this.options.level

            if (errorLevel.toUpperCase() === LEVELS[data.level] || !errorLevel) {
                ++this.EVENT_FIRED

                try {
                    if (this.EVENT_FIRED < this.MAX_EVENT_FIRED) {
                        if (this.isConstructor(this.transporter)) {
                            await new this.transporter().broadcast.call(this)
                        } else {
                            writer('---------------------------------------------------------------------------------------------------------------')
                            writer('The funcion or class for to be used as transport layer, is not a constructor \n' + this.transporter)
                            writer('---------------------------------------------------------------------------------------------------------------')
                        }
                    }
                } catch (error) {
                    writer('Transporter ERROR => \n ' + error + '\n');
                }
            }
        })
    }

    /**
     * This function is used to register an external transporter
     * @param {any} externalTransporter - This is the transporter that you want to use.
     * @param externalTransporterOptions - This is an object that contains the options for the
     * transporter.
     */
    public register(externalTransporter: any, externalTransporterOptions = {}) {
        this.externalTransporterOptions = externalTransporterOptions;
        this.transporter = externalTransporter;
    }

    /**
     * It tries to create a new instance of the function, and if it fails, it checks if the error
     * message contains the string "is not a constructor"
     * @param fn - The function to check if it's a constructor.
     * @returns A boolean value.
     */
    private isConstructor(fn): boolean {
        try {
            Reflect.construct(String, [], fn)
        } catch (error) {
            return false;
        }
        return true;
    }
}