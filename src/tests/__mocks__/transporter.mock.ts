import { APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda/common/api-gateway';
import { Context } from 'aws-lambda/handler';

export class TransporterMock {
    private sindry: { _context: Context; _event: APIGatewayEventDefaultAuthorizerContext; message: any; };
    private externalTransporterOptions: any;

    // tslint:disable-next-line:no-empty
    constructor() { }

    /**
     * It does nothing.
     * @param {any} error - The error object returned from the Lambda function.
     * @param {string} lambda - The name of the lambda function that you want to invoke.
     * @param {any} event - The event that was passed to the lambda function
     * @returns A promise that resolves to true.
     */
    private static async noop(error: any, lambda: string, event: any): Promise<any> {
        return await true;
    }

    /**
     * > It returns a promise that resolves to the result of the `noop` function of the
     * `TransporterMock` class
     * @returns The return value of the function is the return value of the resolve function.
     */
    public async broadcast(): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const { _context, _event, message } = this?.sindry

                const options = this?.externalTransporterOptions

                return resolve(await TransporterMock.noop(message, _context.functionName, _event))
            } catch (error) {
                return reject(error)
            }
        })
    }
}