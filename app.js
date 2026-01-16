// Load environment variables FIRST before any other imports
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const userRouter = require("./routes/user.routes");
const indexRouter = require("./routes/index.routes");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const connectToDB = require("./config/db");
connectToDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(express.static("public"));
app.use(cookieParser());

app.set("view engine", "ejs");

app.use("/", indexRouter);
app.use("/user", userRouter);

// 404 Handler - Page not found
app.use((req, res, next) => {
    res.status(404).render("error", {
        statusCode: 404,
        title: "Page Not Found",
        message: "The page you are looking for does not exist.",
    });
});

// Global Error Handler - Catches all errors
app.use((err, req, res, next) => {
    // Log error details to console only
    console.error("=== ERROR ===");
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
    console.error("=============");

    // Send user-friendly error page
    res.status(err.status || 500).render("error", {
        statusCode: err.status || 500,
        title: "Something went wrong",
        message: "An unexpected error occurred. Please try again later.",
    });
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server is running");
});
