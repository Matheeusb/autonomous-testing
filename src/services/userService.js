const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const userRepository = require('../repositories/userRepository');

class UserService {
    findAll() {
        return userRepository.findAll();
    }

    findById(id) {
        const user = userRepository.findById(id);
        if (!user) {
            throw { status: 404, message: 'User not found' };
        }
        return user;
    }

    findByName(name) {
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            throw { status: 400, message: 'Name query parameter is required' };
        }
        return userRepository.findByName(name.trim());
    }

    findByEmail(email) {
        if (!email || typeof email !== 'string' || email.trim().length === 0) {
            throw { status: 400, message: 'Email query parameter is required' };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            throw { status: 400, message: 'Invalid email format' };
        }

        const user = userRepository.findByEmail(email.trim());
        if (!user) {
            throw { status: 404, message: 'User not found' };
        }

        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    create(data) {
        this._validateEmail(data.email);
        this._validatePassword(data.password);
        this._validateAge(data.age);

        const existing = userRepository.findByEmail(data.email);
        if (existing) {
            throw { status: 409, message: 'Email already in use' };
        }

        const user = {
            id: uuidv4(),
            name: data.name,
            email: data.email,
            age: data.age,
            password: bcrypt.hashSync(data.password, 10),
            role: data.role || 'USER',
        };

        return userRepository.create(user);
    }

    update(id, data) {
        const existing = userRepository.findById(id);
        if (!existing) {
            throw { status: 404, message: 'User not found' };
        }

        if (data.email && data.email !== existing.email) {
            const emailUser = userRepository.findByEmail(data.email);
            if (emailUser) {
                throw { status: 409, message: 'Email already in use' };
            }
            this._validateEmail(data.email);
        }

        if (data.password) {
            this._validatePassword(data.password);
            data.password = bcrypt.hashSync(data.password, 10);
        }

        if (data.age !== undefined) {
            this._validateAge(data.age);
        }

        return userRepository.update(id, data);
    }

    delete(id) {
        const existing = userRepository.findById(id);
        if (!existing) {
            throw { status: 404, message: 'User not found' };
        }

        return userRepository.delete(id);
    }

    _validateEmail(email) {
        if (!email || typeof email !== 'string') {
            throw { status: 400, message: 'Email is required' };
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw { status: 400, message: 'Invalid email format' };
        }
    }

    _validatePassword(password) {
        if (!password || typeof password !== 'string') {
            throw { status: 400, message: 'Password is required' };
        }
        if (password.length < 8) {
            throw { status: 400, message: 'Password must be at least 8 characters long' };
        }
    }

    _validateAge(age) {
        if (age === undefined || age === null) {
            throw { status: 400, message: 'Age is required' };
        }
        if (typeof age !== 'number' || !Number.isInteger(age)) {
            throw { status: 400, message: 'Age must be an integer' };
        }
        if (age < 18) {
            throw { status: 400, message: 'User must be at least 18 years old' };
        }
    }
}

module.exports = new UserService();
