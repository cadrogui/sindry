import { EventEmitter } from 'events';
import { APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda/common/api-gateway';
import { Context } from 'aws-lambda/handler';

export interface LambdaContext {
    awsRequestId: string;
}

export interface LambdaEvent {
    headers?: {
        [key: string]: string | undefined;
    };
}

export interface LogData {
    placeholder?: string;
    awsRequestId: string;
    level: string;
    msg?: string;
}

export interface ILogFormatter {
    /**
     * Formats the log message using the incoming buffer
     *
     * @param {object} data
     * @returns {string} The formatted output which must end with a newline
     * @memberof ILogFormatter
     */
    format(data: LogData): string;
}

export interface IRequestContext {
    awsRequestId?: string;
    apiRequestId?: string;
    stage?: string;
    'x-correlation-id'?: string;
}

export interface IStructuredLog extends IRequestContext {
    level: number;
    msg: object;
    placeholder?: string;
    stage?: string;
}

export interface ISindry {
    /**
     * Log message using the incoming buffer
     *
     * @param {string} placeholder
     * @param {object} data
     * @memberof ISindry
     */
    fatal(msg, placeholder): any;
    error(msg, placeholder): any;
    warn(msg, placeholder): any;
    info(msg, placeholder): any;
    debug(msg, placeholder): any;
    trace(msg, placeholder): any;
    eventBus: EventEmitter;

    /**
     * Log message to console or stdout
     *
     * @returns {string} The formatted output which must end with a newline
     * @memberof ISindry
     */
    structuredLog: IStructuredLog;
}

export interface ITransporterOptions {
    level: string
}

export interface ITransporter {
    register(externalTransporter: any, externalTransporterOptions: any);
    options: ITransporterOptions;
    eventBus: EventEmitter;
}

export interface ILambdaTransporterEvent {
    message: any;
    level: string;
    context: Context;
    event: APIGatewayEventDefaultAuthorizerContext
}