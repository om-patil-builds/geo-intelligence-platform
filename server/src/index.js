// Server entry point - updated for Gmail OAuth
import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/database.js";

// Connect Database
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});