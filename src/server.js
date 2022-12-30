import express from "express";
import morgan from "morgan";

const PORT = 4000;

const app = express();
const logger = morgan("dev");

app.use(logger);

const handleHome = (req, res) => {
  return res.send("<h1>Hey!</h1>");
};
app.get("/", handleHome);

const handleLogin = (req, res) => {
  return res.send("Login");
};
app.get("/login", handleLogin);

const handleListening = () => console.log("Server listenting");
app.listen(PORT, handleListening);
