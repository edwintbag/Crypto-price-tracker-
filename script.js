// API Endpoints and Global Constants
const apiURL = 'https://api.coingecko.com/api/v3/coins/markets';
const detailsAPIURL = 'https://api.coingecko.com/api/v3/coins';
const currency = 'usd'; // Default currency

// Fetch data from API
async function fetchCryptoData(query = '') {
  try {
    const url = query
      ? `${apiURL}?vs_currency=${currency}&ids=${query}&order=market_cap_desc&sparkline=false`
      : `${apiURL}?vs_currency=${currency}&order=market_cap_desc&per_page=10&page=1&sparkline=false`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.length === 0) {
      displayMessage('No results found. Please check the cryptocurrency name.');
    } else {
      displayCryptoData(data, query);  // Pass query to display detailed data
    }
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    displayMessage('An error occurred while fetching data. Please try again later.');
  }
}

// Display crypto data
function displayCryptoData(data, query = '') {
  const cryptoList = document.getElementById('cryptoList');
  cryptoList.innerHTML = '';

  data.forEach((crypto) => {
    const cryptoItem = document.createElement('div');
    cryptoItem.classList.add('crypto');
    cryptoItem.innerHTML = `
      <h3>${crypto.name} (${crypto.symbol.toUpperCase()})</h3>
      <p>Price: $${crypto.current_price.toFixed(2)}</p>
      <p>Market Cap: $${(crypto.market_cap / 1e9).toFixed(2)}B</p>
    `;

    // Create a hidden details element
    const detailsElement = document.createElement('div');
    detailsElement.classList.add('cryptoDetails');

    // Add click event to toggle details visibility
    cryptoItem.addEventListener('click', () => {
      if (detailsElement.classList.contains('visible')) {
        detailsElement.classList.remove('visible'); // Hide if already visible
      } else {
        fetchCryptoDetails(crypto.id, detailsElement);
        detailsElement.classList.add('visible'); // Show details
      }
    });

    cryptoList.appendChild(cryptoItem);
    cryptoList.appendChild(detailsElement);

    // If there was a search query and it matches, show details and chart immediately
    if (query && crypto.id === query) {
      fetchCryptoDetails(crypto.id, detailsElement);
    }
  });
}

// Fetch detailed data about a cryptocurrency
async function fetchCryptoDetails(coinId, detailsElement) {
  try {
    const response = await fetch(`${detailsAPIURL}/${coinId}`);
    const data = await response.json();

    // Populate details section
    detailsElement.innerHTML = `
      <p><strong>Current Price:</strong> $${data.market_data.current_price.usd}</p>
      <p><strong>Market Cap:</strong> $${(data.market_data.market_cap.usd / 1e9).toFixed(2)}B</p>
      <p><strong>24h High:</strong> $${data.market_data.high_24h.usd}</p>
      <p><strong>24h Low:</strong> $${data.market_data.low_24h.usd}</p>
      <p><strong>Description:</strong> ${data.description.en.substring(0, 150)}...</p>
      <p><a href="${data.links.homepage[0]}" target="_blank">Official Website</a></p>
    `;

    // Fetch and display chart
    fetchChartData(coinId, detailsElement);
  } catch (error) {
    console.error('Error fetching crypto details:', error);
    detailsElement.innerHTML = `<p>Unable to fetch details. Please try again later.</p>`;
  }
}

// Fetch chart data and display a line chart
async function fetchChartData(coinId, detailsElement) {
  const chartAPIURL = `${detailsAPIURL}/${coinId}/market_chart?vs_currency=usd&days=7`;

  try {
    const response = await fetch(chartAPIURL);
    const data = await response.json();

    // Extract data for the chart
    const dates = data.prices.map((price) => {
      const date = new Date(price[0]);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });
    const prices = data.prices.map((price) => price[1]);

    // Create or select canvas for chart
    let chartCanvas = detailsElement.querySelector('canvas');
    if (!chartCanvas) {
      chartCanvas = document.createElement('canvas');
      detailsElement.appendChild(chartCanvas);
    }

    const ctx = chartCanvas.getContext('2d');

    // Create the chart
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: `${coinId} Price (Last 7 Days)`,
            data: prices,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Price (USD)',
            },
          },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    detailsElement.innerHTML += `<p>Error loading chart data. Please try again.</p>`;
  }
}

// Display a message (e.g., for errors or no results)
function displayMessage(message) {
  const cryptoList = document.getElementById('cryptoList');
  cryptoList.innerHTML = `<p>${message}</p>`;
}

// Event Listeners
document.getElementById('searchBtn').addEventListener('click', () => {
  const query = document.getElementById('cryptoSearch').value.toLowerCase().trim();
  if (query) {
    fetchCryptoData(query);  // Fetch data for searched crypto
  } else {
    fetchCryptoData(); // Load default data
  }
});

// Load default data on page load
fetchCryptoData();



const darkModeToggle = document.getElementById('darkModeToggle');

// Toggle dark mode
darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');

  if (document.body.classList.contains('dark')) {
    darkModeToggle.textContent = 'Light Mode';
  } else {
    darkModeToggle.textContent = 'Dark Mode';
  }
});

const timeRangeSelector = document.getElementById('timeRange');

// Fetch historical data based on time range
async function fetchHistoricalData(coinId) {
  const timeRange = timeRangeSelector.value;

  try {
    const response = await fetch(
      `${chartAPIURL}/${coinId}/market_chart?vs_currency=${currency}&days=${timeRange}`
    );
    const data = await response.json();

    const dates = data.prices.map((price) => {
      const date = new Date(price[0]);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });

    const prices = data.prices.map((price) => price[1]);

    updateChart(dates, prices, coinId);
  } catch (error) {
    console.error('Error fetching historical data:', error);
  }
}

// Update chart when the time range changes
timeRangeSelector.addEventListener('change', () => {
  const query = document.getElementById('cryptoSearch').value.toLowerCase().trim();
  if (query) {
    fetchHistoricalData(query);
  }
});




let realTimeInterval = null; // Interval ID for real-time updates

// Fetch and display data with sorting and filtering
async function fetchCryptoData(query = '') {
  try {
    const url = query
      ? `${apiURL}?vs_currency=${currency}&ids=${query}&order=market_cap_desc&sparkline=false`
      : `${apiURL}?vs_currency=${currency}&order=market_cap_desc&per_page=10&page=1&sparkline=false`;

    const response = await fetch(url);
    let data = await response.json();

    // Apply filtering and sorting
    const filterBy = document.getElementById('filterBy').value;
    const sortBy = document.getElementById('sortBy').value;

    data = filterData(data, filterBy);
    data = sortData(data, sortBy);

    displayCryptoData(data);
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    displayMessage('An error occurred while fetching data. Please try again later.');
  }
}

// Filter data based on user selection
function filterData(data, filterBy) {
  if (filterBy === 'gainers') {
    return data.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 10);
  } else if (filterBy === 'losers') {
    return data.sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0, 10);
  }
  return data;
}

// Sort data based on user selection
function sortData(data, sortBy) {
  switch (sortBy) {
    case 'price_asc':
      return data.sort((a, b) => a.current_price - b.current_price);
    case 'price_desc':
      return data.sort((a, b) => b.current_price - a.current_price);
    case 'market_cap_asc':
      return data.sort((a, b) => a.market_cap - b.market_cap);
    case 'market_cap_desc':
      return data.sort((a, b) => b.market_cap - a.market_cap);
    case 'change_asc':
      return data.sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
    case 'change_desc':
      return data.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
    default:
      return data;
  }
}

// Handle real-time updates
document.getElementById('realTimeToggle').addEventListener('change', (event) => {
  if (event.target.checked) {
    realTimeInterval = setInterval(() => {
      fetchCryptoData();
    }, 60000); // Update every minute
  } else {
    clearInterval(realTimeInterval);
  }
});

// Listen for sorting and filtering changes
document.getElementById('sortBy').addEventListener('change', () => fetchCryptoData());
document.getElementById('filterBy').addEventListener('change', () => fetchCryptoData());

// Fetch default data on load
fetchCryptoData();




