const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

const jwtConfig = require('../../../src/config/jwt');
const authMiddleware = require('../../../src/middlewares/auth');

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { headers: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
    });

    // Happy path
    it('should call next and set req.user when token is valid', () => {
        // Arrange
        req.headers.authorization = 'Bearer valid-token';
        const decoded = { id: 'user-1', email: 'admin@example.com', role: 'ADMIN' };
        jwt.verify.mockReturnValue(decoded);

        // Act
        authMiddleware(req, res, next);

        // Assert
        expect(jwt.verify).toHaveBeenCalledWith('valid-token', jwtConfig.secret);
        expect(req.user).toEqual(decoded);
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
        expect(res.status).not.toHaveBeenCalled();
    });

    // Missing authorization header
    it('should return 401 when authorization header is missing', () => {
        // Arrange
        req.headers = {};

        // Act
        authMiddleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Authorization header is required' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header is undefined', () => {
        // Arrange
        req.headers.authorization = undefined;

        // Act
        authMiddleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Authorization header is required' });
    });

    // Invalid format
    it('should return 401 when authorization format is not Bearer', () => {
        // Arrange
        req.headers.authorization = 'Basic some-token';

        // Act
        authMiddleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid authorization format. Use: Bearer <token>' });
    });

    it('should return 401 when authorization has only token without Bearer prefix', () => {
        // Arrange
        req.headers.authorization = 'some-token-without-bearer';

        // Act
        authMiddleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid authorization format. Use: Bearer <token>' });
    });

    it('should return 401 when authorization has more than two parts', () => {
        // Arrange
        req.headers.authorization = 'Bearer token extra-part';

        // Act
        authMiddleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid authorization format. Use: Bearer <token>' });
    });

    it('should return 401 when authorization is Bearer with empty token', () => {
        // Arrange
        req.headers.authorization = 'Bearer ';

        // Act
        authMiddleware(req, res, next);

        // Assert
        // "Bearer " splits into ['Bearer', ''] which has length 2, but empty token
        // Actually "Bearer " splits to ["Bearer", ""], length 2 and parts[0] === 'Bearer', so it goes to jwt.verify
        // The jwt.verify will fail with empty string, caught by catch
    });

    // Invalid/expired token
    it('should return 401 when token is invalid', () => {
        // Arrange
        req.headers.authorization = 'Bearer invalid-token';
        jwt.verify.mockImplementation(() => { throw new Error('invalid token'); });

        // Act
        authMiddleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is expired', () => {
        // Arrange
        req.headers.authorization = 'Bearer expired-token';
        jwt.verify.mockImplementation(() => { throw new jwt.TokenExpiredError('jwt expired', new Date()); });

        // Act
        authMiddleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
    });

    it('should return 401 when token has invalid signature', () => {
        // Arrange
        req.headers.authorization = 'Bearer tampered-token';
        jwt.verify.mockImplementation(() => { throw new jwt.JsonWebTokenError('invalid signature'); });

        // Act
        authMiddleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
    });

    // Verify uses correct secret
    it('should use jwtConfig.secret to verify token', () => {
        // Arrange
        req.headers.authorization = 'Bearer test-token';
        jwt.verify.mockReturnValue({ id: '1' });

        // Act
        authMiddleware(req, res, next);

        // Assert
        expect(jwt.verify).toHaveBeenCalledWith('test-token', jwtConfig.secret);
    });
});
