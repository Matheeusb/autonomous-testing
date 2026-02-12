const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const jwtConfig = require('../config/jwt');
const userRepository = require('../repositories/userRepository');

class AuthService {
    login(email, password) {
        const user = userRepository.findByEmail(email);

        if (!user) {
            throw { status: 401, message: 'Invalid email or password' };
        }

        const isValid = bcrypt.compareSync(password, user.password);
        if (!isValid) {
            throw { status: 401, message: 'Invalid email or password' };
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            jwtConfig.secret,
            { expiresIn: jwtConfig.expiresIn }
        );

        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
    }
}

module.exports = new AuthService();
