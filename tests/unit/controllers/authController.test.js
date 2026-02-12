jest.mock('../../../src/services/authService');

const authService = require('../../../src/services/authService');
const authController = require('../../../src/controllers/authController');

describe('AuthController', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
    });

    describe('login', () => {
        // Happy path
        it('should return 200 and token when login is successful', () => {
            // Arrange
            req.body = { email: 'admin@example.com', password: 'admin123!' };
            const loginResult = {
                token: 'jwt-token',
                user: { id: '1', name: 'Admin', email: 'admin@example.com', role: 'ADMIN' },
            };
            authService.login.mockReturnValue(loginResult);

            // Act
            authController.login(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(loginResult);
            expect(authService.login).toHaveBeenCalledWith('admin@example.com', 'admin123!');
        });

        // Missing fields
        it('should return 400 when email is missing', () => {
            // Arrange
            req.body = { password: 'admin123!' };

            // Act
            authController.login(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Email and password are required' });
            expect(authService.login).not.toHaveBeenCalled();
        });

        it('should return 400 when password is missing', () => {
            // Arrange
            req.body = { email: 'admin@example.com' };

            // Act
            authController.login(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Email and password are required' });
            expect(authService.login).not.toHaveBeenCalled();
        });

        it('should return 400 when both email and password are missing', () => {
            // Arrange
            req.body = {};

            // Act
            authController.login(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Email and password are required' });
        });

        it('should return 400 when email is empty string', () => {
            // Arrange
            req.body = { email: '', password: 'password123' };

            // Act
            authController.login(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Email and password are required' });
        });

        it('should return 400 when password is empty string', () => {
            // Arrange
            req.body = { email: 'admin@example.com', password: '' };

            // Act
            authController.login(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Email and password are required' });
        });

        // Error forwarding
        it('should call next with error when authService throws', () => {
            // Arrange
            req.body = { email: 'admin@example.com', password: 'wrong' };
            const error = { status: 401, message: 'Invalid email or password' };
            authService.login.mockImplementation(() => { throw error; });

            // Act
            authController.login(req, res, next);

            // Assert
            expect(next).toHaveBeenCalledWith(error);
        });

        it('should not send response when authService throws', () => {
            // Arrange
            req.body = { email: 'admin@example.com', password: 'wrong' };
            authService.login.mockImplementation(() => { throw new Error('fail'); });

            // Act
            authController.login(req, res, next);

            // Assert
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });
    });
});
