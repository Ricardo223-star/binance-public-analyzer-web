(function () {
  window.BinanceAnalyzer = window.BinanceAnalyzer || {};

  const root = document.getElementById("app");
  const { SYMBOLS, DEFAULT_TIMEFRAME } = window.BinanceAnalyzer.Models;
  const rules = window.BinanceAnalyzer.AnalysisRules;
  const { renderHome, renderAnalysis } = window.BinanceAnalyzer.Renderers;
  const { getHomeSnapshots, getCurrentPrice, getCandles } =
    window.BinanceAnalyzer.BinanceService;
  const { buildSymbolAnalysis } = window.BinanceAnalyzer.AnalysisEngine;

  const state = {
    view: "home",
    selectedSymbol: null,
    timeframe: DEFAULT_TIMEFRAME,
    snapshots: [],
    homeLoading: true,
    homeRefreshing: false,
    homeError: null,
    homeLastUpdated: null,
    analysis: null,
    analysisLoading: false,
    analysisRefreshing: false,
    analysisError: null,
    selectedCandleOpenTime: null,
  };

  function renderApp() {
    root.innerHTML = state.view === "home" ? renderHome(state) : renderAnalysis(state);
  }

  async function loadHome(options) {
    const silent = options && options.silent;

    if (silent) {
      state.homeRefreshing = true;
    } else {
      state.homeLoading = true;
    }

    renderApp();

    try {
      state.snapshots = await getHomeSnapshots(SYMBOLS);
      state.homeLastUpdated = Date.now();
      state.homeError = null;
    } catch (error) {
      state.homeError =
        error instanceof Error ? error.message : "No se pudo cargar el home de Binance.";
    } finally {
      state.homeLoading = false;
      state.homeRefreshing = false;
      renderApp();
    }
  }

  async function loadAnalysis(options) {
    if (!state.selectedSymbol) {
      return;
    }

    const silent = options && options.silent;

    if (silent) {
      state.analysisRefreshing = true;
    } else {
      state.analysisLoading = true;
      state.analysis = null;
      state.selectedCandleOpenTime = null;
    }

    renderApp();

    try {
      const [currentPrice, candles] = await Promise.all([
        getCurrentPrice(state.selectedSymbol),
        getCandles(state.selectedSymbol, state.timeframe, rules.candlesLimit),
      ]);

      state.analysis = buildSymbolAnalysis(
        state.selectedSymbol,
        state.timeframe,
        candles,
        currentPrice,
      );
      state.analysisError = null;
    } catch (error) {
      state.analysisError =
        error instanceof Error ? error.message : "No se pudo cargar el análisis.";
    } finally {
      state.analysisLoading = false;
      state.analysisRefreshing = false;
      renderApp();
    }
  }

  function openSymbol(symbol) {
    state.selectedSymbol = symbol;
    state.timeframe = DEFAULT_TIMEFRAME;
    state.view = "analysis";
    void loadAnalysis();
  }

  function goHome() {
    state.view = "home";
    renderApp();
  }

  function setTimeframe(timeframe) {
    if (state.timeframe === timeframe) {
      return;
    }
    state.timeframe = timeframe;
    state.selectedCandleOpenTime = null;
    void loadAnalysis();
  }

  function setSelectedCandle(openTime) {
    state.selectedCandleOpenTime =
      String(state.selectedCandleOpenTime) === String(openTime) ? null : String(openTime);
    renderApp();
  }

  function startAutoRefresh() {
    setInterval(() => {
      void loadHome({ silent: true });
    }, rules.refreshMs.home);

    setInterval(() => {
      if (state.view === "analysis" && state.selectedSymbol) {
        void loadAnalysis({ silent: true });
      }
    }, rules.refreshMs.analysis);
  }

  root.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) {
      return;
    }

    const action = target.dataset.action;

    if (action === "refresh-home") {
      void loadHome({ silent: true });
      return;
    }

    if (action === "open-symbol") {
      openSymbol(target.dataset.symbol);
      return;
    }

    if (action === "back-home") {
      goHome();
      return;
    }

    if (action === "refresh-analysis") {
      void loadAnalysis({ silent: true });
      return;
    }

    if (action === "set-timeframe") {
      setTimeframe(target.dataset.timeframe);
      return;
    }

    if (action === "select-candle") {
      setSelectedCandle(target.dataset.candleOpenTime);
    }
  });

  renderApp();
  void loadHome();
  startAutoRefresh();
})();
