import { APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda/common/api-gateway';
import { Context } from 'aws-lambda/handler';
import { EventEmitter } from 'events';

import { broadcastMessage } from './symbols'
import { errorSerializer } from './serializer'
import { IStructuredLog, ITransporter, ITransporterOptions, ILambdaTransporterEvent } from './interfaces'
import { LEVELS } from './enum'
import { writer } from './writer'

export class Transporter implements ITransporter {
    private transporter: any;
    private externalTransporterOptions: any;
    private MAX_EVENT_FIRED: number = 5;
    private EVENT_FIRED: number = 0;
    private _eventBus: EventEmitter;
    private _lambdaEvent: APIGatewayEventDefaultAuthorizerContext;
    private _lambdaContext: Context;
    private _lambdaErrorMessage: IStructuredLog;

    constructor(public options: ITransporterOptions = { level: '' }) {
        const _levels = Object.values(LEVELS)

        if (!_levels.includes(options.level.toUpperCase())) {
            throw new Error(`The level ${options.level} is not present in the levels enum`)
        }

        errorSerializer();
        this.listen();
    }

    /**
     * The function listens to the event bus for a broadcast message, and when it receives one, it
     * checks if the error level is the same as the one specified in the options, and if it is, it
     * calls the transporter function
     * @returns the transporter function.
     */
    private listen(): void {
        if (!this._eventBus) return

        this._eventBus.on(broadcastMessage, async (data: ILambdaTransporterEvent) => {
            const errorLevel = this.options.level

            this._lambdaEvent = data?.event
            this._lambdaContext = data?.context
            this._lambdaErrorMessage = data.message

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
     * The function takes an event emitter as an argument and assigns it to the private variable
     * _eventBus
     * @param {EventEmitter} tevent - EventEmitter - This is the event emitter that will be used to
     * emit events to the transporter.
     */
    public set eventBus(tevent: EventEmitter) {
        this._eventBus = tevent;
    }

    /**
     * It returns the event emitter.
     * @returns The EventEmitter object.
     */
    public get eventBus(): EventEmitter {
        return this._eventBus;
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