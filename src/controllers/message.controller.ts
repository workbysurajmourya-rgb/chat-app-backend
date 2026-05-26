import {Request,Response} from "express";
import { pool } from "../config/db";

interface CustomRequest extends Request {
    user?: any;
}

export const getMessages = async (
    req: CustomRequest,
    res: Response
) => {
    try{
        const senderId = req.user.id;
        const receiverId = req.params.receiverId;

        const messages = await pool.query(
            `
            SELECT * FROM messages
            WHERE (sender_id = $1 AND receiver_id = $2)
            OR (sender_id = $2 AND receiver_id = $1)
            ORDER BY created_at ASC
            `,
            [senderId, receiverId]
        );
        res.json(messages.rows);
    }catch(error){
        res.status(500).json({
            message: "Server error",
        });
    }

}