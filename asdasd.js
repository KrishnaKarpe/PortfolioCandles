const API_KEY = 'your_alpha_vantage_api_key';

const stocks = {
    'IBM': 4,
    'AAPL': 5
};

const fetchOHLC = (stock) => {
    return new Promise((resolve, reject) => {
        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${stock}&apikey=${API_KEY}&outputsize=compact`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data['Time Series (Daily)']) {
                    resolve(data['Time Series (Daily)']);
                } else {
                    reject(new Error(`No data found for ${stock}`));
                }
            })
            .catch(error => {
                reject(error);
            });
    });
};

const calculateWeightedOHLC = () => {
    return new Promise((resolve, reject) => {
        let weightedOHLC = {};

        const fetchPromises = Object.keys(stocks).map(stock => {
            return fetchOHLC(stock).then(ohlcData => {
                for (const [date, values] of Object.entries(ohlcData)) {
                    if (!weightedOHLC[date]) {
                        weightedOHLC[date] = { open: 0, high: 0, low: 0, close: 0 };
                    }
                    weightedOHLC[date].open += parseFloat(values['1. open']) * stocks[stock];
                    weightedOHLC[date].high += parseFloat(values['2. high']) * stocks[stock];
                    weightedOHLC[date].low += parseFloat(values['3. low']) * stocks[stock];
                    weightedOHLC[date].close += parseFloat(values['4. close']) * stocks[stock];
                }
            }).catch(error => {
                console.error(`Error fetching data for ${stock}:`, error);
            });
        });

        // Wait for all fetches to complete
        Promise.all(fetchPromises)
            .then(() => {
                resolve(weightedOHLC);
            })
            .catch(error => {
                reject(error);
            });
    });
};

const populateChart = () => {
    calculateWeightedOHLC()
        .then(weightedOHLC => {
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
        })
        .catch(error => {
            console.error('Error calculating weighted OHLC:', error);
        });
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
