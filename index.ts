interface LoggerConfigOptions {
    //path to log directory
    path: string,
    //log to console or not
    console?: boolean
}

import {format, createLogger, transports, Logger as WinstonLoggerType} from "winston";

export abstract class Logger {
    config: LoggerConfigOptions

    protected constructor(config: LoggerConfigOptions) {
        this.config = config
    }

    //basic log
    abstract log(level: string, message: string, metadata: any): void

}

const basicFormat = format.combine(format.timestamp(), format.label(), format.json())

export class WinstonLogger extends Logger {
    logger: WinstonLoggerType

    constructor(config: LoggerConfigOptions) {
        super(config)
        this.logger = createLogger({
            format: basicFormat,
            transports: [
                new transports.File({
                    filename: this.config.path + "/combined.log",
                    level: 'info'
                }),
                new transports.File({
                    filename: this.config.path + "/error.log",
                    level: 'error'
                })
            ]
        })
        if (this.config.console) {
            this.logger.add(new transports.Console({
                format: basicFormat
            }))
        }
    }

    log(level: string, message: string, metadata: any) {
        this.logger.log(level, message, metadata)
    }
}
