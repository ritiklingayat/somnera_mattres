import { siteConfig } from '../../../../config/siteConfig';
import './ContactCta.css';
export default function ContactCta() {
  return (
    <section className="section contact-cta">
      <div className="container contact-card">
        <div>
          <span className="section-kicker">Need help choosing?</span>
          <h2 className="section-title">
            Let’s find your
            <br />
            <em>perfect sleep.</em>
          </h2>
          <p>
            Speak with a Somnera comfort expert for help finding the right mattress for your home.
          </p>
        </div>
        <div className="contact-actions">
          <a className="button button-primary" href={`tel:${siteConfig.phone}`}>
            Call +91 {siteConfig.phone}
          </a>
          <a className="text-link" href={`mailto:${siteConfig.email}`}>
            {siteConfig.email} <span>→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
