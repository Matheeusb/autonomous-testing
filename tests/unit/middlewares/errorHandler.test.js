const errorHandler = require('../../../src/middlewares/errorHandler');

describe('Error Handler Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => { });
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    // Custom status and message
    it('should respond with error status and message when provided', () => {
        // Arrange
        const err = { status: 400, message: 'Bad Request' };

        // Act
        errorHandler(err, req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Bad Request' });
    });

    it('should respond with 404 status when error has status 404', () => {
        // Arrange
        const err = { status: 404, message: 'User not found' };

        // Act
        errorHandler(err, req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should respond with 401 status for authentication errors', () => {
        // Arrange
        const err = { status: 401, message: 'Invalid email or password' };

        // Act
        errorHandler(err, req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
    });

    it('should respond with 409 status for conflict errors', () => {
        // Arrange
        const err = { status: 409, message: 'Email already in use' };

        // Act
        errorHandler(err, req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ message: 'Email already in use' });
    });

    // Default status and message
    it('should default to 500 when error has no status', () => {
        // Arrange
        const err = { message: 'Something went wrong' };

        // Act
        errorHandler(err, req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Something went wrong' });
    });

    it('should default to "Internal server error" when error has no message', () => {
        // Arrange
        const err = { status: 500 };

        // Act
        errorHandler(err, req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });

    it('should default to 500 and "Internal server error" when error is empty object', () => {
        // Arrange
        const err = {};

        // Act
        errorHandler(err, req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });

    // Console.error logging for 500 errors
    it('should log error to console when status is 500', () => {
        // Arrange
        const err = { status: 500, message: 'Internal error' };

        // Act
        errorHandler(err, req, res, next);

        // Assert
        expect(console.error).toHaveBeenCalledWith('Unexpected error:', err);
    });

    it('should log error to console when status defaults to 500', () => {
        // Arrange
        const err = new Error('Unexpected');

        // Act
        errorHandler(err, req, res, next);

        // Assert
        expect(console.error).toHaveBeenCalledWith('Unexpected error:', err);
    });

    it('should not log to console when status is not 500', () => {
        // Arrange
        const err = { status: 400, message: 'Bad Request' };

        // Act
        errorHandler(err, req, res, next);

        // Assert
        expect(console.error).not.toHaveBeenCalled();
    });

    it('should not log to console for 401 errors', () => {
        // Arrange
        const err = { status: 401, message: 'Unauthorized' };

        // Act
        errorHandler(err, req, res, next);

        // Assert
        expect(console.error).not.toHaveBeenCalled();
    });

    it('should not log to console for 404 errors', () => {
        // Arrange
        const err = { status: 404, message: 'Not Found' };

        // Act
        errorHandler(err, req, res, next);

        // Assert
        expect(console.error).not.toHaveBeenCalled();
    });

    // Error as native Error object
    it('should handle native Error objects', () => {
        // Arrange
        const err = new Error('Native error');

        // Act
        errorHandler(err, req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Native error' });
    });
});
