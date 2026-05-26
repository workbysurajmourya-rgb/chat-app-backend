import { Request, Response } from 'express';
import { pool } from '../config/db';

interface CustomRequest extends Request {
    user?: any;
}

export const getUser = async (
    req: CustomRequest,
    res: Response
) => {
    try {
        const loggedInUserId = req.user.id;

        const user = await pool.query(
            "SELECT id, name, email, created_at FROM users WHERE id != $1", [loggedInUserId]
        );

        res.json(user.rows);
    }catch (error) {
        res.status(500).json({
            message: "Server error",
        });
    }
}


export const deleteUser = async (
    req: CustomRequest,
    res: Response
) => {
    const userId = Number(req.user?.id);

    if (!userId) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        await client.query(
            "DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1",
            [userId]
        );

        const deleted = await client.query(
            "DELETE FROM users WHERE id = $1 RETURNING id",
            [userId]
        );

        if (deleted.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                message: "User not found",
            });
        }

        await client.query("COMMIT");

        res.json({
            message: "Account deleted",
        });
    } catch (error) {
        await client.query("ROLLBACK");
        res.status(500).json({
            message: "Server error",
        });
    } finally {
        client.release();
    }
};