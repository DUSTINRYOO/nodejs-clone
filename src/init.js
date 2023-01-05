import "dotenv/config";
import "./db";
import "./models/video";
import "./models/user";
import app from "./server";

const PORT = 8000;

const handleListening = () => console.log("Server is working");
app.listen(PORT, handleListening);
