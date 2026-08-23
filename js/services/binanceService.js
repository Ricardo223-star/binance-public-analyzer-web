(function () {
  window.BinanceAnalyzer = window.BinanceAnalyzer || {};

  const BASE_URL = "https://data-api.binance.vision/api/v3";

  function buildQuery(params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    });
    return searchParams.toString();
  }

  async function fetchPublicJson(path, params) {
    const query = buildQuery(params || {});
    const url = query ? `${BASE_URL}${path}?${query}` : `${BASE_URL}${path}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Binance respondió con ${response.status}`);
    }

    return response.json();
  }

  function parsePrice(rawValue) {
    return Number.parseFloat(rawValue);
  }

  function parseKline(rawKline) {
    return {
      openTime: rawKline[0],
      open: parsePrice(rawKline[1]),
      high: parsePrice(rawKline[2]),
      low: parsePrice(rawKline[3]),
      close: parsePrice(rawKline[4]),
      volume: parsePrice(rawKline[5]),
      closeTime: rawKline[6],
      quoteAssetVolume: parsePrice(rawKline[7]),
      trades: rawKline[8],
      takerBuyBaseVolume: parsePrice(rawKline[9]),
      takerBuyQuoteVolume: parsePrice(rawKline[10]),
    };
  }

  async function getCurrentPrice(symbol) {
    const payload = await fetchPublicJson("/ticker/price", { symbol });
    return parsePrice(payload.price);
  }

  async function getTicker24h(symbol) {
    const payload = await fetchPublicJson("/ticker/24hr", { symbol });
    return {
      symbol: payload.symbol,
      lastPrice: parsePrice(payload.lastPrice),
      priceChangePercent: parsePrice(payload.priceChangePercent),
    };
  }

  async function getCandles(symbol, timeframe, limit) {
    const payload = await fetchPublicJson("/klines", {
      symbol,
      interval: timeframe,
      limit,
    });

    return payload.map(parseKline);
  }

  async function getHomeSnapshots(symbols) {
    const tickerPayloads = await Promise.all(symbols.map((symbol) => getTicker24h(symbol)));
    const lastUpdated = Date.now();

    return tickerPayloads.map((item) => ({
      symbol: item.symbol,
      price: item.lastPrice,
      priceChangePercent: item.priceChangePercent,
      lastUpdated,
    }));
  }

  window.BinanceAnalyzer.BinanceService = {
    getCurrentPrice,
    getTicker24h,
    getCandles,
    getHomeSnapshots,
  };
})();
