const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// @desc Register a new user
// @route POST /api/users/register
// @access Public
const registerUser = async (req, res) => {
  const { name, email, password, accountType } = req.body;

  // Basic validation
  if (!name || !email || !password || !accountType) {
    return res.status(400).json({ message: "❌ Please fill all fields" });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "❌ Invalid email format" });
  }

  // Password validation
  if (password.length < 6) {
    return res.status(400).json({ message: "❌ Password must be at least 6 characters long" });
  }

  // Account type validation
  const validAccountTypes = ["savings", "current"];
  if (!validAccountTypes.includes(accountType.toLowerCase())) {
    return res.status(400).json({ message: "❌ Invalid account type. Choose 'savings' or 'current'." });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "❌ User already exists with this email" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      accountType: accountType.toLowerCase(),
      balance: 0, // Initialize balance to 0 for new accounts
    });

    await newUser.save();

    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      accountType: newUser.accountType,
      balance: newUser.balance,
      token: generateToken(newUser._id),
      message: " User registered successfully",
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ message: "❌ Error registering user", error: error.message });
  }
};

// @desc Get all users (Exclude passwords for security)
// @route GET /api/users
// @access Private (Admins only)
const getUsers = async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "❌ Access denied. Admins only." });
  }

  try {
    const users = await User.find().select("-password"); // Exclude password
    res.status(200).json({
      message: " Users fetched successfully",
      users,
    });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ message: "❌ Error fetching users", error: error.message });
  }
};

module.exports = { registerUser, getUsers };
