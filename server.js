const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Telegram OTP backend is running ✅");
});


// Replace with your bot token
const BOT_TOKEN = "8396360184:AAGFbcgYHv0t8iHnyNW3HQvFa_Eajd0wPxM";

// Temporary in-memory storage for OTPs
const otpStore = {}; 
// Structure: otpStore[userId] = { otp: "123456", expires: 1234567890, chat_id: 987654321 }

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ------------------------
// 1️⃣ SEND OTP ROUTE
// ------------------------
app.post("/send-otp", async (req, res) => {
  const { user_id, chat_id } = req.body;

  if (!user_id || !chat_id)
    return res.json({ success: false, message: "user_id and chat_id required" });

  const otp = generateOTP();
  const expires = Date.now() + 5 * 60 * 1000; // 5 min expiry

  // Save OTP
  otpStore[user_id] = { otp, expires, chat_id };

  try {
    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        chat_id,
        text: `Your verification code is *${otp}*\nThis code expires in 5 minutes.`,
        parse_mode: "Markdown",
      }
    );

    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// ------------------------
// 2️⃣ VERIFY OTP ROUTE
// ------------------------
app.post("/verify-otp", (req, res) => {
  const { user_id, otp } = req.body;

  if (!user_id || !otp)
    return res.json({ valid: false, message: "user_id and otp required" });

  const record = otpStore[user_id];
  if (!record)
    return res.json({ valid: false, message: "OTP not found" });

  if (Date.now() > record.expires)
    return res.json({ valid: false, message: "OTP expired" });

  if (record.otp !== otp)
    return res.json({ valid: false, message: "OTP incorrect" });

  // OTP success
  delete otpStore[user_id];
  return res.json({ valid: true });
});

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("OTP Backend running on port", PORT));
