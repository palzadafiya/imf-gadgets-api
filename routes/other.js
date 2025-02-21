const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

require("dotenv").config();

const prisma = new PrismaClient();

const { Router } = express;
const otherRouter = Router();

otherRouter.use(express.json());

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user with a username, password, and role.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [BASIC, ADMIN]
 *     responses:
 *       201:
 *         description: User registered successfully.
 */
otherRouter.post("/signup", async function (req, res){
    const { username, password, role } = req.body;

    try {
        // Validate role
        const validRoles = ["BASIC", "ADMIN"];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role. Role must be 'BASIC' or 'ADMIN'." });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
        }

        // Hash password before storing
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS));

        // Create new user
        const newUser = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role
            },
        });

        res.status(201).json({ message: "User registered successfully!", user: newUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

/**
 * @swagger
 * /signin:
 *   post:
 *     summary: Authenticate user
 *     description: Logs in a user and returns a JWT token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful.
 */
otherRouter.post("/signin", async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if user exists
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            return res.status(401).json({ message: "User does not exist" });
        }

        // Compare hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid login credentials" });
        }

        // Generate JWT token
        const token = jwt.sign({ 
            id: user.id
        }, process.env.JWT_SECRET, 
        { expiresIn: "1h" });

        res.status(200).json({ message: "Login successful", token: token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


module.exports = {
    otherRouter: otherRouter
};