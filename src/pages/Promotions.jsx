import React from 'react';

export default function Promotions() {
  return (
    <div className="promotions-page">
      <h2>Promociones</h2>
      <div style={{ minHeight: 90, margin: '2rem 0px', textAlign: 'center' }}>
        <a href="https://adsterra.com/?referral=YOUR_REFERRAL_ID" rel="nofollow" target="_blank">
          <img alt="banner" src="/adsterra-banner.gif" style={{ maxWidth: '100%', height: 'auto', borderRadius: 8, boxShadow: 'rgba(0, 0, 0, 0.08) 0px 2px 8px' }} />
        </a>
      </div>
    </div>
  );
}
