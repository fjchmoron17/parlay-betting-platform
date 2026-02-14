import React, { useEffect } from 'react';

const AdsterraBanner = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://pl28716808.effectivegatecpm.com/5f/3f/fc/5f3ffcccc668a7ab45d1656ce517bc12.js";
    script.async = true;
    document.getElementById('adsterra-zone').appendChild(script);
  }, []);

  return (
    <div id="adsterra-zone" style={{ minHeight: 90, margin: '2rem 0' }}>
      {/* El anuncio de Adsterra aparecerá aquí */}
    </div>
  );
};

export default AdsterraBanner;
