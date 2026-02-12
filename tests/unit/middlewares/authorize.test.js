const authorize = require('../../../src/middlewares/authorize');

describe('Authorize Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
    });

    // Happy path - authorized
    it('should call next when user has required role ADMIN', () => {
        // Arrange
        req.user = { id: '1', role: 'ADMIN' };
        const middleware = authorize('ADMIN');

        // Act
        middleware(req, res, next);

        // Assert
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should call next when user has one of multiple allowed roles', () => {
        // Arrange
        req.user = { id: '1', role: 'USER' };
        const middleware = authorize('ADMIN', 'USER');

        // Act
        middleware(req, res, next);

        // Assert
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('should call next when user role is USER and USER is allowed', () => {
        // Arrange
        req.user = { id: '1', role: 'USER' };
        const middleware = authorize('USER');

        // Act
        middleware(req, res, next);

        // Assert
        expect(next).toHaveBeenCalledTimes(1);
    });

    // Unauthorized - missing req.user
    it('should return 401 when req.user is not set', () => {
        // Arrange
        req.user = undefined;
        const middleware = authorize('ADMIN');

        // Act
        middleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when req.user is null', () => {
        // Arrange
        req.user = null;
        const middleware = authorize('ADMIN');

        // Act
        middleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
    });

    // Forbidden - wrong role
    it('should return 403 when USER tries to access ADMIN-only route', () => {
        // Arrange
        req.user = { id: '1', role: 'USER' };
        const middleware = authorize('ADMIN');

        // Act
        middleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Insufficient permissions' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when user has unexpected role', () => {
        // Arrange
        req.user = { id: '1', role: 'GUEST' };
        const middleware = authorize('ADMIN', 'USER');

        // Act
        middleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Insufficient permissions' });
    });

    it('should return 403 when user role is undefined', () => {
        // Arrange
        req.user = { id: '1' };
        const middleware = authorize('ADMIN');

        // Act
        middleware(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Insufficient permissions' });
    });

    // Function returns a middleware function
    it('should return a function', () => {
        // Act
        const middleware = authorize('ADMIN');

        // Assert
        expect(typeof middleware).toBe('function');
    });
});
