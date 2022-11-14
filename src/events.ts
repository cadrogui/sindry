import { EventEmitter } from 'events';

export class TransporterEvents {
    public error: EventEmitter = new EventEmitter();

    // tslint:disable-next-line:no-empty
    constructor() {
    }
}