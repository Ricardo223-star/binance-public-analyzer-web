(function () {
  window.BinanceAnalyzer = window.BinanceAnalyzer || {};

  const { formatPrice, formatPercent, formatVolume, formatLastUpdated, escapeHtml } =
    window.BinanceAnalyzer.Format;
  const { timeframeLabels } = window.BinanceAnalyzer.AnalysisRules;
  const { renderCandlestickChart } = window.BinanceAnalyzer.ChartUI;
  const { TIMEFRAMES } = window.BinanceAnalyzer.Models;

  function renderTrendBadge(trend) {
    if (trend === "ALCISTA") {
      return '<div class="status-badge alcista">ALCISTA</div>';
    }
    if (trend === "BAJISTA") {
      return '<div class="status-badge bajista">BAJISTA</div>';
    }
    return '<div class="status-badge neutral">NEUTRAL</div>';
  }

  function renderSetupBadge(setup) {
    if (setup === "POSIBLE LONG") {
      return '<div class="status-badge alcista">POSIBLE LONG</div>';
    }
    if (setup === "POSIBLE SHORT") {
      return '<div class="status-badge bajista">POSIBLE SHORT</div>';
    }
    return '<div class="status-badge neutral">ESPERAR / SIN SETUP</div>';
  }

  function renderHome(state) {
    const hasSnapshots = state.snapshots.length > 0;

    return `
      <section class="screen-block">
        <section class="info-row">
          <p class="updated-time">Última actualización: ${formatLastUpdated(state.homeLastUpdated)}</p>
          <button class="action-button secondary action-single" data-action="refresh-home">
            ${state.homeRefreshing ? "Actualizando..." : "Actualizar"}
          </button>
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
    const supportDistance = analysis.indicators.supportDistancePct !== null
      ? formatPercent(analysis.indicators.supportDistancePct)
      : null;
    const resistanceValue = analysis.indicators.resistance
      ? `${formatPrice(analysis.indicators.resistance)} USDT`
      : "No detectada";
    const resistanceDistance = analysis.indicators.resistanceDistancePct !== null
      ? formatPercent(analysis.indicators.resistanceDistancePct)
      : null;

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
          <p class="price-label">Precio actual</p>
          <p class="price-value">${formatPrice(analysis.currentPrice)} USDT</p>
          <p class="updated-time">Última actualización: ${formatLastUpdated(analysis.lastUpdated)}</p>
          <div class="signal-grid">
            <article class="signal-card">
              <p class="signal-label">Tendencia</p>
              ${renderTrendBadge(analysis.trend)}
            </article>
            <article class="signal-card">
              <p class="signal-label">Setup</p>
              ${renderSetupBadge(analysis.setup)}
            </article>
          </div>
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

        <section class="chart-card card">
          ${renderCandlestickChart(analysis, state.selectedCandleOpenTime)}
        </section>

        <section class="metric-grid compact-metrics">
          <article class="metric-card">
            <p class="metric-label">RSI</p>
            <p class="metric-value">${analysis.indicators.rsi14.toFixed(2)}</p>
            <p class="metric-subvalue">${analysis.rsiStateLabel}</p>
          </article>
          <article class="metric-card">
            <p class="metric-label">Volumen</p>
            <p class="metric-value">${formatPercent(analysis.indicators.volumeDeltaPercent)} vs promedio 10 velas</p>
            <p class="metric-subvalue">Última vela cerrada: ${formatVolume(analysis.indicators.currentVolume)}</p>
          </article>
        </section>

        <section class="level-grid">
          <article class="level-card">
            <p class="level-label">Soporte cercano</p>
            <p class="level-value">${supportValue}</p>
            <p class="metric-subvalue">${supportDistance ? `Distancia ${supportDistance}` : "Sin distancia útil"}</p>
          </article>
          <article class="level-card">
            <p class="level-label">Resistencia cercana</p>
            <p class="level-value">${resistanceValue}</p>
            <p class="metric-subvalue">${resistanceDistance ? `Distancia ${resistanceDistance}` : "Sin distancia útil"}</p>
          </article>
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
