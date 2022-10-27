![Project banner](./media/header.png)

A low overhead structured logs for AWS Lambda.

#### Install

```
npm i -S sindri
```

#### Usage

```
import { Sindri, Transporter } from 'sindri'

logger = new Sindri()
logger.setTracker(event, context);
```

#### Blacklist

Sindri has an implementation to blacklist array of properties that must be present in the response object, so as not to trigger the Transporter class if it's implemented.

```
logger.blacklist = [
  {
    key: 'internalCode',
    value: 50
  },
  {
    key: 'internalCode',
    value: 55
  }
]
```

#### Transporter

The Transporter class is intended to stream the error object decorated with properties present in the event and context object of the AWS ApiGateway to any desired location, such as: AWS SQS, AWS SNS or an HTTP endpoint, this class was designed in a domain agnostic way, to ensure usability and interdependency. It is also possible to define which type of error level is streamed to each transporter.

```
new Transporter(logger, {
  level: 'fatal'
}).register(Bugger, {
  sqsUrl: event.stageVariables.sqs_queue_error
})
```

The register method of the Transporter class receives as arguments any class, but it must have a public method called broadcast, in this scope you can access the scope of the Transporter class as well as the Sindri class, and therefore the event and context belonging to the Lambda invocation, it also receives as optional argument, an object of type ITransporterOptions with the level to be captured to be stramed to the desired location, in this case LEVEL: FATAL or 60

#### Transporter implementation example for AWS SQS
Bugger.ts

```
import AWS from 'aws-sdk';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

export class Bugger {
  private static queue: any;
  private static SQS_ERROR_QUEUE_URL: string;
  private sindri: { _context: Context; _event: APIGatewayProxyEvent; message: any; };
  private externalTransporterOptions: any;

  constructor() {
    Bugger.queue = new AWS.SQS({ apiVersion: '2012-11-05' });
  }

  private static async publish(error: any, lambda: string, event: any): Promise<any> {
    try {
      if (!this.SQS_ERROR_QUEUE_URL) {
        throw Error('No esta definida la url para la cola de errores');
      }

      const params = {
        MessageAttributes: {
          Publisher: {
            DataType: 'String',
            StringValue: lambda,
          },
        },
        MessageBody: JSON.stringify({ error, lambda, event }),
        MessageDeduplicationId: `${lambda}-${Date.now()}`,
        MessageGroupId: 'Bugger',
        QueueUrl: this.SQS_ERROR_QUEUE_URL,
      };

      return await this.queue.sendMessage(params).promise();
    } catch (error) {
      throw error;
    }
  }

  public async broadcast(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const { _context, _event, message } = this?.sindri

        const options = this?.externalTransporterOptions
        Bugger.SQS_ERROR_QUEUE_URL = options.sqsUrl;

        return resolve(await Bugger.publish(message, _context.functionName, _event))
      } catch (error) {
        return reject(error)
      }
    })
  }
}

```

#### Error Levels

```
export enum LEVELS {
    TRACE = 10,
    DEBUG = 20,
    INFO = 30,
    WARN = 40,
    ERROR = 50,
    FATAL = 60
}
```
#### Sindri Error Object

```
{
  message: {
    awsRequestId: 'a4353cb3-f3a9-19d0-491c-86a5585693d2',
    stage: 'develop',
    apiRequestId: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
    'x-correlation-id': 'a4353cb3-f3a9-19d0-491c-86a5585693d2',
    level: 50,
    msg: TypeError [ERR_INVALID_ARG_TYPE]: The "key" argument must be of type string or an instance of Buffer, TypedArray, DataView, or KeyObject. Received undefined
        at prepareSecretKey (internal/crypto/keys.js:322:11)
        at new Hmac (internal/crypto/hash.js:111:9)
        at Object.createHmac (crypto.js:148:10)
        at Object.hmac (/backend/node_modules/aws-sdk/lib/util.js:423:30)
        at Object.getSigningKey (/backend/node_modules/aws-sdk/lib/signers/v4_credentials.js:62:8)
        at V4.signature (/backend/node_modules/aws-sdk/lib/signers/v4.js:98:36)
        at V4.authorization (/backend/node_modules/aws-sdk/lib/signers/v4.js:93:36)
        at V4.addAuthorization (/backend/node_modules/aws-sdk/lib/signers/v4.js:35:12)
        at /backend/node_modules/aws-sdk/lib/event_listeners.js:242:18
        at finish (/backend/node_modules/aws-sdk/lib/config.js:386:7)
        at /backend/node_modules/aws-sdk/lib/config.js:404:9
        at /backend/node_modules/aws-sdk/lib/credentials.js:124:23
        at Credentials.refresh (/backend/node_modules/aws-sdk/lib/credentials.js:195:5)
        at Credentials.get (/backend/node_modules/aws-sdk/lib/credentials.js:122:12)
        at getAsyncCredentials (/backend/node_modules/aws-sdk/lib/config.js:398:24)
        at Config.getCredentials (/backend/node_modules/aws-sdk/lib/config.js:418:9) {
      code: 'ERR_INVALID_ARG_TYPE',
      retryDelay: 19.0849897307398
    },
    placeholder: 'Transporter ERROR'
  },
  level: 50
}
```


#### Structured error object obtained from AWS SQS

```
{
  "error": {
    "awsRequestId": "a9ca35cd-016b-d4e9-e4db-9f4a69b28ec2",
    "stage": "develop",
    "apiRequestId": "c6af9ac6-7b61-11e6-9a41-93e8deadbeef",
    "x-correlation-id": "a9ca35cd-016b-d4e9-e4db-9f4a69b28ec2",
    "level": 60,
    "msg": {
      "httpCode": 400,
      "message": "Las credenciales ingresadas son incorrectas o no existen.",
      "payload": {}
    },
    "placeholder": "Runtime Exception Triggered: "
  },
  "lambda": "handler",
  "event": {
    "body": {
      "username": "foo@bar.com",
      "password": "password"
    },
    "resource": "/{proxy+}",
    "path": "/auth/login",
    "httpMethod": "POST",
    "isBase64Encoded": true,
    "queryStringParameters": {
      "foo": "bar"
    },
    "multiValueQueryStringParameters": {
      "foo": [
        "bar"
      ]
    },
    "pathParameters": {
      "proxy": "/auth/login"
    },
    "stageVariables": {
      "sqs_queue_error": "https://sqs.us-east-1.amazonaws.com/0123456789/DQL.fifo",
      "baz": "qux"
    },
    "headers": {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Encoding": "gzip, deflate, sdch",
      "Accept-Language": "en-US,en;q=0.8",
      "Cache-Control": "max-age=0",
      "CloudFront-Forwarded-Proto": "https",
      "CloudFront-Is-Desktop-Viewer": "true",
      "CloudFront-Is-Mobile-Viewer": "false",
      "CloudFront-Is-SmartTV-Viewer": "false",
      "CloudFront-Is-Tablet-Viewer": "false",
      "CloudFront-Viewer-Country": "US",
      "Host": "1234567890.execute-api.us-east-1.amazonaws.com",
      "Upgrade-Insecure-Requests": "1",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36",
      "Via": "1.1 08f323deadbeefa7af34d5feb414ce27.cloudfront.net (CloudFront)",
      "X-Amz-Cf-Id": "cDehVQoZnx43VYQb9j2-nvCh-9z396Uhbp027Y2JvkCPNLmGJHqlaA==",
      "X-Forwarded-For": "127.0.0.1, 127.0.0.2",
      "X-Forwarded-Port": "443",
      "X-Forwarded-Proto": "https",
      "Setup": "ES",
      "locale": "es_CL"
    },
    "multiValueHeaders": {
      "Accept": [
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
      ],
      "Accept-Encoding": [
        "gzip, deflate, sdch"
      ],
      "Accept-Language": [
        "en-US,en;q=0.8"
      ],
      "Cache-Control": [
        "max-age=0"
      ],
      "CloudFront-Forwarded-Proto": [
        "https"
      ],
      "CloudFront-Is-Desktop-Viewer": [
        "true"
      ],
      "CloudFront-Is-Mobile-Viewer": [
        "false"
      ],
      "CloudFront-Is-SmartTV-Viewer": [
        "false"
      ],
      "CloudFront-Is-Tablet-Viewer": [
        "false"
      ],
      "CloudFront-Viewer-Country": [
        "US"
      ],
      "Host": [
        "0123456789.execute-api.us-east-1.amazonaws.com"
      ],
      "Upgrade-Insecure-Requests": [
        "1"
      ],
      "User-Agent": [
        "Custom User Agent String"
      ],
      "Via": [
        "1.1 08f323deadbeefa7af34d5feb414ce27.cloudfront.net (CloudFront)"
      ],
      "X-Amz-Cf-Id": [
        "cDehVQoZnx43VYQb9j2-nvCh-9ieoiurendCPNLmGJHqlaA=="
      ],
      "X-Forwarded-For": [
        "127.0.0.1, 127.0.0.2"
      ],
      "X-Forwarded-Port": [
        "443"
      ],
      "X-Forwarded-Proto": [
        "https"
      ]
    },
    "requestContext": {
      "accountId": "123456789012",
      "resourceId": "123456",
      "stage": "prod",
      "requestId": "c6af9ac6-7b61-11e6-9a41-93e8deadbeef",
      "requestTime": "09/Apr/2015:12:34:56 +0000",
      "requestTimeEpoch": 1428582896000,
      "identity": {
        "cognitoIdentityPoolId": null,
        "accountId": null,
        "cognitoIdentityId": null,
        "caller": null,
        "accessKey": null,
        "sourceIp": "127.0.0.1",
        "cognitoAuthenticationType": null,
        "cognitoAuthenticationProvider": null,
        "userArn": null,
        "userAgent": "Custom User Agent String",
        "user": null
      },
      "path": "/auth/login",
      "resourcePath": "/auth/login",
      "httpMethod": "POST",
      "apiId": "1234567890",
      "protocol": "HTTP/1.1",
      "invokedFunctionArn": "arn:aws:lambda:us-east-1:0123456789:function:my-fn:develop"
    }
  }
}
```

#### Error log parsed for AWS CloudWatch compatible examples:

```
2022-10-27T15:21:04.037Z	c6af9ac6-7b61-11e6-9a41-93e8deadbeef	FATAL	Runtime Exception Triggered:  	{"httpCode":400,"message":"Las credenciales ingresadas son incorrectas o no existen.","payload":{}}
```

```
2022-10-27T13:52:54.138Z	c6af9ac6-7b61-11e6-9a41-93e8deadbeef	ERROR	Transporter Exception Raised {"stack":"TypeError [ERR_INVALID_ARG_TYPE]: The \"key\" argument must be of type string or an instance of Buffer, TypedArray, DataView, or KeyObject. Received undefined\n    at prepareSecretKey (internal/crypto/keys.js:322:11)\n    at new Hmac (internal/crypto/hash.js:111:9)\n    at Object.createHmac (crypto.js:148:10)\n    at Object.hmac (/backend/node_modules/aws-sdk/lib/util.js:423:30)\n    at Object.getSigningKey (/backend/node_modules/aws-sdk/lib/signers/v4_credentials.js:62:8)\n    at V4.signature (/backend/node_modules/aws-sdk/lib/signers/v4.js:98:36)\n    at V4.authorization (/backend/node_modules/aws-sdk/lib/signers/v4.js:93:36)\n    at V4.addAuthorization (/backend/node_modules/aws-sdk/lib/signers/v4.js:35:12)\n    at /backend/node_modules/aws-sdk/lib/event_listeners.js:242:18\n    at finish (/backend/node_modules/aws-sdk/lib/config.js:386:7)\n    at /backend/node_modules/aws-sdk/lib/config.js:404:9\n    at /backend/node_modules/aws-sdk/lib/credentials.js:124:23\n    at Credentials.refresh (/backend/node_modules/aws-sdk/lib/credentials.js:195:5)\n    at Credentials.get (/backend/node_modules/aws-sdk/lib/credentials.js:122:12)\n    at getAsyncCredentials (/backend/node_modules/aws-sdk/lib/config.js:398:24)\n    at Config.getCredentials (/backend/node_modules/aws-sdk/lib/config.js:418:9)","message":"The \"key\" argument must be of type string or an instance of Buffer, TypedArray, DataView, or KeyObject. Received undefined","code":"ERR_INVALID_ARG_TYPE","retryDelay":7.252844033149297}
```

#### License

Licensed under [MIT](./LICENSE).
