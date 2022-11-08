import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { EventEmitter } from 'events';

import { CloudwatchLogFormatter } from './formatter';
import { LEVELS } from './enum';
import { LambdaRequestTracker } from './tracker';
import { IRequestContext, IStructuredLog, ISindry } from './interfaces';
import { broadcastMessage } from './symbols';

export class Sindry extends EventEmitter implements ISindry {
    private message: IStructuredLog;
    private contextTracker: IRequestContext;
    private _event: APIGatewayProxyEvent;
    private _context: Context;
    private _blacklist: any[];
    private canDeliverMessage: boolean;
    // tslint:disable-next-line:no-console
    private defaultLogger: any = console.log;

    constructor() {
        super();

        process.on('unhandledRejection', (error, promise) => {
            this.error({ error, promise }, "** Unhandled Rejection **");
        });

        process.on('UnhandledPromiseRejectionWarning', (error) => {
            this.warn({ error }, "** Unhanldled Promise Rejection Warning **");
        });

        process.on('uncaughtException', (error, reason) => {
            this.fatal({ error, reason }, "** Uncaught Exception **");
        })
    }

    public fatal = (msg, placeholder = '') => this.log(placeholder, msg, LEVELS.FATAL)
    public error = (msg, placeholder = '') => this.log(placeholder, msg, LEVELS.ERROR)
    public warn = (msg, placeholder = '') => this.log(placeholder, msg, LEVELS.WARN)
    public info = (msg, placeholder = '') => this.log(placeholder, msg, LEVELS.INFO)
    public debug = (msg, placeholder = '') => this.log(placeholder, msg, LEVELS.DEBUG)
    public trace = (msg, placeholder = '') => this.log(placeholder, msg, LEVELS.TRACE)

    /**
     * It takes a message, a level and a placeholder, and then it emits a broadcast message event with
     * the message and the level
     * @param [placeholder] - This is the name of the function that is logging the message.
     * @param msg - The message you want to log
     * @param level - The log level.
     */
    private log(placeholder = '', msg, level): void {
        this.message = { ...this.contextTracker, level, msg, placeholder }

        let awsRequestId;
        if (this.contextTracker && this.contextTracker.hasOwnProperty('apiRequestId')) {
            awsRequestId = this.contextTracker.apiRequestId;
        }

        const formatter = new CloudwatchLogFormatter;
        const formatedMsg = formatter.format({ placeholder, awsRequestId, level: LEVELS[level], msg })

        this.canDeliverMessage = this.checkBlackList(this._blacklist, msg)

        if (this.canDeliverMessage) {
            this.emit(broadcastMessage, { message: this.message, level })
        }

        if (process.env.DOCORATE_LOGS) {
            // tslint:disable-next-line:no-console
            console.log = (...args: any[]): void => {
                this.defaultLogger.apply(
                    console,
                    [...[`[sindry=${LEVELS[level]}]`], ...args]
                )
            }
        }

        // tslint:disable-next-line:no-console
        console.log(formatedMsg);
    }

    /**
     * It returns the message log structured ready foy use in a bd
     * @returns The structured message 
     */
    public get structuredLog(): IStructuredLog {
        return this.message
    }

    /**
     * It sets the event property of the class.
     * @param {APIGatewayProxyEvent} _event - The event that triggered the lambda function.
     */
    public set event(_event: APIGatewayProxyEvent) {
        this._event = _event
    }

    /**
     * It returns the event object.
     * @returns The event object
     */
    public get event(): APIGatewayProxyEvent {
        return this._event;
    }

    /**
     * It sets the context of the class.
     * @param {Context} _context - The context of the application.
     */
    public set context(_context: Context) {
        this._context = _context
    }

    /**
     * It returns the context of the current object.
     * @returns The context property is being returned.
     */
    public get context(): Context {
        return this._context;
    }

    /**
     * > This function sets the event and context objects, and then creates a new LambdaRequestTracker
     * object
     * @param {APIGatewayProxyEvent} event - The event parameter is the input to the handler. It is the
     * event data that triggered the function.
     * @param {Context} context - Context - The context object passed to the Lambda function.
     */
    public setTracker(event: APIGatewayProxyEvent, context: Context): void {
        this._event = event;
        this._context = context;

        const tracker = new LambdaRequestTracker(event, context);
        this.contextTracker = tracker.lambdaContext

        // lambda warmer compatibility and error handling
        // lambda warmer event -> { "warmer":true,"concurrency":3 }
        if (event.hasOwnProperty('warmer')) {
            this.contextTracker.apiRequestId = 'LAMBDA_WARMER_INVOCATION'
        }
    }

    /**
     * It returns the value of the private variable _blacklist.
     * @returns The value of the private variable _blacklist.
     */
    public get blacklist(): any[] {
        return this._blacklist;
    }

    /**
     * It sets the blacklist property to the value of the element parameter.
     * @param {any} element - The element to be added to the blacklist.
     */
    public set blacklist(element: any[]) {
        this._blacklist = element;
    }

    /**
     * It takes an object and an object of key/value pairs and returns true if the object contains a
     * key/value pair that matches one of the key/value pairs in the second object
     * @param {any} item - the item in the array of objects
     * @param response - The response object from the server.
     * @returns A boolean value.
     */
    private checkBlackList(blacklist: any, response = {}): boolean {
        if (!blacklist) return true;

        for (const blacklistItem of blacklist) {
            for (const key in blacklistItem) {
                if (response.hasOwnProperty(blacklistItem.key) && response[blacklistItem.key] === blacklistItem.value) {
                    return false
                }
            }
        }
        return true
    }
}