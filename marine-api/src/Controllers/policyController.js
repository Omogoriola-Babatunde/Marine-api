import { getPrismaClient } from "../config/db.js";
import { generateCertificate } from "../Services/certificateService.js";
import path from "path";
import fs from "fs/promises";
import { validatePolicyInput } from "../utils/validation.js";

const prisma = getPrismaClient();
const CERTIFICATE_DIR = process.cwd();

export const createPolicy = async (req, res) => {
    try {
        const { Quoteid, customername } = req.body;
        
        const validation = validatePolicyInput({ Quoteid, customername });
        if (!validation.valid) {
            return res.status(400).json({ errors: validation.errors });
        }
        
        const quote = await prisma.quote.findUnique({
            where: { id: Quoteid },
        });
        if (!quote) {
            return res.status(404).json({ error: "Quote not found" });
        }
        
        const policyNumber = "POL-" + Date.now() ;
        const policy = await prisma.policy.create({
            data: {
                policyNumber,
                Quoteid: Quoteid,
                customername: customername,
                status: "active",
            }
        });
        const certificatePath = await generateCertificate(policy, quote);

        res.json({ policy, 
            certificatePath: certificatePath });
    } catch (error) {
        console.error("createPolicy error:", error);
        res.status(500).json({ error: "Failed to create policy" });
    }
};

export const downloadCertificate = async (req, res) => {
    try {
        const { policyNumber } = req.params;
        
        if (!policyNumber || !/^POL-\d+$/.test(policyNumber)) {
            return res.status(400).json({ error: "Invalid policy number format" });
        }
        
        const fileName = `certificate-${policyNumber}.pdf`;
        const filePath = path.join(CERTIFICATE_DIR, fileName);
        
        const normalizedPath = path.normalize(filePath);
        if (!normalizedPath.startsWith(CERTIFICATE_DIR)) {
            return res.status(403).json({ error: "Access denied" });
        }
        
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({ error: "Certificate not found" });
        }
        
        res.download(filePath, fileName);
    } catch (error) {
        console.error("downloadCertificate error:", error);
        res.status(500).json({ error: "Failed to download certificate" });
    }
};