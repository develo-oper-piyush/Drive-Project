const express = require("express");
const supabase = require("../config/supabase");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// Constants for limits
const MAX_FILES_PER_USER = 12;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

router.get("/", (req, res) => {
    res.render("index");
});

router.get("/home", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Fetch all files from Supabase bucket in user's folder
        const { data: files, error } = await supabase.storage
            .from("Files-upload")
            .list(userId, {
                limit: 100,
                offset: 0,
                sortBy: { column: "name", order: "asc" },
            });

        if (error) {
            console.error("Error fetching files:", error);
            return res.render("home", {
                files: [],
                user: req.user,
                fileCount: 0,
                maxFiles: MAX_FILES_PER_USER,
                maxFileSize: MAX_FILE_SIZE / (1024 * 1024), // in MB
            });
        }

        // Filter out the .emptyFolderPlaceholder if it exists
        const actualFiles = files.filter(
            (file) => file.name !== ".emptyFolderPlaceholder"
        );

        // Use internal secure routes instead of direct Supabase URLs
        const filesWithUrls = actualFiles.map((file) => {
            return {
                name: file.name,
                fullPath: `${userId}/${file.name}`,
                url: `/secure-file/${encodeURIComponent(file.name)}`, // Internal secure route
                createdAt: file.created_at,
                size: file.metadata?.size || 0,
                mimetype: file.metadata?.mimetype || "unknown",
            };
        });

        console.log(`Found ${filesWithUrls.length} files for user ${userId}`);
        res.render("home", {
            files: filesWithUrls,
            user: req.user,
            fileCount: filesWithUrls.length,
            maxFiles: MAX_FILES_PER_USER,
            maxFileSize: MAX_FILE_SIZE / (1024 * 1024), // in MB
        });
    } catch (error) {
        console.error("Error:", error);
        res.render("home", {
            files: [],
            user: req.user,
            fileCount: 0,
            maxFiles: MAX_FILES_PER_USER,
            maxFileSize: MAX_FILE_SIZE / (1024 * 1024),
        });
    }
});

// Upload file route
router.post("/upload-file", authMiddleware, async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).send("No file uploaded");
        }

        const file = req.files.file;
        const userId = req.user.userId;

        // Check file size limit (5MB)
        if (file.size > MAX_FILE_SIZE) {
            return res
                .status(400)
                .send(
                    `File size exceeds limit of ${
                        MAX_FILE_SIZE / (1024 * 1024)
                    }MB`
                );
        }

        // Check current file count
        const { data: existingFiles, error: listError } = await supabase.storage
            .from("Files-upload")
            .list(userId);

        if (listError) {
            console.error("Error checking file count:", listError);
            return res.status(500).send("Error checking file count");
        }

        const actualFileCount = existingFiles.filter(
            (f) => f.name !== ".emptyFolderPlaceholder"
        ).length;

        if (actualFileCount >= MAX_FILES_PER_USER) {
            return res
                .status(400)
                .send(`Maximum file limit of ${MAX_FILES_PER_USER} reached`);
        }

        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${userId}/${fileName}`; // Store in user-specific folder

        // Upload to Supabase storage
        const { data, error } = await supabase.storage
            .from("Files-upload")
            .upload(filePath, file.data, {
                contentType: file.mimetype,
                upsert: false,
            });

        if (error) {
            console.error("Supabase upload error:", error);
            return res.status(500).send("Error uploading file");
        }

        console.log("File uploaded successfully:", data);
        res.redirect("/home");
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).send("Server error");
    }
});

// Delete file route
router.post("/delete-file", authMiddleware, async (req, res) => {
    try {
        const { fileName } = req.body;
        const userId = req.user.userId;

        if (!fileName) {
            console.error("No file name provided in request");
            return res.status(400).json({ error: "No file name provided" });
        }

        // Construct the full file path
        const filePath = `${userId}/${fileName}`;

        console.log("=== DELETE FILE ATTEMPT ===");
        console.log("User ID:", userId);
        console.log("File Name:", fileName);
        console.log("Full File Path:", filePath);
        console.log("Bucket:", "Files-upload");

        // First, check if the file exists
        const { data: existingFiles, error: listError } = await supabase.storage
            .from("Files-upload")
            .list(userId);

        if (listError) {
            console.error("Error listing files:", listError);
        } else {
            console.log(
                "Files in user folder:",
                existingFiles.map((f) => f.name)
            );
            const fileExists = existingFiles.some((f) => f.name === fileName);
            console.log("File exists in folder:", fileExists);
        }

        // Attempt to delete the file
        const { data, error } = await supabase.storage
            .from("Files-upload")
            .remove([filePath]);

        if (error) {
            console.error("=== DELETE ERROR ===");
            console.error("Error object:", JSON.stringify(error, null, 2));
            console.error("Error message:", error.message);
            console.error("Error status:", error.status);
            return res.status(500).json({
                error: "Error deleting file",
                details: error.message,
                path: filePath,
            });
        }

        console.log("=== DELETE SUCCESS ===");
        console.log("Delete response data:", data);

        // Verify deletion
        const { data: afterDelete, error: verifyError } = await supabase.storage
            .from("Files-upload")
            .list(userId);

        if (!verifyError) {
            const stillExists = afterDelete.some((f) => f.name === fileName);
            console.log("File still exists after delete:", stillExists);
        }

        res.json({
            success: true,
            message: "File deleted successfully",
            deletedPath: filePath,
            data,
        });
    } catch (error) {
        console.error("=== EXCEPTION IN DELETE ===");
        console.error("Exception:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
});

// Secure file view route - generates a new signed URL
router.get("/view-file/:fileName", authMiddleware, async (req, res) => {
    try {
        const { fileName } = req.params;
        const userId = req.user.userId;
        const filePath = `${userId}/${fileName}`;

        // Create a signed URL that expires in 5 minutes
        const { data, error } = await supabase.storage
            .from("Files-upload")
            .createSignedUrl(filePath, 300); // 5 minutes

        if (error) {
            console.error("Error creating signed URL:", error);
            return res.status(404).send("File not found");
        }

        // Redirect to the signed URL
        res.redirect(data.signedUrl);
    } catch (error) {
        console.error("Error viewing file:", error);
        res.status(500).send("Server error");
    }
});

// Secure file serving route - requires authentication and ownership verification
router.get("/secure-file/:fileName", authMiddleware, async (req, res) => {
    try {
        const { fileName } = req.params;
        const userId = req.user.userId;
        const filePath = `${userId}/${decodeURIComponent(fileName)}`;

        console.log(`User ${userId} requesting file: ${filePath}`);

        // Download file from Supabase
        const { data, error } = await supabase.storage
            .from("Files-upload")
            .download(filePath);

        if (error) {
            console.error("Error downloading file:", error);
            return res.status(404).send("File not found");
        }

        // Get file metadata to set proper content type
        const { data: fileList } = await supabase.storage
            .from("Files-upload")
            .list(userId);

        const fileMetadata = fileList?.find(
            (f) => f.name === decodeURIComponent(fileName)
        );
        const contentType =
            fileMetadata?.metadata?.mimetype || "application/octet-stream";

        // Set headers and send file
        res.setHeader("Content-Type", contentType);
        res.setHeader(
            "Content-Disposition",
            `inline; filename="${decodeURIComponent(fileName)}"`
        );

        // Convert blob to buffer and send
        const buffer = Buffer.from(await data.arrayBuffer());
        res.send(buffer);
    } catch (error) {
        console.error("Error serving secure file:", error);
        res.status(500).send("Server error");
    }
});

// Rename file route
router.post("/rename-file", authMiddleware, async (req, res) => {
    try {
        const { oldFileName, newFileName } = req.body;
        const userId = req.user.userId;

        if (!oldFileName || !newFileName) {
            return res
                .status(400)
                .json({ error: "Both old and new file names are required" });
        }

        // Sanitize new file name (keep the timestamp prefix from old file)
        const timestampMatch = oldFileName.match(/^(\d+)-/);
        const timestamp = timestampMatch ? timestampMatch[1] : Date.now();
        const sanitizedNewName = `${timestamp}-${newFileName.replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        )}`;

        const oldPath = `${userId}/${oldFileName}`;
        const newPath = `${userId}/${sanitizedNewName}`;

        console.log(`Renaming file from ${oldPath} to ${newPath}`);

        // Download the file first
        const { data: fileData, error: downloadError } = await supabase.storage
            .from("Files-upload")
            .download(oldPath);

        if (downloadError) {
            console.error("Error downloading file for rename:", downloadError);
            return res.status(404).json({ error: "File not found" });
        }

        // Get file metadata
        const { data: fileList } = await supabase.storage
            .from("Files-upload")
            .list(userId);

        const fileMetadata = fileList?.find((f) => f.name === oldFileName);
        const contentType =
            fileMetadata?.metadata?.mimetype || "application/octet-stream";

        // Upload with new name
        const buffer = Buffer.from(await fileData.arrayBuffer());
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("Files-upload")
            .upload(newPath, buffer, {
                contentType: contentType,
                upsert: false,
            });

        if (uploadError) {
            console.error("Error uploading renamed file:", uploadError);
            return res.status(500).json({ error: "Error renaming file" });
        }

        // Delete old file
        const { error: deleteError } = await supabase.storage
            .from("Files-upload")
            .remove([oldPath]);

        if (deleteError) {
            console.error("Error deleting old file:", deleteError);
            // Try to clean up the new file
            await supabase.storage.from("Files-upload").remove([newPath]);
            return res.status(500).json({ error: "Error completing rename" });
        }

        res.json({
            success: true,
            message: "File renamed successfully",
            newFileName: sanitizedNewName,
        });
    } catch (error) {
        console.error("Error renaming file:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
