const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const { otherRouter } = require("./routes/other");
const { gadgetsRouter } = require("./routes/gadgets");
const other = require("./routes/other");
const setupSwagger = require("./swagger");
const cors = require('cors');

require("dotenv").config();

const prisma = new PrismaClient();


async function verifyDatabaseConnection() {
    try {
        await prisma.$connect();
        console.log("Database connection successful");
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1); // Exit the process if the database connection fails
    }
}

const app = express();

app.use(express.json());
app.use(cors({
    origin: process.env.API_BASE_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "token"],
    credentials: true
}));
setupSwagger(app);

app.use("/", otherRouter);
app.use("/gadgets", gadgetsRouter);

verifyDatabaseConnection().then(() => {
    app.listen(process.env.PORT, () =>
        console.log(`Server listening on port ${process.env.PORT}`)
    );
});