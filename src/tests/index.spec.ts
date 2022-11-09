// index.spec.ts
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { Sindry, Transporter } from '../index'
import { mockLambdaContext, mockApiGatewayEvent } from './__mocks__'
import { TransporterMock } from './__mocks__/transporter.mock'

let sindry: Sindry;
const mockEvent: APIGatewayProxyEvent = mockApiGatewayEvent("http://teleconsulta.com", { id: 0 }, "POST", { proxy: "proxy" }, { authorization: '' }, { userId: "TEST_ID" });
// tslint:disable-next-line:no-empty
const mockContext: Context = mockLambdaContext((err, result) => { }, (err) => { });
const error = new Error('Sindry Error test')

describe('sindry tests', () => {
    sindry = new Sindry()

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
        sindry.setTracker(mockEvent, mockContext)
    })
})

describe('sindry event test', () => {
    const sindryEvent = new Sindry()
    const mockEventTest: APIGatewayProxyEvent = mockApiGatewayEvent("http://teleconsulta.com", { id: 0 }, "POST", { proxy: "proxy" }, { authorization: '' }, { userId: "TEST_ID" });

    it('tracker should be initiated with missing event properties', () => {
        delete mockEventTest.requestContext.requestId
        sindryEvent.setTracker(mockEventTest, mockContext)
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

    new Transporter(sindry, {
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
        sindry.info(message)
        expect(sindry.structuredLog.msg).toMatchObject(message)
    })

    it('transporter can deliver message with blacklist', () => {
        const message = { message: 'mock test whith blacklist' }
        sindry.blacklist = blacklist
        sindry.info(message)
        expect(sindry.structuredLog.msg).toMatchObject(message)
    })
})

describe('sindry error object test', () => {
    it('structured error object has awsRequestId property', () => {
        expect(sindry.structuredLog).toHaveProperty('awsRequestId')
        expect(sindry.structuredLog.awsRequestId).toBeTruthy()
    })

    it('structured error object has stage property', () => {
        expect(sindry.structuredLog).toHaveProperty('stage')
        expect(sindry.structuredLog.stage).toBeTruthy()
    })

    it('structured error object has apiRequestId property', () => {
        expect(sindry.structuredLog).toHaveProperty('apiRequestId')
        expect(sindry.structuredLog.apiRequestId).toBeTruthy()
    })

    it('structured error object has x-correlation-id property', () => {
        expect(sindry.structuredLog).toHaveProperty('x-correlation-id')
        expect(sindry.structuredLog['x-correlation-id']).toBeTruthy()
    })

    it('structured error object has level and its a number', () => {
        expect(sindry.structuredLog).toHaveProperty('level')
        expect(sindry.structuredLog.level).toEqual(expect.any(Number));
        expect(sindry.structuredLog.level).toBeTruthy()
    })
})