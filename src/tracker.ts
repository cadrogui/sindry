import { APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda/common/api-gateway';
import { Context } from 'aws-lambda/handler';

import { IRequestContext } from './interfaces'
import { writer } from './writer'

const AMAZON_TRACE_ID = '_X_AMZN_TRACE_ID';
const CORRELATION_HEADER = 'x-correlation-';
const CORRELATION_ID = `${CORRELATION_HEADER}id`;
const CORRELATION_TRACE_ID = `${CORRELATION_HEADER}trace-id`;

export class LambdaRequestTracker {
    private lambdaRequestContext: IRequestContext = {
        apiRequestId: '',
        stage: '',
        'x-correlation-id': ''
    }

    /**
     * The function takes in the event and context objects from the lambda handler and parses them to
     * extract the correlation id, trace id, and stage
     * @param {APIGatewayEventDefaultAuthorizerContext} event - This is the event that triggered the
     * lambda function.
     * @param {Context} context - This is the AWS Lambda context object.
     */
    constructor(private event: APIGatewayEventDefaultAuthorizerContext, private context: Context) {
        try {
            if (!event) throw new Error('Event must be provided')
            if (!context) throw new Error('Context must be provided')

            if (this.event.hasOwnProperty('requestContext')) {
                this.lambdaRequestContext.stage = this.event.requestContext.stage
                this.lambdaRequestContext.apiRequestId = this.event.requestContext.requestId;
            }

            this.lambdaRequestContext.awsRequestId = this.context?.awsRequestId

            if (event.headers) {
                Object.keys(event.headers).forEach((header) => {
                    if (header.toLowerCase().startsWith(CORRELATION_HEADER)) {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        this.lambdaRequestContext[header] = event.headers![header] as string;
                    }
                });
            }

            if (process.env[AMAZON_TRACE_ID]) {
                this.lambdaRequestContext[CORRELATION_TRACE_ID] = process.env[AMAZON_TRACE_ID] as string;
            }

            if (!this.lambdaRequestContext[CORRELATION_ID]) {
                this.lambdaRequestContext[CORRELATION_ID] = context.awsRequestId;
            }
        } catch (error) {
            writer('TRACKER ERROR => \n ' + error + '\n');
            throw error
        }
    }

    /**
     * > The `lambdaContext` property returns the `context` object that is passed to the `handler`
     * function
     * @returns The lambdaContext property is being returned.
     */
    public get lambdaContext(): IRequestContext {
        return this.lambdaRequestContext
    }
}