// client/src/App.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TransactionsTable from './TransactionsTable';
import Statistics from './Statistics';
import BarChart from './BarChart';
import PieChart from './PieChart';

const App = () => {
    const [transactions, setTransactions] = useState([]);
    const [statistics, setStatistics] = useState({});
    const [barData, setBarData] = useState([]);
    const [pieData, setPieData] = useState([]);
    const [month, setMonth] = useState('March');

    const fetchData = async () => {
        try {
            const transactionResponse = await axios.get(`/api/transactions?month=${month}`);
            const statisticsResponse = await axios.get(`/api/statistics?month=${month}`);
            const barResponse = await axios.get(`/api/barchart?month=${month}`);
            const pieResponse = await axios.get(`/api/piechart?month=${month}`);

            setTransactions(transactionResponse.data.transactions);
            setStatistics(statisticsResponse.data);
            setBarData(barResponse.data);
            setPieData(pieResponse.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [month]);

    return (
        <div>
            <h1>Transaction Dashboard</h1>
            <select onChange={(e) => setMonth(e.target.value)} value={month}>
                <option value="January">January</option>
                <option value="February">February</option>
                <option value="March">March</option>
                <option value="April">April</option>
                <option value="May">May</option>
                <option value="June">June</option>
                <option value="July">July</option>
                <option value="August">August</option>
                <option value="September">September</option>
                <option value="October">October</option>
                <option value="November">November</option>
                <option value="December">December</option>
            </select>
            <TransactionsTable transactions={transactions} />
            <Statistics statistics={statistics} />
            <BarChart data={barData} />
            <PieChart data={pieData} />
        </div>
    );
};

export default App;