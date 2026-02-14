import React from 'react';

const OddsWidgetPage = () => (
  <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <h2>Comparador de Cuotas (OddsWidget)</h2>
    <iframe
      title="Sports Odds Widget"
      style={{ width: '20rem', height: '25rem', border: '1px solid black' }}
      src="https://widget.the-odds-api.com/v1/sports/basketball_ncaab/events/?accessKey=wk_92b3eea5706c8c17a93b952c5a1c894c&bookmakerKeys=betmgm&oddsFormat=american&markets=h2h%2Cspreads%2Ctotals&marketNames=h2h%3AMoneyline%2Cspreads%3ASpreads%2Ctotals%3AOver%2FUnder"
    ></iframe>
  </div>
);

export default OddsWidgetPage;
