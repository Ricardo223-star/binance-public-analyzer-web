(function () {
  window.BinanceAnalyzer = window.BinanceAnalyzer || {};

  const { formatPrice, formatPercent, formatVolume, formatLastUpdated, escapeHtml } =
    window.BinanceAnalyzer.Format;
  const { timeframeLabels } = window.BinanceAnalyzer.AnalysisRules;
  const { renderCandlestickChart } = window.BinanceAnalyzer.ChartUI;
  const { TIMEFRAMES } = window.BinanceAnalyzer.Models;

  function renderBadge(bias) {
    if (bias === "ALCISTA") {
      return '<div class="status-badge alcista">ALCISTA</div>';
    }
    if (bias === "BAJISTA") {
      return '<div class="status-badge bajista">BAJISTA</div>';
    }
    return '<div class="status-badge neutral">NEUTRAL / SIN SETUP CLARO</div>';
  }

  function renderHome(state) {
    const hasSnapshots = state.snapshots.length > 0;

    return `
      <section class="screen-block">
        <section class="hero-card card">
          <h2>Lectura rápida de mercado</h2>
          <p class="hero-copy">
            Precio actual, variación de 24 horas y acceso al análisis técnico de BTC/USDT y ETH/USDT.
          </p>
        </section>

        <section class="info-row">
          <p class="updated-time">Última actualización: ${formatLastUpdated(state.homeLastUpdated)}</p>
          <div class="action-row">
            <button class="action-button secondary" data-action="refresh-home">
              ${state.homeRefreshing ? "Actualizando..." : "Actualizar"}
            </button>
            <button class="action-button primary" data-action="open-symbol" data-symbol="BTCUSDT">
              Abrir BTC
            </button>
          </div>
        </section>

        ${state.homeError ? `<p class="error-text">${escapeHtml(state.homeError)}</p>` : ""}
        ${state.homeLoading && !hasSnapshots ? '<section class="loading-card card"><p class="muted">Cargando precios...</p></section>' : ""}

        <section class="price-grid">
          ${state.snapshots
            .map((snapshot) => {
              const tone =
                snapshot.priceChangePercent > 0
                  ? "positive"
                  : snapshot.priceChangePercent < 0
                    ? "negative"
                    : "neutral";
              return `
                <button class="price-tile card" data-action="open-symbol" data-symbol="${snapshot.symbol}">
                  <div class="tile-head">
                    <span class="symbol">${snapshot.symbol.replace("USDT", "")}</span>
                    <span class="pill ${tone}">${formatPercent(snapshot.priceChangePercent)}</span>
                  </div>
                  <div class="big-price">${formatPrice(snapshot.price)}</div>
                  <div class="hint">Tocar para abrir el análisis</div>
                </button>
              `;
            })
            .join("")}
        </section>

        <section class="text-card card">
          <h3>Alcance del MVP</h3>
          <p class="explanation">
            Esta versión usa únicamente endpoints públicos de Binance. No hay trading automático,
            no hay API privada y no se fuerza un LONG o SHORT cuando no existe setup claro.
          </p>
        </section>
      </section>
    `;
  }

  function renderAnalysis(state) {
    if (state.analysisLoading && !state.analysis) {
      return `
        <section class="screen-block">
          <div class="header-row">
            <button class="back-button" data-action="back-home">Volver</button>
            <button class="action-button primary" data-action="refresh-analysis">Actualizar</button>
          </div>
          <section class="loading-card card">
            <p class="muted">Cargando análisis...</p>
          </section>
        </section>
      `;
    }

    if (!state.analysis) {
      return `
        <section class="screen-block">
          <div class="header-row">
            <button class="back-button" data-action="back-home">Volver</button>
            <button class="action-button primary" data-action="refresh-analysis">Actualizar</button>
          </div>
          <section class="loading-card card">
            <p class="error-text">${escapeHtml(state.analysisError || "No se pudo cargar el análisis.")}</p>
          </section>
        </section>
      `;
    }

    const analysis = state.analysis;
    const supportValue = analysis.indicators.support
      ? `${formatPrice(analysis.indicators.support)} USDT`
      : "No detectado";
    const resistanceValue = analysis.indicators.resistance
      ? `${formatPrice(analysis.indicators.resistance)} USDT`
      : "No detectada";

    const conditionCards = [
      {
        label: "Precio vs EMA21",
        value: analysis.conditions.priceAboveEma21
          ? "Precio sobre EMA21"
          : analysis.conditions.priceBelowEma21
            ? "Precio bajo EMA21"
            : "Sin definición",
      },
      {
        label: "Estructura EMA",
        value: analysis.conditions.emaBullStack
          ? "EMA21 > EMA50 > EMA180"
          : analysis.conditions.emaBearStack
            ? "EMA21 < EMA50 < EMA180"
            : "EMAs mezcladas",
      },
      {
        label: "RSI",
        value: `${analysis.indicators.rsi14.toFixed(2)} · ${analysis.rsiStateLabel}`,
      },
      {
        label: "Volumen",
        value: analysis.conditions.volumeAboveAverage
          ? "Superior al promedio"
          : "Por debajo del promedio",
      },
    ];

    return `
      <section class="screen-block">
        <div class="header-row">
          <button class="back-button" data-action="back-home">Volver</button>
          <button class="action-button primary" data-action="refresh-analysis">
            ${state.analysisRefreshing ? "Actualizando..." : "Actualizar"}
          </button>
        </div>

        <section class="analysis-card card analysis-header">
          <h2>${analysis.symbol.replace("USDT", "/USDT")}</h2>
          <p class="analysis-copy">
            Velas, EMAs, RSI, volumen, soporte y resistencia con datos públicos de Binance.
          </p>
          ${renderBadge(analysis.bias)}
        </section>

        <section class="timeframe-row">
          ${TIMEFRAMES.map(
            (timeframe) => `
              <button
                class="timeframe-button ${state.timeframe === timeframe ? "active" : ""}"
                data-action="set-timeframe"
                data-timeframe="${timeframe}"
              >
                ${timeframeLabels[timeframe]}
              </button>
            `,
          ).join("")}
        </section>

        ${state.analysisError ? `<p class="error-text">${escapeHtml(state.analysisError)}</p>` : ""}

        <section class="analysis-card card price-spotlight">
          <p class="price-label">Precio actual</p>
          <p class="price-value">${formatPrice(analysis.currentPrice)} USDT</p>
          <p class="updated-time">Última actualización: ${formatLastUpdated(analysis.lastUpdated)}</p>
        </section>

        <section class="chart-card card">
          ${renderCandlestickChart(analysis)}
        </section>

        <section class="metric-grid">
          <article class="metric-card"><p class="metric-label">EMA 21</p><p class="metric-value">${formatPrice(analysis.indicators.ema21)}</p></article>
          <article class="metric-card"><p class="metric-label">EMA 50</p><p class="metric-value">${formatPrice(analysis.indicators.ema50)}</p></article>
          <article class="metric-card"><p class="metric-label">EMA 180</p><p class="metric-value">${formatPrice(analysis.indicators.ema180)}</p></article>
          <article class="metric-card"><p class="metric-label">RSI 14</p><p class="metric-value">${analysis.indicators.rsi14.toFixed(2)}</p></article>
          <article class="metric-card"><p class="metric-label">Volumen actual</p><p class="metric-value">${formatVolume(analysis.indicators.currentVolume)}</p></article>
          <article class="metric-card"><p class="metric-label">Promedio 10 velas</p><p class="metric-value">${formatVolume(analysis.indicators.averageVolume10)}</p></article>
        </section>

        <section class="text-card card">
          <h3>Lectura del setup</h3>
          <div class="condition-grid">
            ${conditionCards
              .map(
                (item) => `
                  <article class="condition-card">
                    <p class="condition-label">${escapeHtml(item.label)}</p>
                    <p class="condition-value">${escapeHtml(item.value)}</p>
                  </article>
                `,
              )
              .join("")}
          </div>
        </section>

        <section class="text-card card">
          <h3>Soporte y resistencia</h3>
          <div class="level-grid">
            <article class="level-card">
              <p class="level-label">Soporte cercano</p>
              <p class="level-value">${supportValue}</p>
            </article>
            <article class="level-card">
              <p class="level-label">Resistencia cercana</p>
              <p class="level-value">${resistanceValue}</p>
            </article>
          </div>
        </section>

        <section class="text-card card">
          <h3>Conclusión automática</h3>
          <p class="explanation">${escapeHtml(analysis.explanation)}</p>
        </section>
      </section>
    `;
  }

  window.BinanceAnalyzer.Renderers = {
    renderHome,
    renderAnalysis,
  };
})();
