const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const userModel = require("../models/user.model");

// Constants for limits
const MAX_USERS = 15;

// /user/register -> first route to register user
router.get("/register", (req, res) => {
    res.render("register");
});
// Route for registering the user --> after user clicks on register --> This page handles how the user is created and how user data is handled
router.post(
    "/register",
    body("email")
        .trim()
        .isEmail()
        .withMessage("Please enter a valid email address"),
    body("pass")
        .trim()
        .isLength({ min: 5 })
        .withMessage("Password must be at least 5 characters"),
    body("username")
        .trim()
        .isLength({ min: 3 })
        .withMessage("Username must be at least 3 characters"),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                // Get the first error message
                const errorMessage = errors.array()[0].msg;
                return res.redirect(
                    `/user/register?error=true&message=${encodeURIComponent(
                        errorMessage
                    )}`
                );
            }

            // Check if user limit is reached
            const userCount = await userModel.countDocuments();
            if (userCount >= MAX_USERS) {
                return res.redirect(
                    `/user/register?error=true&message=${encodeURIComponent(
                        "Maximum user limit (15) reached. Registration closed."
                    )}`
                );
            }

            const { email, username, pass } = req.body;

            // Check if username or email already exists
            const existingUser = await userModel.findOne({
                $or: [{ email }, { username }],
            });
            if (existingUser) {
                return res.redirect(
                    `/user/register?error=true&message=${encodeURIComponent(
                        "Username or email already exists"
                    )}`
                );
            }

            const hashPassword = await bcrypt.hash(pass, 10);

            const newUser = await userModel.create({
                email,
                username,
                pass: hashPassword,
            });

            // Redirect to login with success message
            res.redirect(
                `/user/login?registered=true&username=${encodeURIComponent(
                    username
                )}&email=${encodeURIComponent(email)}`
            );
        } catch (error) {
            console.error("Registration error:", error);
            // Handle duplicate key errors from MongoDB
            if (error.code === 11000) {
                return res.redirect(
                    `/user/register?error=true&message=${encodeURIComponent(
                        "Username or email already exists"
                    )}`
                );
            }
            // For other errors, show a generic message
            return res.redirect(
                `/user/register?error=true&message=${encodeURIComponent(
                    "Registration failed. Please try again."
                )}`
            );
        }
    }
);

// Login Route -> /user/login
router.get("/login", (req, res) => {
    res.render("login");
});
// Route for logging in the user --> after user clicks on login --> This page handles how the user is logged in application and how user data is authorized
router.post(
    "/login",
    body("username").trim().isLength({ min: 3 }),
    body("pass").trim().isLength({ min: 5 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.redirect(
                `/user/register?error=true&message=${encodeURIComponent(
                    "Invalid username or password format"
                )}`
            );
        }

        const { username, pass } = req.body;

        // Searching username --> which has the "username" in the database
        const user = await userModel.findOne({ username: username });

        if (!user) {
            return res.redirect(
                `/user/register?error=true&message=${encodeURIComponent(
                    "Invalid username or password. Please register if you don't have an account."
                )}`
            );
        }

        // comparing password and hashed password if they are same or not
        // user.pass --> Hash password, pass --> password entered by login user
        const isMatch = await bcrypt.compare(pass, user.pass);

        if (!isMatch) {
            return res.redirect(
                `/user/register?error=true&message=${encodeURIComponent(
                    "Invalid username or password. Please try again or register."
                )}`
            );
        }

        // Generate Token Now
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                username: user.username,
            },
            process.env.JWT_SECRET
        );

        // Storing the token into cookie
        res.cookie("token", token);
        // Send response here
        res.redirect("/home");
    }
);

// Logout Route
router.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/user/login");
});

// Profile Route
router.get("/profile", async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.redirect("/user/login");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.userId);

        if (!user) {
            return res.redirect("/user/login");
        }

        res.render("profile", { user });
    } catch (error) {
        console.error("Profile error:", error);
        res.redirect("/user/login");
    }
});

// Change Password Route
router.post(
    "/change-password",
    body("currentPassword")
        .trim()
        .isLength({ min: 5 })
        .withMessage("Current password is required"),
    body("newPassword")
        .trim()
        .isLength({ min: 5 })
        .withMessage("New password must be at least 5 characters"),
    body("confirmPassword")
        .trim()
        .isLength({ min: 5 })
        .withMessage("Please confirm your new password"),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorMessage = errors.array()[0].msg;
                return res.redirect(
                    `/user/profile?error=true&message=${encodeURIComponent(
                        errorMessage
                    )}`
                );
            }

            const token = req.cookies.token;
            if (!token) {
                return res.redirect("/user/login");
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await userModel.findById(decoded.userId);

            if (!user) {
                return res.redirect("/user/login");
            }

            const { currentPassword, newPassword, confirmPassword } = req.body;

            // Check if new passwords match
            if (newPassword !== confirmPassword) {
                return res.redirect(
                    `/user/profile?error=true&message=${encodeURIComponent(
                        "New passwords do not match"
                    )}`
                );
            }

            // Verify current password
            const isMatch = await bcrypt.compare(currentPassword, user.pass);
            if (!isMatch) {
                return res.redirect(
                    `/user/profile?error=true&message=${encodeURIComponent(
                        "Current password is incorrect"
                    )}`
                );
            }

            // Check if new password is same as current
            if (currentPassword === newPassword) {
                return res.redirect(
                    `/user/profile?error=true&message=${encodeURIComponent(
                        "New password must be different from current password"
                    )}`
                );
            }

            // Hash and update the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await userModel.findByIdAndUpdate(decoded.userId, {
                pass: hashedPassword,
            });

            res.redirect(
                `/user/profile?success=true&message=${encodeURIComponent(
                    "Password updated successfully"
                )}`
            );
        } catch (error) {
            console.error("Change password error:", error);
            res.redirect(
                `/user/profile?error=true&message=${encodeURIComponent(
                    "Failed to update password. Please try again."
                )}`
            );
        }
    }
);

module.exports = router;
