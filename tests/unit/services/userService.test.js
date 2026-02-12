const bcrypt = require('bcryptjs');

jest.mock('../../../src/repositories/userRepository');
jest.mock('bcryptjs');
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'generated-uuid'),
}));

const userRepository = require('../../../src/repositories/userRepository');
const userService = require('../../../src/services/userService');
const { v4: uuidv4 } = require('uuid');

describe('UserService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const sampleUser = {
        id: 'user-uuid-1',
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
        role: 'USER',
        created_at: '2026-02-10T12:00:00.000Z',
        updated_at: '2026-02-10T12:00:00.000Z',
    };

    const sampleUser2 = {
        id: 'user-uuid-2',
        name: 'Jane Doe',
        email: 'jane@example.com',
        age: 30,
        role: 'ADMIN',
        created_at: '2026-02-10T12:00:00.000Z',
        updated_at: '2026-02-10T12:00:00.000Z',
    };

    // ===========================
    // findAll
    // ===========================
    describe('findAll', () => {
        it('should return all users', () => {
            // Arrange
            userRepository.findAll.mockReturnValue([sampleUser, sampleUser2]);

            // Act
            const result = userService.findAll();

            // Assert
            expect(result).toEqual([sampleUser, sampleUser2]);
            expect(userRepository.findAll).toHaveBeenCalledTimes(1);
        });

        it('should return empty array when no users exist', () => {
            // Arrange
            userRepository.findAll.mockReturnValue([]);

            // Act
            const result = userService.findAll();

            // Assert
            expect(result).toEqual([]);
        });
    });

    // ===========================
    // findById
    // ===========================
    describe('findById', () => {
        it('should return user when found by id', () => {
            // Arrange
            userRepository.findById.mockReturnValue(sampleUser);

            // Act
            const result = userService.findById('user-uuid-1');

            // Assert
            expect(result).toEqual(sampleUser);
            expect(userRepository.findById).toHaveBeenCalledWith('user-uuid-1');
        });

        it('should throw 404 when user is not found', () => {
            // Arrange
            userRepository.findById.mockReturnValue(null);

            // Act & Assert
            expect(() => userService.findById('nonexistent-id'))
                .toThrow(expect.objectContaining({ status: 404, message: 'User not found' }));
        });

        it('should throw 404 when findById returns undefined', () => {
            // Arrange
            userRepository.findById.mockReturnValue(undefined);

            // Act & Assert
            expect(() => userService.findById('unknown'))
                .toThrow(expect.objectContaining({ status: 404, message: 'User not found' }));
        });
    });

    // ===========================
    // create
    // ===========================
    describe('create', () => {
        const validCreateData = {
            name: 'New User',
            email: 'new@example.com',
            age: 25,
            password: 'password123',
        };

        // Happy path
        it('should create user with valid data', () => {
            // Arrange
            userRepository.findByEmail.mockReturnValue(null);
            bcrypt.hashSync.mockReturnValue('hashed-password');
            const createdUser = { ...sampleUser, id: 'generated-uuid', name: 'New User', email: 'new@example.com' };
            userRepository.create.mockReturnValue(createdUser);

            // Act
            const result = userService.create(validCreateData);

            // Assert
            expect(result).toEqual(createdUser);
            expect(userRepository.create).toHaveBeenCalledWith({
                id: 'generated-uuid',
                name: 'New User',
                email: 'new@example.com',
                age: 25,
                password: 'hashed-password',
                role: 'USER',
            });
        });

        it('should assign default role USER when role not provided', () => {
            // Arrange
            userRepository.findByEmail.mockReturnValue(null);
            bcrypt.hashSync.mockReturnValue('hashed-password');
            userRepository.create.mockReturnValue(sampleUser);

            // Act
            userService.create(validCreateData);

            // Assert
            const createArg = userRepository.create.mock.calls[0][0];
            expect(createArg.role).toBe('USER');
        });

        it('should use provided role when specified', () => {
            // Arrange
            userRepository.findByEmail.mockReturnValue(null);
            bcrypt.hashSync.mockReturnValue('hashed-password');
            userRepository.create.mockReturnValue(sampleUser);

            // Act
            userService.create({ ...validCreateData, role: 'ADMIN' });

            // Assert
            const createArg = userRepository.create.mock.calls[0][0];
            expect(createArg.role).toBe('ADMIN');
        });

        it('should hash the password with bcrypt', () => {
            // Arrange
            userRepository.findByEmail.mockReturnValue(null);
            bcrypt.hashSync.mockReturnValue('hashed-pass');
            userRepository.create.mockReturnValue(sampleUser);

            // Act
            userService.create(validCreateData);

            // Assert
            expect(bcrypt.hashSync).toHaveBeenCalledWith('password123', 10);
        });

        it('should generate UUID for user id', () => {
            // Arrange
            userRepository.findByEmail.mockReturnValue(null);
            bcrypt.hashSync.mockReturnValue('hash');
            userRepository.create.mockReturnValue(sampleUser);

            // Act
            userService.create(validCreateData);

            // Assert
            expect(uuidv4).toHaveBeenCalled();
            const createArg = userRepository.create.mock.calls[0][0];
            expect(createArg.id).toBe('generated-uuid');
        });

        // Email validation
        it('should throw 409 when email already exists', () => {
            // Arrange
            userRepository.findByEmail.mockReturnValue(sampleUser);

            // Act & Assert
            expect(() => userService.create(validCreateData))
                .toThrow(expect.objectContaining({ status: 409, message: 'Email already in use' }));
        });

        it('should throw 400 when email is empty string', () => {
            // Act & Assert
            expect(() => userService.create({ ...validCreateData, email: '' }))
                .toThrow(expect.objectContaining({ status: 400, message: 'Email is required' }));
        });

        it('should throw 400 when email is null', () => {
            // Act & Assert
            expect(() => userService.create({ ...validCreateData, email: null }))
                .toThrow(expect.objectContaining({ status: 400, message: 'Email is required' }));
        });

        it('should throw 400 when email is undefined', () => {
            // Act & Assert
            expect(() => userService.create({ ...validCreateData, email: undefined }))
                .toThrow(expect.objectContaining({ status: 400, message: 'Email is required' }));
        });

        it('should throw 400 when email is not a string', () => {
            // Act & Assert
            expect(() => userService.create({ ...validCreateData, email: 12345 }))
                .toThrow(expect.objectContaining({ status: 400, message: 'Email is required' }));
        });

        it('should throw 400 when email has invalid format', () => {
            // Act & Assert
            expect(() => userService.create({ ...validCreateData, email: 'invalid-email' }))
                .toThrow(expect.objectContaining({ status: 400, message: 'Invalid email format' }));
        });

        it('should throw 400 when email is missing @ sign', () => {
            // Act & Assert
            expect(() => userService.create({ ...validCreateData, email: 'invalidemail.com' }))
                .toThrow(expect.objectContaining({ status: 400, message: 'Invalid email format' }));
        });

        it('should throw 400 when email is missing domain', () => {
            // Act & Assert
            expect(() => userService.create({ ...validCreateData, email: 'test@' }))
                .toThrow(expect.objectContaining({ status: 400, message: 'Invalid email format' }));
        });

        it('should throw 400 when email has spaces', () => {
            // Act & Assert
            expect(() => userService.create({ ...validCreateData, email: 'test @email.com' }))
                .toThrow(expect.objectContaining({ status: 400, message: 'Invalid email format' }));
        });

        // Password validation - boundary analysis
        it('should throw 400 when password is empty', () => {
            // Act & Assert
            expect(() => userService.create({ ...validCreateData, password: '' }))
                .toThrow(expect.objectContaining({ status: 400, message: 'Password is required' }));
        });

        it('should throw 400 when password is null', () => {
            // Act & Assert
            expect(() => userService.create({ ...validCreateData, password: null }))
                .toThrow(expect.objectContaining({ status: 400, message: 'Password is required' }));
        });

        it('should throw 400 when password is undefined', () => {
            // Act & Assert
            expect(() => userService.create({ ...validCreateData, password: undefined }))
                .toThrow(expect.objectContaining({ status: 400, message: 'Password is required' }));
        });

        it('should throw 400 when password is not a string', () => {
            // Act & Assert
            expect(() => userService.create({ ...validCreateData, password: 12345678 }))
                .toThrow(expect.objectContaining({ status: 400, message: 'Password is required' }));
        });

        it('should throw 400 when password has 7 characters (boundary)', () => {
            // Act & Assert
            expect(() => userService.create({ ...validCreateData, password: '1234567' }))
                .toThrow(expect.objectContaining({ status: 400, message: 'Password must be at least 8 characters long' }));
        });

        it('should accept password with exactly 8 characters (boundary)', () => {
            // Arrange
            userRepository.findByEmail.mockReturnValue(null);
            bcrypt.hashSync.mockReturnValue('hash');
            userRepository.create.mockReturnValue(sampleUser);

            // Act & Assert - should not throw
            expect(() => userService.create({ ...validCreateData, password: '12345678' })).not.toThrow();
        });

        it('should accept password with more than 8 characters', () => {
            // Arrange
            userRepository.findByEmail.mockReturnValue(null);
            bcrypt.hashSync.mockReturnValue('hash');
            userRepository.create.mockReturnValue(sampleUser);

            // Act & Assert
            expect(() => userService.create({ ...validCreateData, password: 'longpassword123' })).not.toThrow();
        });

        // Age validation - boundary analysis
        it('should throw 400 when age is undefined', () => {
            // Act & Assert
            expect(() => userService.create({ ...validCreateData, age: undefined }))
                .toThrow(expect.objectContaining({ status: 400, message: 'Age is required' }));
        });

        it('should throw 400 when age is null', () => {
            // Act & Assert
            expect(() => userService.create({ ...validCreateData, age: null }))
                .toThrow(expect.objectContaining({ status: 400, message: 'Age is required' }));
        });

        it('should throw 400 when age is not a number', () => {
            // Act & Assert
            expect(() => userService.create({ ...validCreateData, age: 'twenty' }))
                .toThrow(expect.objectContaining({ status: 400, message: 'Age must be an integer' }));
        });

        it('should throw 400 when age is a float', () => {
            // Act & Assert
            expect(() => userService.create({ ...validCreateData, age: 18.5 }))
                .toThrow(expect.objectContaining({ status: 400, message: 'Age must be an integer' }));
        });

        it('should throw 400 when age is 17 (boundary - below minimum)', () => {
            // Act & Assert
            expect(() => userService.create({ ...validCreateData, age: 17 }))
                .toThrow(expect.objectContaining({ status: 400, message: 'User must be at least 18 years old' }));
        });

        it('should accept age of 18 (boundary - minimum)', () => {
            // Arrange
            userRepository.findByEmail.mockReturnValue(null);
            bcrypt.hashSync.mockReturnValue('hash');
            userRepository.create.mockReturnValue(sampleUser);

            // Act & Assert
            expect(() => userService.create({ ...validCreateData, age: 18 })).not.toThrow();
        });

        it('should throw 400 when age is 0', () => {
            // Act & Assert
            expect(() => userService.create({ ...validCreateData, age: 0 }))
                .toThrow(expect.objectContaining({ status: 400, message: 'User must be at least 18 years old' }));
        });

        it('should throw 400 when age is negative', () => {
            // Act & Assert
            expect(() => userService.create({ ...validCreateData, age: -1 }))
                .toThrow(expect.objectContaining({ status: 400, message: 'User must be at least 18 years old' }));
        });

        it('should accept age of 19 (above minimum)', () => {
            // Arrange
            userRepository.findByEmail.mockReturnValue(null);
            bcrypt.hashSync.mockReturnValue('hash');
            userRepository.create.mockReturnValue(sampleUser);

            // Act & Assert
            expect(() => userService.create({ ...validCreateData, age: 19 })).not.toThrow();
        });

        // Validation order: email validated before checking uniqueness
        it('should validate email format before checking uniqueness', () => {
            // Act & Assert
            expect(() => userService.create({ ...validCreateData, email: 'invalid' })).toThrow();
            expect(userRepository.findByEmail).not.toHaveBeenCalled();
        });
    });

    // ===========================
    // update
    // ===========================
    describe('update', () => {
        const existingUser = {
            id: 'user-uuid-1',
            name: 'John Doe',
            email: 'john@example.com',
            age: 25,
            password: 'hashed-password',
            role: 'USER',
        };

        it('should update user when data is valid', () => {
            // Arrange
            userRepository.findById.mockReturnValue(existingUser);
            const updatedUser = { ...sampleUser, name: 'John Updated' };
            userRepository.update.mockReturnValue(updatedUser);

            // Act
            const result = userService.update('user-uuid-1', { name: 'John Updated' });

            // Assert
            expect(result).toEqual(updatedUser);
            expect(userRepository.update).toHaveBeenCalledWith('user-uuid-1', { name: 'John Updated' });
        });

        it('should throw 404 when user to update is not found', () => {
            // Arrange
            userRepository.findById.mockReturnValue(null);

            // Act & Assert
            expect(() => userService.update('nonexistent-id', { name: 'Test' }))
                .toThrow(expect.objectContaining({ status: 404, message: 'User not found' }));
        });

        // Email update validations
        it('should allow updating email to a new unique email', () => {
            // Arrange
            userRepository.findById.mockReturnValue(existingUser);
            userRepository.findByEmail.mockReturnValue(null);
            userRepository.update.mockReturnValue({ ...existingUser, email: 'newemail@example.com' });

            // Act
            const result = userService.update('user-uuid-1', { email: 'newemail@example.com' });

            // Assert
            expect(result.email).toBe('newemail@example.com');
        });

        it('should throw 409 when updated email already exists', () => {
            // Arrange
            userRepository.findById.mockReturnValue(existingUser);
            userRepository.findByEmail.mockReturnValue(sampleUser2);

            // Act & Assert
            expect(() => userService.update('user-uuid-1', { email: 'jane@example.com' }))
                .toThrow(expect.objectContaining({ status: 409, message: 'Email already in use' }));
        });

        it('should not check uniqueness when email is unchanged', () => {
            // Arrange
            userRepository.findById.mockReturnValue(existingUser);
            userRepository.update.mockReturnValue(existingUser);

            // Act
            userService.update('user-uuid-1', { email: 'john@example.com' });

            // Assert
            expect(userRepository.findByEmail).not.toHaveBeenCalled();
        });

        it('should validate email format when email is changed', () => {
            // Arrange
            userRepository.findById.mockReturnValue(existingUser);
            userRepository.findByEmail.mockReturnValue(null);

            // Act & Assert
            expect(() => userService.update('user-uuid-1', { email: 'invalid-email' }))
                .toThrow(expect.objectContaining({ status: 400, message: 'Invalid email format' }));
        });

        // Password update validations
        it('should hash new password when provided', () => {
            // Arrange
            userRepository.findById.mockReturnValue(existingUser);
            bcrypt.hashSync.mockReturnValue('new-hashed-password');
            userRepository.update.mockReturnValue(existingUser);

            // Act
            userService.update('user-uuid-1', { password: 'newpassword123' });

            // Assert
            expect(bcrypt.hashSync).toHaveBeenCalledWith('newpassword123', 10);
            expect(userRepository.update).toHaveBeenCalledWith('user-uuid-1', { password: 'new-hashed-password' });
        });

        it('should throw 400 when new password is too short (7 chars)', () => {
            // Arrange
            userRepository.findById.mockReturnValue(existingUser);

            // Act & Assert
            expect(() => userService.update('user-uuid-1', { password: '1234567' }))
                .toThrow(expect.objectContaining({ status: 400, message: 'Password must be at least 8 characters long' }));
        });

        it('should accept new password with exactly 8 characters', () => {
            // Arrange
            userRepository.findById.mockReturnValue(existingUser);
            bcrypt.hashSync.mockReturnValue('hash');
            userRepository.update.mockReturnValue(existingUser);

            // Act & Assert
            expect(() => userService.update('user-uuid-1', { password: '12345678' })).not.toThrow();
        });

        // Age update validations
        it('should throw 400 when updated age is below 18', () => {
            // Arrange
            userRepository.findById.mockReturnValue(existingUser);

            // Act & Assert
            expect(() => userService.update('user-uuid-1', { age: 17 }))
                .toThrow(expect.objectContaining({ status: 400, message: 'User must be at least 18 years old' }));
        });

        it('should accept updated age of 18', () => {
            // Arrange
            userRepository.findById.mockReturnValue(existingUser);
            userRepository.update.mockReturnValue({ ...existingUser, age: 18 });

            // Act & Assert
            expect(() => userService.update('user-uuid-1', { age: 18 })).not.toThrow();
        });

        it('should throw 400 when updated age is not an integer', () => {
            // Arrange
            userRepository.findById.mockReturnValue(existingUser);

            // Act & Assert
            expect(() => userService.update('user-uuid-1', { age: 18.5 }))
                .toThrow(expect.objectContaining({ status: 400, message: 'Age must be an integer' }));
        });

        it('should throw 400 when updated age is null', () => {
            // Arrange
            userRepository.findById.mockReturnValue(existingUser);

            // Act & Assert
            expect(() => userService.update('user-uuid-1', { age: null }))
                .toThrow(expect.objectContaining({ status: 400, message: 'Age is required' }));
        });

        it('should not validate age when age is not in update data', () => {
            // Arrange
            userRepository.findById.mockReturnValue(existingUser);
            userRepository.update.mockReturnValue(existingUser);

            // Act & Assert - should not throw
            expect(() => userService.update('user-uuid-1', { name: 'New Name' })).not.toThrow();
        });

        it('should not validate password when password is not in update data', () => {
            // Arrange
            userRepository.findById.mockReturnValue(existingUser);
            userRepository.update.mockReturnValue(existingUser);

            // Act
            userService.update('user-uuid-1', { name: 'Test' });

            // Assert
            expect(bcrypt.hashSync).not.toHaveBeenCalled();
        });

        it('should not validate email when email is not in update data', () => {
            // Arrange
            userRepository.findById.mockReturnValue(existingUser);
            userRepository.update.mockReturnValue(existingUser);

            // Act
            userService.update('user-uuid-1', { name: 'Test' });

            // Assert
            expect(userRepository.findByEmail).not.toHaveBeenCalled();
        });
    });

    // ===========================
    // delete
    // ===========================
    describe('delete', () => {
        it('should delete user when user exists', () => {
            // Arrange
            userRepository.findById.mockReturnValue(sampleUser);
            userRepository.delete.mockReturnValue(true);

            // Act
            const result = userService.delete('user-uuid-1');

            // Assert
            expect(result).toBe(true);
            expect(userRepository.delete).toHaveBeenCalledWith('user-uuid-1');
        });

        it('should throw 404 when user to delete is not found', () => {
            // Arrange
            userRepository.findById.mockReturnValue(null);

            // Act & Assert
            expect(() => userService.delete('nonexistent-id'))
                .toThrow(expect.objectContaining({ status: 404, message: 'User not found' }));
        });

        it('should throw 404 when user to delete returns undefined', () => {
            // Arrange
            userRepository.findById.mockReturnValue(undefined);

            // Act & Assert
            expect(() => userService.delete('unknown-id'))
                .toThrow(expect.objectContaining({ status: 404, message: 'User not found' }));
        });

        it('should check user existence before deleting', () => {
            // Arrange
            userRepository.findById.mockReturnValue(null);

            // Act & Assert
            expect(() => userService.delete('nonexistent-id')).toThrow();
            expect(userRepository.delete).not.toHaveBeenCalled();
        });
    });

    // ===========================
    // _validateEmail (tested through create)
    // ===========================
    describe('email validation (via create)', () => {
        beforeEach(() => {
            userRepository.findByEmail.mockReturnValue(null);
            bcrypt.hashSync.mockReturnValue('hash');
            userRepository.create.mockReturnValue(sampleUser);
        });

        it('should accept valid email format', () => {
            // Act & Assert
            expect(() => userService.create({
                name: 'Test', email: 'valid@email.com', age: 20, password: 'password123'
            })).not.toThrow();
        });

        it('should accept email with subdomain', () => {
            // Act & Assert
            expect(() => userService.create({
                name: 'Test', email: 'user@sub.domain.com', age: 20, password: 'password123'
            })).not.toThrow();
        });

        it('should reject email without TLD', () => {
            // Act & Assert
            expect(() => userService.create({
                name: 'Test', email: 'user@domain', age: 20, password: 'password123'
            })).toThrow(expect.objectContaining({ status: 400, message: 'Invalid email format' }));
        });
    });

    // ===========================
    // _validateAge edge cases (tested through create)
    // ===========================
    describe('age validation edge cases (via create)', () => {
        const baseData = { name: 'Test', email: 'test@email.com', password: 'password123' };

        it('should throw when age is a boolean', () => {
            expect(() => userService.create({ ...baseData, age: true }))
                .toThrow(expect.objectContaining({ status: 400, message: 'Age must be an integer' }));
        });

        it('should throw when age is NaN', () => {
            expect(() => userService.create({ ...baseData, age: NaN }))
                .toThrow(expect.objectContaining({ status: 400, message: 'Age must be an integer' }));
        });
    });
});
