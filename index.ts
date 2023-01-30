import {format, createLogger, transports, Logger as WinstonLoggerType} from "winston";
import {Format} from "logform";

//Interfaces
export interface LoggerConfigOptions {
    //path to log directory
    path: string,
    //log to console or not
    console?: boolean,
}

export interface WinstonLoggerOptions extends LoggerConfigOptions {
    format?: Array<Format>,
    label?: string
    maxsize: number,
}

export interface LoggerService {
    http: Logger
    app: Logger
}


//Abstract Logger class
abstract class Logger {
    config: LoggerConfigOptions
    levels: any = {
        fatal: 0,
        error: 1,
        warn: 2,
        info: 3,
        debug: 4,
        all: 5
    }

    protected constructor(config: LoggerConfigOptions) {
        this.config = config
    }

    //info log
    abstract info(message: string, metadata?: any): void

    //error log
    abstract error(message: string, metadata?: any): void

    //debug-trace log
    abstract debug(message: string, metadata?: any): void
}

//Logger implementation using Winston
export class WinstonLogger extends Logger {
    logger: WinstonLoggerType
    errorLogger: WinstonLoggerType
    debugLogger: WinstonLoggerType

    constructor(config: any) {
        super(config)

        const infoFormat = format.combine(format.label({label: config.label}), format.timestamp(), ...config.format)
        this.logger = createLogger({
            format: infoFormat,
            levels: this.levels,
            transports: [new transports.File({
                filename: this.config.path + "/combined.log",
                level: 'info',
                maxsize: config.maxsize,
            })]
        })

        const errFormat = format.combine(format.label({label: config.label + '-ERROR'}), format.timestamp(), ...config.format)
        this.errorLogger = createLogger({
            format: errFormat,
            levels: this.levels,
            transports: [new transports.File({
                filename: this.config.path + "/error.log",
                level: 'error',
                maxsize: config.maxsize,
            })]
        })

        const debugFormat = format.combine(format.label({label: 'DEBUG'}), format.errors({stack: true}), format.timestamp(), ...config.format)
        this.debugLogger = createLogger({
            format: debugFormat,
            levels: this.levels,
            level: 'debug',
            transports: [new transports.Console({
                format: debugFormat
            })]
        })

        if (this.config.console) {
            this.logger.add(new transports.Console({
                format: infoFormat
            }))
            this.errorLogger.add(new transports.Console({
                format: errFormat
            }))
        }
    }

    info(message: string, metadata?: any, level: string = 'info') {
        if (this.levels[level] <= this.levels['info']) {
            this.logger.log({level, message, metadata})
        }
    }

    error(message: any, metadata?: any, level: string = 'error') {
        if (this.levels[level] <= this.levels['error']) {
            const err: string = message.stack || message
            this.errorLogger.log({level, message: err, metadata})
        }
    }

    debug(message: string, metadata?: any, level: string = 'debug') {
        if (this.levels[level] <= this.levels['debug']) {
            this.errorLogger.log({level, message, metadata})
        }
    }

}

//
const defaultStringFormat = format.printf((info) => {
    const {label, metadata, message, timestamp} = info
    const status = metadata?.status
    return (`[${label}] - ${timestamp || ''} - ${status || ''} - ${message} : ${metadata ? JSON.stringify(metadata) : ''}`)
})

//Logger service that provides various Logger instances with different labels and logging directories for different needs : http , app ...
export class WinstonLoggerService implements LoggerService {
    http: Logger
    app: Logger

    constructor(config: WinstonLoggerOptions) {
        this.http = new WinstonLogger({
            format: [defaultStringFormat],
            label: 'HTTP',
            ...config,
        })
        this.app = new WinstonLogger({
            format: [defaultStringFormat],
            label: 'APP',
            ...config,
        })
    }
}