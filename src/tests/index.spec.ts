// index.spec.ts
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { Sindri, Transporter } from '../index'
import { mockLambdaContext, mockApiGatewayEvent } from './__mocks__'
import { TransporterMock } from './__mocks__/transporter.mock'

let sindri: Sindri;
const mockEvent: APIGatewayProxyEvent = mockApiGatewayEvent("http://teleconsulta.com", { id: 0 }, "POST", { proxy: "proxy" }, { authorization: '' }, { userId: "TEST_ID" });
// tslint:disable-next-line:no-empty
const mockContext: Context = mockLambdaContext((err, result) => { }, (err) => { });

describe('sindri tests', () => {
    sindri = new Sindri()

    it('lambda envent should has request context', () => {
        expect(mockEvent).toHaveProperty('requestContext')
    })

    it('lambda envent should not be null', () => {
        expect(mockEvent).not.toBeNull()
    })

    it('lambda context should not be null', () => {
        expect(mockContext).not.toBeNull()
    })

    it('tracker should be initiated without any errors', () => {
        sindri.setTracker(mockEvent, mockContext)
    })
})

describe('transporter tests', () => {
    const blacklist = [
        {
            key: 'internalCode',
            value: 50
        },
        {
            key: 'internalCode',
            value: 55
        }
    ]

    new Transporter(sindri, {
        level: 'fatal'
    }).register(TransporterMock, {
        sqsUrl: mockEvent?.stageVariables
    })

    it('transporter has a broadcast method', () => {
        const transporterMock = new TransporterMock();
        const broadcast = jest.spyOn(transporterMock, 'broadcast')
        expect(typeof transporterMock.broadcast).toBe("function");
    })

    it('transporter can deliver message whitout blacklist', () => {
        const message = { message: 'mock test whitout blacklist' }
        sindri.info(message)
        expect(sindri.structuredLog.msg).toMatchObject(message)
    })

    it('transporter can deliver message with blacklist', () => {
        const message = { message: 'mock test whith blacklist' }
        sindri.blacklist = blacklist
        sindri.info(message)
        expect(sindri.structuredLog.msg).toMatchObject(message)
    })
})

describe('sindri error object test', () => {
    it('structured error object has awsRequestId property', () => {
        expect(sindri.structuredLog).toHaveProperty('awsRequestId')
        expect(sindri.structuredLog.awsRequestId).toBeTruthy()
    })

    it('structured error object has stage property', () => {
        expect(sindri.structuredLog).toHaveProperty('stage')
        expect(sindri.structuredLog.stage).toBeTruthy()
    })

    it('structured error object has apiRequestId property', () => {
        expect(sindri.structuredLog).toHaveProperty('apiRequestId')
        expect(sindri.structuredLog.apiRequestId).toBeTruthy()
    })

    it('structured error object has x-correlation-id property', () => {
        expect(sindri.structuredLog).toHaveProperty('x-correlation-id')
        expect(sindri.structuredLog['x-correlation-id']).toBeTruthy()
    })

    it('structured error object has level and its a number', () => {
        expect(sindri.structuredLog).toHaveProperty('level')
        expect(sindri.structuredLog.level).toEqual(expect.any(Number));
        expect(sindri.structuredLog.level).toBeTruthy()
    })
})