import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/database.js";

dotenv.config();

connectDB();

const app = express();