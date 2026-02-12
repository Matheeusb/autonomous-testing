const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

jest.mock('../../../src/repositories/userRepository');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

const userRepository = require('../../../src/repositories/userRepository');
const jwtConfig = require('../../../src/config/jwt');
const authService = require('../../../src/services/authService');

describe('AuthService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('login', () => {
        const validUser = {
            id: 'user-uuid-1',
            name: 'Admin',
            email: 'admin@example.com',
            password: '$2a$10$hashedpassword',
            role: 'ADMIN',
        };

        // Happy path
        describe('should return token and user data when credentials are valid', () => {
            it('should return token and user when email and password are correct', () => {
                // Arrange
                userRepository.findByEmail.mockReturnValue(validUser);
                bcrypt.compareSync.mockReturnValue(true);
                jwt.sign.mockReturnValue('mocked-jwt-token');

                // Act
                const result = authService.login('admin@example.com', 'admin123!');

                // Assert
                expect(result).toEqual({
                    token: 'mocked-jwt-token',
                    user: {
                        id: validUser.id,
                        name: validUser.name,
                        email: validUser.email,
                        role: validUser.role,
                    },
                });
                expect(userRepository.findByEmail).toHaveBeenCalledWith('admin@example.com');
                expect(bcrypt.compareSync).toHaveBeenCalledWith('admin123!', validUser.password);
                expect(jwt.sign).toHaveBeenCalledWith(
                    { id: validUser.id, email: validUser.email, role: validUser.role },
                    jwtConfig.secret,
                    { expiresIn: jwtConfig.expiresIn }
                );
            });
        });

        // Token payload validation
        it('should include id, email and role in JWT payload', () => {
            // Arrange
            userRepository.findByEmail.mockReturnValue(validUser);
            bcrypt.compareSync.mockReturnValue(true);
            jwt.sign.mockReturnValue('token');

            // Act
            authService.login('admin@example.com', 'admin123!');

            // Assert
            const payload = jwt.sign.mock.calls[0][0];
            expect(payload).toHaveProperty('id', validUser.id);
            expect(payload).toHaveProperty('email', validUser.email);
            expect(payload).toHaveProperty('role', validUser.role);
            expect(payload).not.toHaveProperty('password');
            expect(payload).not.toHaveProperty('name');
        });

        // Token expiration configuration
        it('should use JWT config for secret and expiration', () => {
            // Arrange
            userRepository.findByEmail.mockReturnValue(validUser);
            bcrypt.compareSync.mockReturnValue(true);
            jwt.sign.mockReturnValue('token');

            // Act
            authService.login('admin@example.com', 'admin123!');

            // Assert
            expect(jwt.sign).toHaveBeenCalledWith(
                expect.any(Object),
                jwtConfig.secret,
                { expiresIn: jwtConfig.expiresIn }
            );
        });

        // User not found
        it('should throw error when user is not found by email', () => {
            // Arrange
            userRepository.findByEmail.mockReturnValue(null);

            // Act & Assert
            expect(() => authService.login('nonexistent@example.com', 'password123'))
                .toThrow(expect.objectContaining({ status: 401, message: 'Invalid email or password' }));
        });

        it('should throw error when user is not found (undefined)', () => {
            // Arrange
            userRepository.findByEmail.mockReturnValue(undefined);

            // Act & Assert
            expect(() => authService.login('unknown@example.com', 'pass'))
                .toThrow(expect.objectContaining({ status: 401, message: 'Invalid email or password' }));
        });

        // Invalid password
        it('should throw error when password is incorrect', () => {
            // Arrange
            userRepository.findByEmail.mockReturnValue(validUser);
            bcrypt.compareSync.mockReturnValue(false);

            // Act & Assert
            expect(() => authService.login('admin@example.com', 'wrongpassword'))
                .toThrow(expect.objectContaining({ status: 401, message: 'Invalid email or password' }));
        });

        // Security: Same error for wrong email and wrong password
        it('should return same error message for wrong email and wrong password', () => {
            // Arrange - wrong email
            userRepository.findByEmail.mockReturnValue(null);
            let emailError;
            try {
                authService.login('wrong@example.com', 'admin123!');
            } catch (e) {
                emailError = e;
            }

            // Arrange - wrong password
            userRepository.findByEmail.mockReturnValue(validUser);
            bcrypt.compareSync.mockReturnValue(false);
            let passwordError;
            try {
                authService.login('admin@example.com', 'wrongpassword');
            } catch (e) {
                passwordError = e;
            }

            // Assert - same error to prevent user enumeration
            expect(emailError.message).toBe(passwordError.message);
            expect(emailError.status).toBe(passwordError.status);
        });

        // Response should not include password
        it('should not include password in returned user data', () => {
            // Arrange
            userRepository.findByEmail.mockReturnValue(validUser);
            bcrypt.compareSync.mockReturnValue(true);
            jwt.sign.mockReturnValue('token');

            // Act
            const result = authService.login('admin@example.com', 'admin123!');

            // Assert
            expect(result.user).not.toHaveProperty('password');
        });

        // Password comparison uses bcrypt
        it('should use bcrypt compareSync to validate password', () => {
            // Arrange
            userRepository.findByEmail.mockReturnValue(validUser);
            bcrypt.compareSync.mockReturnValue(true);
            jwt.sign.mockReturnValue('token');

            // Act
            authService.login('admin@example.com', 'admin123!');

            // Assert
            expect(bcrypt.compareSync).toHaveBeenCalledTimes(1);
            expect(bcrypt.compareSync).toHaveBeenCalledWith('admin123!', validUser.password);
        });

        // Login with USER role
        it('should return token when USER role logs in successfully', () => {
            // Arrange
            const regularUser = { ...validUser, id: 'user-2', role: 'USER', email: 'user@example.com' };
            userRepository.findByEmail.mockReturnValue(regularUser);
            bcrypt.compareSync.mockReturnValue(true);
            jwt.sign.mockReturnValue('user-token');

            // Act
            const result = authService.login('user@example.com', 'password123');

            // Assert
            expect(result.token).toBe('user-token');
            expect(result.user.role).toBe('USER');
        });

        // bcrypt should not be called when user not found
        it('should not call bcrypt when user is not found', () => {
            // Arrange
            userRepository.findByEmail.mockReturnValue(null);

            // Act & Assert
            expect(() => authService.login('no@user.com', 'pass')).toThrow();
            expect(bcrypt.compareSync).not.toHaveBeenCalled();
        });

        // jwt.sign should not be called when password is wrong
        it('should not generate token when password is invalid', () => {
            // Arrange
            userRepository.findByEmail.mockReturnValue(validUser);
            bcrypt.compareSync.mockReturnValue(false);

            // Act & Assert
            expect(() => authService.login('admin@example.com', 'wrong')).toThrow();
            expect(jwt.sign).not.toHaveBeenCalled();
        });
    });
});
