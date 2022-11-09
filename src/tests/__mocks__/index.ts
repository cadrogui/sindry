import { APIGatewayEventRequestContext, APIGatewayEventRequestContextWithAuthorizer, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda/common/api-gateway';
import { APIGatewayProxyCallback } from 'aws-lambda/trigger/api-gateway-proxy';
import { Context } from 'aws-lambda/handler';


/**
 * It creates an object that looks like an API Gateway event
 * @param {string} path - The path of the request.
 * @param {string} [body] - The body of the request.
 * @param {string} [method] - The HTTP method of the request.
 * @param [pathParameters] - These are the parameters that are part of the path. For example, if you
 * have a path like /users/{userId}/posts/{postId}, then the pathParameters would be {userId: "123",
 * postId: "456"}.
 * @param [headers] - The headers of the request.
 * @param [queryStringParameters] - This is a dictionary of query string parameters.
 * @param {string} [resourcePath] - The path of the resource that the request is being made to.
 * @param {string} [stage] - The stage name of the API Gateway.
 * @param {Context} [requestContext] - This is the request context object. It contains information
 * about the request, such as the identity of the caller, the source IP address, and the request ID.
 * @returns An object of type APIGatewayEventDefaultAuthorizerContext
 */
export const mockApiGatewayEvent = (
    path: string,
    body?: string,
    method?: string,
    pathParameters?: { [name: string]: string },
    headers?: { [name: string]: string },
    queryStringParameters?: { [name: string]: string },
    resourcePath?: string,
    stage?: string,
    requestContext?: Context
): APIGatewayEventDefaultAuthorizerContext => {
    return {
        path,
        body: !!body ? body : null,
        headers: !!headers ? Object.assign(defaultHeaders, headers) : defaultHeaders,
        multiValueHeaders: {},
        httpMethod: !!method ? method : "GET",
        isBase64Encoded: false,
        pathParameters: !!pathParameters ? pathParameters : null,
        queryStringParameters: !!queryStringParameters
            ? queryStringParameters
            : null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: !!requestContext
            ? Object.assign(
                defaultApiGatewayEventRequestContext(path, resourcePath, method, stage),
                requestContext
            )
            : defaultApiGatewayEventRequestContext(path, resourcePath, method, stage),
        resource: "resource"
    };
};

const defaultHeaders = {
    "accept": "application/json",
    "cache-control": "no-cache",
    "host": "localhost",
    "connection": "keep-alive"
};

/**
 * It returns an object that represents the default request context of an API Gateway event
 * @param {string} path - The path of the request.
 * @param {string} [resourcePath] - The path of the resource that was requested.
 * @param {string} [method] - The HTTP method of the request.
 * @param {string} [stage] - The stage name of the API.
 * @returns An object with the following properties:
 */
const defaultApiGatewayEventRequestContext = (
    path: string,
    resourcePath?: string,
    method?: string,
    stage?: string
): APIGatewayEventDefaultAuthorizerContext => {
    return {
        accountId: "123456789012",
        apiId: "1234567890",
        authorizer: null,
        connectedAt: new Date().getTime() - 1000,
        httpMethod: !!method ? method : "GET",
        messageDirection: "IN",
        path,
        resourcePath: !!resourcePath ? resourcePath : "resourcePath",
        stage: !!stage ? stage : "develop",
        requestId: "c6af9ac6-7b61-11e6-9a41-93e8deadbeef",
        requestTimeEpoch: new Date().getTime(),
        resourceId: "123456",
    };
};

/**
 * It returns a mock AWS Lambda context object
 * @param [done] - A callback function that you can use to return a result to the caller.
 * @param [fail] - (err: Error | string) => void
 * @returns A mock lambda context
 */
export const mockLambdaContext = (
    done?: (error?: Error, result?: any) => void,
    fail?: (err: Error | string) => void
): Context => {
    const runTime = new Date().getTime();
    const timeout = 60 * 1000;
    return {
        callbackWaitsForEmptyEventLoop: false,
        functionName: "mockFunctionName",
        invokedFunctionArn: "arn",
        memoryLimitInMB: 128,
        awsRequestId: "c6af9ac6-7b61-11e6-9a41-93e8deadbeef",
        logGroupName: "log_group",
        logStreamName: "log_stream",
        functionVersion: "23",
        getRemainingTimeInMillis: () => timeout - (new Date().getTime() - runTime),
        done: !!done ? done : defaultDone,
        fail: !!fail ? fail : defaultFail,
        succeed: () => {
            return;
        }
    } as unknown as Context;
};

/**
 * If the user doesn't provide a callback, we'll use a default callback that does nothing.
 * @param {Error} [error] - The error object, if any, that was thrown by the function.
 * @param {any} [result] - The result of the operation.
 * @returns The defaultDone function is being returned.
 */
const defaultDone = (error?: Error, result?: any) => {
    return;
};

/**
 * It returns nothing.
 * @param {Error | string} err - Error | string
 * @returns The defaultFail function is being returned.
 */
const defaultFail = (err: Error | string) => {
    return;
};

/**
 * It returns a function that takes an error and a result, and returns nothing
 * @returns A function that takes in an error and a result and returns nothing.
 */
export const mockCallback = (): APIGatewayProxyCallback => {
    return (error?: Error | null | string, result?: any) => {
        return;
    };
};