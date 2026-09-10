import logo from '../../assets/images/somnera-logo.jpeg';
import { siteConfig } from '../../config/siteConfig';
import './Footer.css';
export default function Footer() {
  return (
    <footer id="contact" className="footer">
      <div className="container footer-grid">
        <div>
          <img className="footer-logo" src={logo} alt="Somnera" />
          <p>{siteConfig.tagline}. Thoughtfully made comfort for every home.</p>
        </div>
        <div>
          <h3>Let’s talk comfort</h3>
          <a href={`tel:${siteConfig.phone}`}>+91 {siteConfig.phone}</a>
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
        </div>
        <div>
          <h3>Explore</h3>
          <a href="#products">Mattresses</a>
          <a href="#why-us">Why Somnera</a>
          <a href="#promise">Our promise</a>
          <a href="#admin">Admin Portal</a>
        </div>
      </div>
      <div className="container footer-bottom">
        © {new Date().getFullYear()} Somnera Mattresses & Foam. Made for better sleep.
      </div>
    </footer>
  );
}
