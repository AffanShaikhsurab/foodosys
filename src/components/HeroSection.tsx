export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="status-card">
        <div className="status-header">
          <span className="status-pill">Live Updates</span>
          <i className="ri-restaurant-2-line" style={{ fontSize: '20px', opacity: '0.8' }}></i>
        </div>
        <div className="status-main">
          <h2>3 Menus Live</h2>
          <p>8 food courts are currently open.</p>
        </div>
        {/* SVG Wave decoration */}
        <svg className="deco-line" viewBox="0 0 100 20" preserveAspectRatio="none" style={{ position: 'absolute', bottom: '20px', right: '0', width: '100%', height: '40px', opacity: '0.3', zIndex: '1' }}>
          <path d="M0 10 Q 25 20 50 10 T 100 10" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" />
        </svg>
      </div>
    </section>
  )
}