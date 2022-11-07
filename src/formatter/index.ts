import { ILogFormatter, LogData } from '../interfaces';

/**
 * Formats the log in native cloudwatch format and
 * mixes in the Lambda request context data
 */
export class CloudwatchLogFormatter implements ILogFormatter {
    format(data: LogData): string {
        const { awsRequestId, level, msg, placeholder } = data;
        const time = new Date().toISOString();

        const line = `${time}${awsRequestId ? `\t${awsRequestId}` : ''}\t${level}\t${placeholder} \t${JSON.stringify(msg)}`;
        return line;
    }
}