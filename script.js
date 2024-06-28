const API_KEY = 'GK65T8KL7I768JJJ';

const stocks = {
    'IBM': 4,
    'AAPL': 5
};

const fetchOHLC = async (stock) => {
    try {
        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${stock}&apikey=${API_KEY}&outputsize=compact`;
        const response = await fetch(url);
        const data = await response.json();
        
        // Check if the response contains valid data
        if (data['Time Series (Daily)']) {
            return data['Time Series (Daily)'];
        } else {
            throw new Error(`No data found for ${stock}`);
        }
    } catch (error) {
        console.error(`Error fetching data for ${stock}:`, error);
        return null;
    }
};

const calculateWeightedOHLC = async () => {
    let weightedOHLC = {};

    for (const [stock, shares] of Object.entries(stocks)) {
        const ohlcData = await fetchOHLC(stock);
        
        if (ohlcData) {
            for (const [date, values] of Object.entries(ohlcData)) {
                if (!weightedOHLC[date]) {
                    weightedOHLC[date] = { open: 0, high: 0, low: 0, close: 0 };
                }
                weightedOHLC[date].open += parseFloat(values['1. open']) * shares;
                weightedOHLC[date].high += parseFloat(values['2. high']) * shares;
                weightedOHLC[date].low += parseFloat(values['3. low']) * shares;
                weightedOHLC[date].close += parseFloat(values['4. close']) * shares;
            }
        }
    }

    return weightedOHLC;
};

const populateChart = async () => {
    const weightedOHLC = await calculateWeightedOHLC();
    const chartData = [];

    for (const [date, values] of Object.entries(weightedOHLC)) {
        chartData.push({
            time: new Date(date).getTime(),
            open: values.open.toFixed(2),
            high: values.high.toFixed(2),
            low: values.low.toFixed(2),
            close: values.close.toFixed(2),
        });
    }

    createChart(chartData);
};

const createChart = (data) => {
    const chartContainer = document.getElementById('chart');
    const chart = LightweightCharts.createChart(chartContainer, {
        width: chartContainer.clientWidth,
        height: 400,
        layout: {
            backgroundColor: '#ffffff',
            textColor: '#000000',
        },
        grid: {
            vertLines: {
                color: '#e0e0e0',
            },
            horzLines: {
                color: '#e0e0e0',
            },
        },
        priceScale: {
            borderColor: '#e0e0e0',
        },
        timeScale: {
            borderColor: '#e0e0e0',
        },
    });

    const candleSeries = chart.addCandlestickSeries({
        upColor: '#4caf50',
        downColor: '#f44336',
        borderVisible: false,
        wickUpColor: '#4caf50',
        wickDownColor: '#f44336',
    });

    candleSeries.setData(data);
};

document.addEventListener('DOMContentLoaded', populateChart);
