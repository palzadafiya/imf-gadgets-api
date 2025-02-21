const express = require("express");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

require("dotenv").config();

const prisma = new PrismaClient();

function authenticate(req, res, next){
    const token = req.headers.token;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id; // Attach decoded user info to request
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};

const authorize = (role) => {
    return async (req, res, next) => {
        try {
            // Query database to get user role
            const user = await prisma.user.findUnique({
                where: { id: req.userId },
                select: { role: true },
            });

            // If user not found, return unauthorized
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Check if user has the required role
            if (user.role !== role) {
                return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
            }

            // User is authorized, proceed
            next();
        } catch (error) {
            console.error("Authorization Error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
};

module.exports = { 
    authenticate, 
    authorize 
};
