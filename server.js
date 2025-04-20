const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectdb = require('./DATABASE/db');
const authRoutes = require('./ROUTES/authRoutes');
const bodyParser = require('body-parser');

dotenv.config();
connectdb();
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use("/api/auth",authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>{
    console.log('server is running port 5000');
})