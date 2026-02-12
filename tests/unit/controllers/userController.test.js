jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mocked-uuid'),
}));
jest.mock('../../../src/services/userService');

const userService = require('../../../src/services/userService');
const userController = require('../../../src/controllers/userController');

describe('UserController', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {},
            params: {},
            user: { id: 'admin-id', role: 'ADMIN', email: 'admin@example.com' },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
    });

    // ===========================
    // getAll
    // ===========================
    describe('getAll', () => {
        const users = [
            { id: '1', name: 'Admin', email: 'admin@example.com', age: 30, role: 'ADMIN' },
            { id: '2', name: 'User', email: 'user@example.com', age: 25, role: 'USER' },
        ];

        it('should return 200 with all users when role is ADMIN', () => {
            // Arrange
            userService.findAll.mockReturnValue(users);

            // Act
            userController.getAll(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(users);
            expect(userService.findAll).toHaveBeenCalledTimes(1);
        });

        it('should return 200 with only own data when role is USER', () => {
            // Arrange
            req.user = { id: 'user-id', role: 'USER', email: 'user@example.com' };
            const ownUser = { id: 'user-id', name: 'User', email: 'user@example.com', age: 25, role: 'USER' };
            userService.findById.mockReturnValue(ownUser);

            // Act
            userController.getAll(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([ownUser]);
            expect(userService.findById).toHaveBeenCalledWith('user-id');
            expect(userService.findAll).not.toHaveBeenCalled();
        });

        it('should call next when service throws error for ADMIN', () => {
            // Arrange
            const error = new Error('DB error');
            userService.findAll.mockImplementation(() => { throw error; });

            // Act
            userController.getAll(req, res, next);

            // Assert
            expect(next).toHaveBeenCalledWith(error);
        });

        it('should call next when service throws error for USER', () => {
            // Arrange
            req.user = { id: 'user-id', role: 'USER' };
            const error = { status: 404, message: 'User not found' };
            userService.findById.mockImplementation(() => { throw error; });

            // Act
            userController.getAll(req, res, next);

            // Assert
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    // ===========================
    // getById
    // ===========================
    describe('getById', () => {
        const user = { id: 'user-uuid-1', name: 'John', email: 'john@example.com', age: 25, role: 'USER' };

        it('should return 200 with user when ADMIN requests any user', () => {
            // Arrange
            req.params = { id: 'user-uuid-1' };
            userService.findById.mockReturnValue(user);

            // Act
            userController.getById(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(user);
            expect(userService.findById).toHaveBeenCalledWith('user-uuid-1');
        });

        it('should return 200 when USER requests own data', () => {
            // Arrange
            req.user = { id: 'user-uuid-1', role: 'USER' };
            req.params = { id: 'user-uuid-1' };
            userService.findById.mockReturnValue(user);

            // Act
            userController.getById(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(user);
        });

        it('should return 403 when USER requests another user data', () => {
            // Arrange
            req.user = { id: 'user-uuid-1', role: 'USER' };
            req.params = { id: 'different-user-id' };

            // Act
            userController.getById(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Insufficient permissions' });
            expect(userService.findById).not.toHaveBeenCalled();
        });

        it('should call next when service throws', () => {
            // Arrange
            req.params = { id: 'nonexistent-id' };
            const error = { status: 404, message: 'User not found' };
            userService.findById.mockImplementation(() => { throw error; });

            // Act
            userController.getById(req, res, next);

            // Assert
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    // ===========================
    // create
    // ===========================
    describe('create', () => {
        const validBody = {
            name: 'New User',
            email: 'new@example.com',
            age: 25,
            password: 'password123',
        };

        const createdUser = {
            id: 'new-uuid',
            name: 'New User',
            email: 'new@example.com',
            age: 25,
            role: 'USER',
        };

        it('should return 201 with created user when data is valid', () => {
            // Arrange
            req.body = validBody;
            userService.create.mockReturnValue(createdUser);

            // Act
            userController.create(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(createdUser);
            expect(userService.create).toHaveBeenCalledWith({
                name: 'New User',
                email: 'new@example.com',
                age: 25,
                password: 'password123',
                role: undefined,
            });
        });

        it('should pass role to service when provided', () => {
            // Arrange
            req.body = { ...validBody, role: 'ADMIN' };
            userService.create.mockReturnValue({ ...createdUser, role: 'ADMIN' });

            // Act
            userController.create(req, res, next);

            // Assert
            expect(userService.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'ADMIN' }));
        });

        it('should return 400 when name is missing', () => {
            // Arrange
            req.body = { email: 'test@test.com', age: 25, password: 'password123' };

            // Act
            userController.create(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Name, email, age and password are required' });
            expect(userService.create).not.toHaveBeenCalled();
        });

        it('should return 400 when email is missing', () => {
            // Arrange
            req.body = { name: 'Test', age: 25, password: 'password123' };

            // Act
            userController.create(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Name, email, age and password are required' });
        });

        it('should return 400 when age is missing (undefined)', () => {
            // Arrange
            req.body = { name: 'Test', email: 'test@test.com', password: 'password123' };

            // Act
            userController.create(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Name, email, age and password are required' });
        });

        it('should return 400 when password is missing', () => {
            // Arrange
            req.body = { name: 'Test', email: 'test@test.com', age: 25 };

            // Act
            userController.create(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Name, email, age and password are required' });
        });

        it('should not return 400 when age is 0 (falsy but defined)', () => {
            // Arrange
            req.body = { name: 'Test', email: 'test@test.com', age: 0, password: 'password123' };
            userService.create.mockImplementation(() => { throw { status: 400, message: 'User must be at least 18 years old' }; });

            // Act
            userController.create(req, res, next);

            // Assert
            // age === 0 passes the controller check since it checks age === undefined
            expect(userService.create).toHaveBeenCalled();
        });

        it('should call next when service throws', () => {
            // Arrange
            req.body = validBody;
            const error = { status: 409, message: 'Email already in use' };
            userService.create.mockImplementation(() => { throw error; });

            // Act
            userController.create(req, res, next);

            // Assert
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    // ===========================
    // update
    // ===========================
    describe('update', () => {
        it('should return 200 with updated user', () => {
            // Arrange
            req.params = { id: 'user-uuid-1' };
            req.body = { name: 'Updated Name' };
            const updatedUser = { id: 'user-uuid-1', name: 'Updated Name', email: 'john@example.com', age: 25, role: 'USER' };
            userService.update.mockReturnValue(updatedUser);

            // Act
            userController.update(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(updatedUser);
            expect(userService.update).toHaveBeenCalledWith('user-uuid-1', { name: 'Updated Name' });
        });

        it('should call next when service throws 404', () => {
            // Arrange
            req.params = { id: 'nonexistent-id' };
            req.body = { name: 'Test' };
            const error = { status: 404, message: 'User not found' };
            userService.update.mockImplementation(() => { throw error; });

            // Act
            userController.update(req, res, next);

            // Assert
            expect(next).toHaveBeenCalledWith(error);
        });

        it('should call next when service throws validation error', () => {
            // Arrange
            req.params = { id: 'user-uuid-1' };
            req.body = { password: 'short' };
            const error = { status: 400, message: 'Password must be at least 8 characters long' };
            userService.update.mockImplementation(() => { throw error; });

            // Act
            userController.update(req, res, next);

            // Assert
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    // ===========================
    // delete
    // ===========================
    describe('delete', () => {
        it('should return 204 when user is deleted successfully', () => {
            // Arrange
            req.params = { id: 'user-uuid-1' };
            userService.delete.mockReturnValue(true);

            // Act
            userController.delete(req, res, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });

        it('should call next when service throws 404', () => {
            // Arrange
            req.params = { id: 'nonexistent-id' };
            const error = { status: 404, message: 'User not found' };
            userService.delete.mockImplementation(() => { throw error; });

            // Act
            userController.delete(req, res, next);

            // Assert
            expect(next).toHaveBeenCalledWith(error);
        });
    });
});
