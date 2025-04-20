const Account = require("../models/accountModel");
const User = require("../models/userModel");
const mongoose = require("mongoose");

// @desc Get account balance
// @route GET /api/account/balance
// @access Private
const getBalance = async (req, res) => {
  try {
    const account = await Account.findOne({ userId: new mongoose.Types.ObjectId(req.user._id) });

    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    res.status(200).json({ success: true, balance: account.balance });
  } catch (error) {
    console.error("❌ Error fetching balance:", error);
    res.status(500).json({ success: false, message: "Error fetching balance", error: error.message });
  }
};

// @desc Deposit money
// @route POST /api/account/deposit
// @access Private
const depositMoney = async (req, res) => {
  const { amount, description } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Invalid deposit amount" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let account = await Account.findOne({ userId: new mongoose.Types.ObjectId(req.user._id) }).session(session);

    if (!account) {
      account = new Account({ userId: req.user._id, balance: 0, transactions: [] });
    }

    account.balance += amount;
    const transaction = {
      _id: new mongoose.Types.ObjectId(),
      type: "Deposit",
      amount,
      description: description || "Deposit",
      timestamp: new Date(),
    };
    account.transactions.push(transaction);

    await account.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: "Deposit successful", balance: account.balance, transaction });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Error processing deposit:", error);
    res.status(500).json({ success: false, message: "Error processing deposit", error: error.message });
  }
};

// @desc Withdraw money
// @route POST /api/account/withdraw
// @access Private
const withdrawMoney = async (req, res) => {
  const { amount, description } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Invalid withdrawal amount" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const account = await Account.findOne({ userId: new mongoose.Types.ObjectId(req.user._id) }).session(session);

    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    if (account.balance < amount) {
      return res.status(400).json({ success: false, message: "Insufficient balance" });
    }

    account.balance -= amount;
    const transaction = {
      _id: new mongoose.Types.ObjectId(),
      type: "Withdrawal",
      amount,
      description: description || "Withdrawal",
      timestamp: new Date(),
    };
    account.transactions.push(transaction);

    await account.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: "Withdrawal successful", balance: account.balance, transaction });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Error processing withdrawal:", error);
    res.status(500).json({ success: false, message: "Error processing withdrawal", error: error.message });
  }
};

// @desc Transfer funds to another user
// @route POST /api/account/transfer
// @access Private
const transferMoney = async (req, res) => {
  const { receiverEmail, amount, description } = req.body;

  if (!receiverEmail || !amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Invalid transfer details" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const sender = await Account.findOne({ userId: new mongoose.Types.ObjectId(req.user._id) }).session(session);
    const receiverUser = await User.findOne({ email: receiverEmail }).session(session);

    if (!sender) {
      return res.status(404).json({ success: false, message: "Sender account not found" });
    }

    if (!receiverUser) {
      return res.status(404).json({ success: false, message: "Receiver user not found" });
    }

    if (sender.balance < amount) {
      return res.status(400).json({ success: false, message: "Insufficient balance" });
    }

    let receiver = await Account.findOne({ userId: new mongoose.Types.ObjectId(receiverUser._id) }).session(session);

    if (!receiver) {
      receiver = new Account({ userId: receiverUser._id, balance: 0, transactions: [] });
    }

    sender.balance -= amount;
    receiver.balance += amount;

    const transactionId = new mongoose.Types.ObjectId();

    const senderTransaction = {
      _id: transactionId,
      type: "Transfer",
      amount,
      description: description || `Transfer to ${receiverUser.email}`,
      timestamp: new Date(),
      transferData: { to: receiverUser.email, transferId: transactionId },
    };

    const receiverTransaction = {
      _id: new mongoose.Types.ObjectId(),
      type: "Transfer",
      amount,
      description: description || `Transfer from ${req.user.email}`,
      timestamp: new Date(),
      transferData: { from: req.user.email, transferId: transactionId },
    };

    sender.transactions.push(senderTransaction);
    receiver.transactions.push(receiverTransaction);

    await sender.save({ session });
    await receiver.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: "Transfer successful", balance: sender.balance, transaction: senderTransaction });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Error processing transfer:", error);
    res.status(500).json({ success: false, message: "Error processing transfer", error: error.message });
  }
};

// @desc Get transaction history
// @route GET /api/account/transactions
// @access Private
const getTransactionHistory = async (req, res) => {
  try {
    const account = await Account.findOne({ userId: new mongoose.Types.ObjectId(req.user._id) });

    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    const sortedTransactions = account.transactions.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    res.status(200).json({ success: true, transactions: sortedTransactions });
  } catch (error) {
    console.error("❌ Error fetching transactions:", error);
    res.status(500).json({ success: false, message: "Error fetching transactions", error: error.message });
  }
};

module.exports = { getBalance, depositMoney, withdrawMoney, transferMoney, getTransactionHistory };
