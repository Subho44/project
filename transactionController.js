const asyncHandler = require("express-async-handler");
const Transaction = require("../models/transactionModel");
const User = require("../models/userModel");

// @desc Get Transaction History
// @route GET /api/transactions
// @access Private
const getTransactions = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "❌ Unauthorized access" });
  }

  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      message: " Transactions fetched successfully",
      transactions,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error.message);
    res.status(500).json({ message: "❌ Error fetching transactions", error: error.message });
  }
});

// @desc Deposit Money
// @route POST /api/transactions/deposit
// @access Private
const depositMoney = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "❌ Unauthorized access" });
  }

  const amount = parseFloat(req.body.amount);
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "❌ Invalid deposit amount" });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "❌ User not found" });
    }

    if (typeof user.balance !== "number") {
      user.balance = 0; // Initialize balance if undefined
    }

    // Create transaction record
    const transaction = new Transaction({
      userId: req.user.id,
      type: "Deposit",
      amount,
    });

    // Update user balance
    user.balance += amount;
    await user.save();
    await transaction.save();

    res.status(201).json({
      message: " Deposit successful",
      transaction,
      newBalance: user.balance,
    });
  } catch (error) {
    console.error("Error processing deposit:", error.message);
    res.status(500).json({ message: "❌ Error processing deposit", error: error.message });
  }
});

// @desc Withdraw Money
// @route POST /api/transactions/withdraw
// @access Private
const withdrawMoney = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "❌ Unauthorized access" });
  }

  const amount = parseFloat(req.body.amount);
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "❌ Invalid withdrawal amount" });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "❌ User not found" });
    }

    if (typeof user.balance !== "number") {
      user.balance = 0; // Initialize balance if undefined
    }

    if (user.balance < amount) {
      return res.status(400).json({ message: "❌ Insufficient balance" });
    }

    // Create transaction record
    const transaction = new Transaction({
      userId: req.user.id,
      type: "Withdraw",
      amount,
    });

    // Update user balance
    user.balance -= amount;
    await user.save();
    await transaction.save();

    res.status(201).json({
      message: " Withdrawal successful",
      transaction,
      newBalance: user.balance,
    });
  } catch (error) {
    console.error("Error processing withdrawal:", error.message);
    res.status(500).json({ message: "❌ Error processing withdrawal", error: error.message });
  }
});

module.exports = { getTransactions, depositMoney, withdrawMoney };
