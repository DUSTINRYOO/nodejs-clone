import express from "express";
import { countView } from "../controllers/videoController";

const apiRouter = express.Router();

apiRouter.post("/video/:id([0-9a-f]{24})/view", countView);

export default apiRouter;
