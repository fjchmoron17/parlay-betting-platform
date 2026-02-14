import React from 'react';

const OddsWidget = () => (
  <div style={{ margin: '20px 0' }}>
    {/* Reemplaza la URL por la de tu widget personalizado de OddsWidget */}
    <iframe
      src="TU_URL_DE_WIDGET"
      width="100%"
      height="400"
      frameBorder="0"
      scrolling="auto"
      title="OddsWidget"
      style={{ border: 'none', minWidth: 300, minHeight: 400 }}
    ></iframe>
  </div>
);

export default OddsWidget;
