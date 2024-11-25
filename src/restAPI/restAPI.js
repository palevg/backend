import 'dotenv/config';
import express from "express";
import cors from "cors";

import { AuthRouter } from "../routes/auth.js";
import { EntRouter } from "../routes/enterpr.js";
import { PersonRouter } from "../routes/person.js";
import { FileRouter } from "../routes/upload.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));

app.use(AuthRouter);
app.use(EntRouter);
app.use(PersonRouter);
app.use(FileRouter);

export default function startRestAPI() {
    app.listen(process.env.PORT, (err) => {
        if (err) {
            return console.log(err);
        }

        console.log('Server OK');
    });
}