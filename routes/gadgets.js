const { Router } = require("express");
const { authenticate, authorize } = require("../middlewares/auth");
const { getRandomInt, generateGadgetCodename } = require("../utils/helpers");
const { PrismaClient } = require("@prisma/client");

require("dotenv").config();

const prisma = new PrismaClient();

const gadgetsRouter = Router();

gadgetsRouter.use(authenticate);

/**
 * @swagger
 * /gadgets:
 *   get:
 *     summary: Get all gadgets
 *     description: Retrieve a list of all gadgets with optional filters for status, successProbability, and name.
 *     tags: [Gadgets]
 *     parameters:
 *       - in: header
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token for authentication.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter gadgets by status.
 *       - in: query
 *         name: minSuccessProbability
 *         schema:
 *           type: integer
 *         description: Minimum success probability filter.
 *       - in: query
 *         name: maxSuccessProbability
 *         schema:
 *           type: integer
 *         description: Maximum success probability filter.
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter gadgets by name (partial match).
 *     responses:
 *       200:
 *         description: A list of gadgets.
 */
gadgetsRouter.get("/", async (req, res) => {
    try {
        const {
            status,
            minSuccessProbability = 0,
            maxSuccessProbability = 100,
            name
        } = req.query;

        const filters = {};

        if (status) filters.status = status;
        filters.successProbability = {
            gte: parseInt(minSuccessProbability),
            lte: parseInt(maxSuccessProbability)
        };
        if (name) filters.name = { contains: name, mode: "insensitive" };

        const gadgets = await prisma.gadget.findMany({ where: filters });
        res.status(200).json(gadgets);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});


gadgetsRouter.use(authorize("ADMIN"));

/**
 * @swagger
 * /gadgets:
 *   post:
 *     summary: Add a new gadget
 *     description: Adds a new gadget with a unique codename and success probability.
 *     tags: [Gadgets]
 *     parameters:
 *       - in: header
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token for authentication.
 *     responses:
 *       201:
 *         description: Gadget created successfully.
 */
gadgetsRouter.post("/", async function(req, res){
    // Add a new gadget to the inventory.
    const name = generateGadgetCodename();
    const successProbability = getRandomInt(0, 100);
    const status = "AVAILABLE"; // taking "AVAILABLE" when gadget is created.
    try {
        const newGadget = await prisma.gadget.create({
            data: { name, successProbability, status },
        });
        res.status(201).json({ message: "Gadget added successfully", gadget: newGadget });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

/**
 * @swagger
 * /gadgets/{gadgetId}:
 *   patch:
 *     summary: Update a gadget
 *     description: Modify an existing gadget's details, allowing full or partial updates, including nested objects.
 *     tags: [Gadgets]
 *     parameters:
 *       - in: header
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token for authentication.
 *       - in: path
 *         name: gadgetId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the gadget to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Gadget updated successfully.
 */
gadgetsRouter.patch("/:id", async function(req, res){
    // Update an existing gadget's information.
    const { id } = req.params;
    const updateData = req.body;
    const validFields = ["name", "successProbability", "status"];
    
    const filteredData = Object.keys(updateData)
        .filter(key => validFields.includes(key))
        .reduce((obj, key) => {
            obj[key] = updateData[key];
            return obj;
        }, {});
    
    if (Object.keys(filteredData).length === 0) {
        return res.status(400).json({ message: "Invalid fields provided. You can only update: name, successProbability, status." });
    }
    
    try {
        const updatedGadget = await prisma.gadget.update({ where: { id }, data: filteredData });
        res.status(200).json({ message: "Gadget updated successfully", gadget: updatedGadget });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

/**
 * @swagger
 * /gadgets/{gadgetId}:
 *   delete:
 *     summary: Decommission a gadget
 *     description: Mark a gadget as "Decommissioned" instead of deleting it.
 *     tags: [Gadgets]
 *     parameters:
 *       - in: header
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token for authentication.
 *       - in: path
 *         name: gadgetId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the gadget to decommission.
 *     responses:
 *       200:
 *         description: Gadget decommissioned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 gadget:
 *                   type: object
 */
gadgetsRouter.delete("/:id", async function(req, res){
    // Remove a gadget from the inventory.
    // Instead of actually deleting the gadget, mark its status as "Decommissioned" 
    // and add a timestamp for when it was decommissioned.
    const { id } = req.params;
    try {
        const decommissionedGadget = await prisma.gadget.update({
            where: { id },
            data: { status: "DECOMMISSIONED"},
        });
        res.status(200).json({ message: "Gadget decommissioned successfully", gadget: decommissionedGadget });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

/**
 * @swagger
 * /gadgets/{gadgetId}/self-destruct:
 *   post:
 *     summary: Trigger self-destruct
 *     description: Initiates the self-destruct sequence for a gadget.
 *     tags: [Gadgets]
 *     parameters:
 *       - in: header
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token for authentication.
 *       - in: path
 *         name: gadgetId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the gadget to self-destruct.
 *     responses:
 *       200:
 *         description: Self-destruct initiated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 confirmationCode:
 *                   type: string
 */
gadgetsRouter.post("/:id/self-destruct", async function(req, res){
    // Trigger the self-destruct sequence for a specific gadget.
    // Requires a randomly generated confirmation code (you can simulate this; 
    // no need to actually send it anywhere).
    const { id } = req.params;
    try {
        const confirmationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await prisma.gadget.update({ where: { id }, data: { status: "DESTROYED" } });
        res.status(200).json({ message: "Self-destruct initiated", confirmationCode });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = {
    gadgetsRouter: gadgetsRouter
};