import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ADVICE_SECTIONS = [
  {
    id: 'buying-guide',
    title: 'Mattress Buying Guide',
    icon: '📘',
    summary: 'Everything you need to know before buying a mattress online or in-store.',
    content: `When selecting a mattress, consider three key factors: your primary sleeping position, body weight, and back support needs. Side sleepers usually benefit from medium-soft body contouring like Memory Foam or Natural Latex. Back and stomach sleepers require firmer support to keep the spine neutral.`,
  },
  {
    id: 'firmness-guide',
    title: 'How to Choose Mattress Firmness',
    icon: '⚖️',
    summary: 'Find the ideal balance of plush pressure relief and firm orthopaedic support.',
    content: `Firmness scales from 1 (Ultra Soft) to 10 (Extra Firm). Somnera mattresses focus on the most popular comfort sweet spots: Gentle (3-4), Medium Firm (6-7), and Firm (8-9). Medium Firm is medically recommended for 80% of adults with back strain.`,
  },
  {
    id: 'size-guide',
    title: 'Mattress Size Guide',
    icon: '📐',
    summary: 'Standard Indian mattress dimensions for Single, Double, Queen and King beds.',
    content: `Single: 72x30 in / 72x36 in (ideal for kids or single adults). Double: 72x48 in (compact space for one adult). Queen: 72x60 in / 78x60 in (most popular choice for couples). King: 72x72 in / 78x72 in (spacious room for couples with children or pets).`,
  },
  {
    id: 'sleep-tips',
    title: 'Sleep Tips & Care',
    icon: '🌙',
    summary: 'Extend the lifespan of your mattress and wake up feeling refreshed every day.',
    content: `1. Rotate your mattress 180° every 3 to 6 months for even wear. 2. Always use a waterproof Somnera mattress protector to keep spills and dust mites out. 3. Avoid folding or standing on an orthopaedic foam mattress.`,
  },
  {
    id: 'back-support',
    title: 'Back Support & Spine Alignment',
    icon: '🩺',
    summary: 'Medical insights on how rebonded ortho foam reduces morning stiffness.',
    content: `A sagging mattress forces your lumbar spine to bend unnaturally for 7 to 8 hours every night. Somnera Orthopaedic mattresses use high-density rebonded foam and natural latex to support the lower back lumbar arch while reducing pressure points.`,
  },
];

const FAQS = [
  {
    q: 'Which Somnera mattress is best for chronic back pain?',
    a: 'We strongly recommend the OG-Ortho Pro Latex or OrthoSense DuraFirm mattress. Both incorporate high-density Ortho Rebonded foam designed to maintain proper lumbar spinal alignment.',
  },
  {
    q: 'What thickness should I choose (4", 5", 6", or 8")?',
    a: '6-inch thickness is ideal for standard adult body weight (up to 85 kg per sleeper). 8-inch thickness offers enhanced luxury, deeper cushioning, and higher weight tolerance.',
  },
  {
    q: 'Is there a warranty on Somnera mattresses?',
    a: 'Yes! Every Somnera mattress comes with a clear, manufacturer-backed warranty ranging from 7 to 10 years against sagging and manufacturing defects.',
  },
  {
    q: 'How long does nationwide delivery take?',
    a: 'Delivery is free across India and typically takes 3 to 7 business days depending on your location.',
  },
];

export function SleepAdvicePage() {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const navigate = useNavigate();

  return (
    <div className="sleep-advice-page">
      <div style={{ background: '#002b49', color: '#ffffff', padding: '60px 0', textAlign: 'center' }}>
        <div className="container">
          <span style={{ color: '#38bdf8', fontWeight: '800', letterSpacing: '0.12em', fontSize: '0.8rem' }}>
            SOMNERA SLEEP LAB
          </span>
          <h1 style={{ fontFamily: "var(--font-display, 'Playfair Display', serif)", fontSize: '2.5rem', margin: '12px 0' }}>
            Sleep Advice & Buying Guides
          </h1>
          <p style={{ maxWidth: '640px', margin: '0 auto', color: '#cbd5e1', fontSize: '1rem' }}>
            Expert guidance to help you choose the right mattress, firmness, size and posture support for deeper rest.
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '50px 0 80px' }}>
        {/* Guides Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '60px' }}>
          {ADVICE_SECTIONS.map((guide) => (
            <div
              key={guide.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '24px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{guide.icon}</div>
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a', margin: '0 0 8px 0' }}>{guide.title}</h2>
              <p style={{ fontWeight: '600', color: '#0284c7', fontSize: '0.85rem', margin: '0 0 12px 0' }}>{guide.summary}</p>
              <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 18px 0' }}>{guide.content}</p>
              <button
                type="button"
                onClick={() => navigate('/mattresses')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0284c7',
                  fontWeight: '800',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Shop Recommended Mattresses →
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div style={{ maxWidth: '800px', margin: '0 auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px' }}>
          <h2 style={{ fontFamily: "var(--font-display, 'Playfair Display', serif)", fontSize: '1.8rem', color: '#0f172a', textAlign: 'center', margin: '0 0 24px 0' }}>
            Frequently Asked Questions
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {FAQS.map((faq, i) => (
              <div
                key={faq.q}
                style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(openFaqIndex === i ? -1 : i)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: '#f8fafc',
                    border: 'none',
                    padding: '16px 20px',
                    fontWeight: '700',
                    fontSize: '0.95rem',
                    color: '#0f172a',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ fontSize: '1.2rem', color: '#0284c7' }}>{openFaqIndex === i ? '−' : '+'}</span>
                </button>

                {openFaqIndex === i && (
                  <div style={{ padding: '16px 20px', background: '#ffffff', color: '#475569', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
