
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/transactions', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Define the Transaction schema
const transactionSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    dateOfSale: Date,
    category: String
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// API to initialize database
app.get('/api/init', async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        const transactions = response.data;

        // Insert the data into the MongoDB database
        await Transaction.insertMany(transactions);
        res.send('Database initialized with seed data.');
    } catch (error) {
        res.status(500).send('Error fetching or saving data.');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});



// Get all transactions
app.get('/api/transactions', async (req, res) => {
    const { month = new Date().toLocaleString('default', { month: 'long' }), page = 1, limit = 10, search } = req.query;

    const query = {
        dateOfSale: {
            $regex: new RegExp(month, 'i') // Filter by month name
        }
    };

    if (search) {
        query.$or = [
            { title: new RegExp(search, 'i') },
            { description: new RegExp(search, 'i') },
            { price: +search } // Convert search to number for price matching
        ];
    }

    const transactions = await Transaction.find(query)
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({ transactions, total, page, totalPages: Math.ceil(total / limit) });
});

// Get statistics
app.get('/api/statistics', async (req, res) => {
    const { month } = req.query;

    const totalSales = await Transaction.aggregate([
        { $match: { dateOfSale: { $regex: new RegExp(month, 'i') } } },
        { $group: { _id: null, total: { $sum: "$price" } } }
    ]);

    const totalSoldItems = await Transaction.countDocuments({ dateOfSale: { $regex: new RegExp(month, 'i') } });
    const totalNotSoldItems = await Transaction.countDocuments({ dateOfSale: { $not: { $regex: new RegExp(month, 'i') } } });

    res.json({
        totalSaleAmount: totalSales[0] ? totalSales[0].total : 0,
        totalSoldItems,
        totalNotSoldItems
    });
});

// Get bar chart data
app.get('/api/barchart', async (req, res) => {
    const { month } = req.query;

    const priceRanges = [
        { range: '0-100', filter: { price: { $gt: 0, $lte: 100 } } },
        { range: '101-200', filter: { price: { $gt: 100, $lte: 200 } } },
        // Add other ranges as needed
    ];

    const results = await Promise.all(priceRanges.map(async ({ filter }) => {
        return {
            range: filter.range,
            count: await Transaction.countDocuments({
                ...filter,
                dateOfSale: { $regex: new RegExp(month, 'i') }
            })
        };
    }));

    res.json(results);
});

// Get pie chart data
app.get('/api/piechart', async (req, res) => {
    const { month } = req.query;

    const categories = await Transaction.aggregate([
        { $match: { dateOfSale: { $regex: new RegExp(month, 'i') } } },
        { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    res.json(categories);
});