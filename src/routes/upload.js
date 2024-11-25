import express from "express";
import fs from "fs";
import multer from "multer";
import checkAuth from "../utils/checkAuth.js";

const storage = multer.diskStorage({
    destination: (_, __, cb) => {
        if (!fs.existsSync('uploads')) {
            fs.mkdirSync('uploads');
        }
        cb(null, 'uploads');
    },
    filename: (_, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage });

export const FileRouter = express.Router();

FileRouter.post('/upload', checkAuth, upload.single('image'), (req, res) => {
    res.json({
        url: `${req.file.originalname}`,
    });
});