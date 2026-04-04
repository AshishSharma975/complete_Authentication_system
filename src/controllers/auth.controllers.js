import config from "../config/config.js";
import userModel from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sessionModel from "../models/session.model.js";


export async function registerController(req, res) {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const isUserAlreadyExist = await userModel.findOne({
            $or: [{ username }, { email }]
        });

        if (isUserAlreadyExist) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        const hash = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username,
            email,
            password: hash
        });

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
}


export async function loginController(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid password"
            });
        }

        const refreshToken = jwt.sign(
            { id: user._id },
            config.JWT_SECRET_KEY,
            { expiresIn: "7d" }
        );

        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

        const session = await sessionModel.create({
            user: user._id,
            refreshTokenHash,
            ip: req.ip,
            userAgent: req.headers["user-agent"]
        });

        const accessToken = jwt.sign(
            { id: user._id, sessionId: session._id },
            config.JWT_SECRET_KEY,
            { expiresIn: "15m" }
        );

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            message: "User logged in successfully",
            accessToken
        });

    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
}



export async function getMe(req, res) {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "token not found"
            });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET_KEY);

        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            message: "user fetched successfully",
            user: {
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        return res.status(401).json({
            message: "invalid token"
        });
    }
}


export async function refreshTokenController(req, res) {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token not found"
            });
        }

        const decoded = jwt.verify(refreshToken, config.JWT_SECRET_KEY);

        const sessions = await sessionModel.find({
            user: decoded.id,
            revoked: false
        });

        let validSession = null;

        for (let session of sessions) {
            const isMatch = await bcrypt.compare(
                refreshToken,
                session.refreshTokenHash
            );

            if (isMatch) {
                validSession = session;
                break;
            }
        }

        if (!validSession) {
            return res.status(403).json({
                message: "Invalid refresh token"
            });
        }

        // generate new tokens
        const newRefreshToken = jwt.sign(
            { id: decoded.id },
            config.JWT_SECRET_KEY,
            { expiresIn: "7d" }
        );

        const newHash = await bcrypt.hash(newRefreshToken, 10);

        validSession.refreshTokenHash = newHash;
        await validSession.save();

        const accessToken = jwt.sign(
            { id: decoded.id, sessionId: validSession._id },
            config.JWT_SECRET_KEY,
            { expiresIn: "15m" }
        );

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            message: "Token refreshed",
            accessToken
        });

    } catch (error) {
        return res.status(401).json({
            message: "Invalid token"
        });
    }
}


export async function logoutController(req, res) {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token not found"
            });
        }

        const decoded = jwt.verify(refreshToken, config.JWT_SECRET_KEY);

        const sessions = await sessionModel.find({
            user: decoded.id,
            revoked: false
        });

        for (let session of sessions) {
            const isMatch = await bcrypt.compare(
                refreshToken,
                session.refreshTokenHash
            );

            if (isMatch) {
                session.revoked = true;
                await session.save();
                break;
            }
        }

        res.clearCookie("refreshToken");

        return res.status(200).json({
            message: "Logged out successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Server error"
        });
    }
}


export async function logoutAllController(req, res) {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(400).json({
                message: "Refresh token not found."
            });
        }

        const decoded = jwt.verify(refreshToken, config.JWT_SECRET_KEY);

        await sessionModel.updateMany(
            { user: decoded.id },
            { revoked: true }
        );

        res.clearCookie("refreshToken");

        return res.status(200).json({
            message: "Logged out from all devices"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Server error"
        });
    }
}