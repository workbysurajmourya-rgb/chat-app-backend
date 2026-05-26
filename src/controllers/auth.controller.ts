import { Request, Response } from 'express';
import { pool } from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const userExist = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userExist.rows.length > 0) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
      [name, email, hashedPassword]
    );

    const token = jwt.sign(
      {
        id: newUser.rows[0].id,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "7d",
      }
    );

    const { password: _, ...user } = newUser.rows[0];

    res.status(201).json({
      message: "User registered",
      token,
      user,
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const userQuery = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (userQuery.rows.length === 0) {
            return res.status(400).json({
                message: "Invalid credentials",
            });
        }

        const validPassword = await bcrypt.compare(
            password,
            userQuery.rows[0].password
        );

        if (!validPassword) {
            return res.status(400).json({
                message: "Invalid credentials",
            });
        }

        const token = jwt.sign(
            {
                id: userQuery.rows[0].id,
            },
            process.env.JWT_SECRET as string,
            {
                expiresIn: "7d",
            }
        );

        const { password: _, ...user } = userQuery.rows[0];

        res.status(200).json({
            message: "Login successful",
            token,
            user,
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
        });
    }
};
