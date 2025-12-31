import { logger } from "@rasla/logify"

export const loggerConfig = () => {
    return logger(
        {
            console: true,
            file: true,
            filePath: './logs/app.log',
            level: 'info', // "debug" | "info" | "warn" | "error"
            skip: ['/health', '/metrics'],
            includeIp: true,
            format: '[{timestamp}] {level} [{method}] {path} - {statusCode} {duration}ms{ip}',
        }
    )
}