const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// @desc Register a new user
// @route POST /api/auth/register
// @access Public
const registerUser = async (req, res) => {
  const { name, email, password, accountType } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "❌ All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "❌ User already exists" });
    }

    ////
    // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  console.log(" Hashed password during registration:", hashedPassword);


    // Creating the user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: accountType === "admin" ? "admin" : "user",  //  Assign role
      accountType,
    });

    await user.save();

    // Generate JWT Token
    const token = generateToken(user._id);

    console.log(" User registered successfully:", email);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      accountType: user.accountType,
      token,
      message: " User registered successfully!",
    });
  } catch (error) {
    console.error("❌ Error during registration:", error.message);
    res.status(500).json({ message: "❌ Registration failed", error: error.message });
  }
};

// @desc Login user & get token
// @route POST /api/auth/login
// @access Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "❌ Please enter all fields" });
  }

  try {

    // Log the email and entered password for debugging
    console.log(" Email during login:", email);
    console.log(" Raw entered password during login:", password);
    
    // Check if the user exists
    const user = await User.findOne({ email });

    if (!user) {
      console.error("❌ User not found:", email);
      return res.status(401).json({ message: "❌ Invalid email or password" });
    }

    // Compare the entered password with the hashed password
    // Check if the entered password matches the hashed password
const isMatch = await bcrypt.compare(password, user.password);
console.log(" Stored password:", user.password);
console.log(" Entered password (hashed comparison):", password);
console.log(" Password match result:", isMatch);


    // Generate JWT token
    const token = generateToken(user._id);

    console.log(" User logged in successfully:", email);
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      accountType: user.accountType,
      token,
      message: " Login successful!",
    });
  } catch (error) {
    console.error("❌ Error during login:", error.message);
    res.status(500).json({ message: "❌ Login failed", error: error.message });
  }
};

// @desc Get user profile
// @route GET /api/auth/profile
// @access Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "❌ User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("❌ Error fetching user profile:", error.message);
    res.status(500).json({ message: "❌ Error fetching user profile", error: error.message });
  }
};

// @desc Update user profile
// @route PUT /api/auth/profile
// @access Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "❌ User not found" });
    }

    user.name = req.body.name || user.name;
    user.accountType = req.body.accountType || user.accountType;

    // Hash password if it's being updated
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await user.save();

    console.log(" Profile updated successfully for user:", user.email);
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      accountType: updatedUser.accountType,
      token: generateToken(updatedUser._id),
      message: " Profile updated successfully!",
    });
  } catch (error) {
    console.error("❌ Error updating profile:", error.message);
    res.status(500).json({ message: "❌ Error updating profile", error: error.message });
  }
};

module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile };
