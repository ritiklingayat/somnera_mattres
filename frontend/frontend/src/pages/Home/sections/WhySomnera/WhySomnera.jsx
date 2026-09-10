import './WhySomnera.css';
const reasons = [
  [
    '01',
    'The right kind of support',
    'Carefully selected layers keep your spine comfortably aligned all night long.',
  ],
  [
    '02',
    'Built to last beautifully',
    'High-resilience foams and meticulous finishing create comfort that stays with you.',
  ],
  [
    '03',
    'A fit for every sleeper',
    'Choose your collection, mattress size and thickness for a distinctly personal feel.',
  ],
];
export default function WhySomnera() {
  return (
    <section id="why-us" className="why section">
      <div className="container why-layout">
        <div className="why-intro">
          <span className="section-kicker">Made for your best sleep</span>
          <h2 className="section-title">
            Comfort is not a luxury.
            <br />
            It’s your <em>everyday.</em>
          </h2>
          min
          <p>
            We blend considered materials with practical expertise to make sleep feel naturally
            better, night after night.
          </p>
          <div className="quote-mark">“</div>
        </div>
        <div className="reason-list">
          {reasons.map(([number, title, copy]) => (
            <article key={number}>
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
