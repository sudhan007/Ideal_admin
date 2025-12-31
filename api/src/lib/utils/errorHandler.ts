import { Elysia } from 'elysia';

export const errorHandler = new Elysia({ name: 'error-handler' })
    .onError(({ code, error, set, request }: any) => {
        try {
                    const isDev = process.env.NODE_ENV === 'development';
        
        console.error('Error occurred:', {
            code,
            message: error.message,
            url: request.url,
            method: request.method,
            timestamp: new Date().toISOString(),
            ...(isDev && { stack: error.stack })
        });

        const errorMap: Record<string, { status: number; message: string }> = {
            VALIDATION: { status: 400, message: 'Validation error' },
            NOT_FOUND: { status: 404, message: 'Resource not found' },
            PARSE: { status: 400, message: 'Invalid request format' },
            INTERNAL_SERVER_ERROR: { status: 500, message: 'Internal server error' },
            UNKNOWN: { status: 500, message: 'An unexpected error occurred' }
        };

        const errorInfo = errorMap[code] || { status: 500, message: 'Something went wrong' };
        set.status = errorInfo.status;

        return {
            message: error.message || errorInfo.message,
            status: false,
            ...(isDev && { error: error.message, stack: error.stack })
        };
        } catch (error) {
            console.log(error)
            set.status = 500
            return {
                message: error || "Something went wrong",
                status: false
            }
        }
    });