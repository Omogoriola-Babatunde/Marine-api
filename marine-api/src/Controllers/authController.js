import bcript from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getPrismaClient } from '../config/db.js';

const prisma = getPrismaClient();

export const registerUser = async (req, res) => {
    try {
        const { username, email, password, role, rate } = req.body;

        const hashedPassword = await bcript.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                role,
                classARate,
                classBRate,
            }
        });

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating user' });
    }    
};

export const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await prisma.user.findUnique({
            where: { username }
        }); 

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const valid = await bcript.compare(password, user.password);    

        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ 
            userid: user.id, role: user.role },
            "SECRET_KEY",
            { expiresIn: '1d' }     
        );

        res.json({ token, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error logging in' });  
    }    
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Password reset link sent to email' });
};