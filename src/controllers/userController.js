const userService = require('../services/userService');

class UserController {
    getAll(req, res, next) {
        try {
            if (req.user.role === 'USER') {
                const user = userService.findById(req.user.id);
                return res.status(200).json([user]);
            }

            const users = userService.findAll();
            return res.status(200).json(users);
        } catch (error) {
            next(error);
        }
    }

    getById(req, res, next) {
        try {
            const { id } = req.params;
            if (req.user.role === 'USER' && req.user.id !== id) {
                return res.status(403).json({ message: 'Insufficient permissions' });
            }

            const user = userService.findById(id);
            return res.status(200).json(user);
        } catch (error) {
            next(error);
        }
    }

    getByName(req, res, next) {
        try {
            const { name } = req.query;
            const users = userService.findByName(name);
            return res.status(200).json(users);
        } catch (error) {
            next(error);
        }
    }

    getByEmail(req, res, next) {
        try {
            const { email } = req.query;
            const user = userService.findByEmail(email);
            return res.status(200).json(user);
        } catch (error) {
            next(error);
        }
    }

    create(req, res, next) {
        try {
            const { name, email, age, password, role } = req.body;

            if (!name || !email || age === undefined || !password) {
                return res.status(400).json({ message: 'Name, email, age and password are required' });
            }

            const user = userService.create({ name, email, age, password, role });
            return res.status(201).json(user);
        } catch (error) {
            next(error);
        }
    }

    update(req, res, next) {
        try {
            const { id } = req.params;
            const data = req.body;
            const user = userService.update(id, data);
            return res.status(200).json(user);
        } catch (error) {
            next(error);
        }
    }

    delete(req, res, next) {
        try {
            const { id } = req.params;
            userService.delete(id);
            return res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new UserController();
