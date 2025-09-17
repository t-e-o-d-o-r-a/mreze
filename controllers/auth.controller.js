import User from "../models/user.model.js";
import jwt, { decode } from "jsonwebtoken";
import { redis } from "../lib/redis.js";
 
const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

    return { accessToken, refreshToken };
}

const storeRefreshToken = async (userId, refreshToken) => {
    await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7*24*60*60); // 7 dana
}

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,  // protiv XSS napada (cross site sctipting)
        secure: process.env.NODE_ENV === "production",  // https u produkciji
        sameSite: "strict",  // protiv CSRF napada (cross site request forgery)
        maxAge: 15 * 60 * 1000,  // 15 minuta
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",  
        sameSite: "strict",  
        maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 dana
    });
}

export const signup = async (req, res) => {
    const { email, password, name } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = await User.create({ name, email, password });

        // autentifikacija
        const { accessToken, refreshToken } = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);
        setCookies(res, accessToken, refreshToken);

        res.status(201).json({ user: {
            _id: user._id,
            name: user.name, 
            email: user.email,
            role: user.role,
        }});

    } catch (error) {
        console.log("Error in signup controller", error.message);
        res.status(500).json({ message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.comparePasswords(password))) {
            const { accessToken, refreshToken } = generateTokens(user._id);

            await storeRefreshToken(user._id, refreshToken);
            setCookies(res, accessToken, refreshToken);

            res.json({
                _id: user._id,
                name: user.name, 
                email: user.email,
                role: user.role,
            });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }

    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({ message: error.message });
    }
}

// ako se korisnik izloguje, a access token mu i dalje vazi, on ce biti blacklisted
export const logout = async (req, res) => {
    try {
        const accessToken = req.cookies.accessToken;
        const refreshToken = req.cookies.refreshToken;

        if (refreshToken) {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            await redis.del(`refresh_token:${decoded.userId}`);
        }

        if (accessToken) {
            const decoded = jwt.decode(accessToken);
            const expiresInSeconds = decoded.exp - Math.floor(Date.now() / 1000);
            await redis.set(`blacklist:${accessToken}`, "true", "EX", expiresInSeconds);
        }

        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.json({ message: "Logged out successfully" });

    } catch (error) {
        console.log("Error in logout controller", error.message);
        res.status(500).json({ error: error.message });
    }
}

// refreshuje access token nakon sto on istekne za 15 minuta
export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ message: "No refresh token provided" });
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

        if (storedToken !== refreshToken) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
        res.cookie("accessToken", accessToken, {
            httpOnly: true, 
            secure: process.env.NODE_ENV === "production",  
            sameSite: "strict",  
            maxAge: 15 * 60 * 1000,
        });

        return res.json({ message: "Token refreshed successfully" });

    } catch (error) {
        console.log("Error in refreshToken controller", error.message);
        res.status(500).json({ error: error.message });
    }
}

export const getProfile = async (req, res) => {
    try {
        res.json(req.user);

    } catch (error) {
        console.log("Error in getProfile controller", error.message);
        res.status(500).json({ error: error.message });
    }
}