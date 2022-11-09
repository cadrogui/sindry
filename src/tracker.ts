import { APIGatewayProxyEvent, APIGatewayEventRequestContextV2 } from 'aws-lambda/trigger/api-gateway-proxy';

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
     * The function takes in the event and context objects from the lambda handler and creates a new
     * object called lambdaRequestContext. The lambdaRequestContext object is used to store the correlation id and other correlation
     * headers
     * @param {APIGatewayProxyEvent} event - The event that triggered the Lambda function.
     * @param {Context} context - This is the context object that is passed to the Lambda function.
     */
    constructor(private event: APIGatewayProxyEvent, private context: APIGatewayEventRequestContextV2) {
        try {
            if (!event) throw new Error('Event must be provided')
            if (!context) throw new Error('Context must be provided')

            if (this.event.hasOwnProperty('requestContext')) {
                this.lambdaRequestContext.stage = this.event.requestContext.stage
                this.lambdaRequestContext.apiRequestId = this.event.requestContext.requestId;
            }

            this.lambdaRequestContext.awsRequestId = this.context?.requestId

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
                this.lambdaRequestContext[CORRELATION_ID] = context.requestId;
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