const { Router } = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         age:
 *           type: integer
 *         role:
 *           type: string
 *           enum: [USER, ADMIN]
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     CreateUser:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - age
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *         age:
 *           type: integer
 *           example: 25
 *         password:
 *           type: string
 *           example: password123
 *         role:
 *           type: string
 *           enum: [USER, ADMIN]
 *           example: USER
 *     UpdateUser:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         age:
 *           type: integer
 *         password:
 *           type: string
 *         role:
 *           type: string
 *           enum: [USER, ADMIN]
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 */

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List users
 *     description: Returns all users for ADMIN role, or only the authenticated user's data for USER role.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/', userController.getAll);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.get('/:id', userController.getById);

/**
 * @swagger
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Create a new user
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUser'
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ADMIN role required
 *       409:
 *         description: Email already in use
 */
router.post('/', authorize('ADMIN'), userController.create);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUser'
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ADMIN role required
 *       404:
 *         description: User not found
 *       409:
 *         description: Email already in use
 */
router.put('/:id', authorize('ADMIN'), userController.update);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       204:
 *         description: User deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ADMIN role required
 *       404:
 *         description: User not found
 */
router.delete('/:id', authorize('ADMIN'), userController.delete);

module.exports = router;
