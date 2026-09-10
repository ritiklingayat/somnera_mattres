import { useEffect, useRef, useState } from 'react';
import { getPrice } from '../../data/productsData';
import { useAuth } from '../../components/Account';
import useWishlistStatus
  from '../../hooks/useWishlistStatus';
import {
  PillowProductCard,
} from '../../components/products/PillowProductCard';
import './Home.css';

/* ─── Banner slider images ─── */
import slider1 from '../../assets/Sliders images/1.png';
import slider2 from '../../assets/Sliders images/2.png';
import slider3 from '../../assets/Sliders images/3.png';
import slider4 from '../../assets/Sliders images/4.png';
import slider5 from '../../assets/Sliders images/5.png';
import mattressCategoryImage from '../../assets/images/bodiesense.jpeg';

const SLIDER_IMAGES = [slider1, slider2, slider3, slider4, slider5];
const SLIDE_INTERVAL_MS = 2000;

const benefits = [
  ['✦', 'Orthopaedic support', 'Balanced alignment for restorative sleep'],
  ['↗', 'Free delivery', 'Delivered safely to your doorstep'],
  ['✓', 'Up to 10-year warranty', 'Confidence that lasts beyond the first night'],
];

const faqs = [
  ['Which mattress is right for me?', 'Choose an orthopaedic mattress for firmer support or a memory-foam option for body-contouring comfort.'],
  ['How do I choose the right size?', 'Use your bedroom dimensions and leave clearance around the bed; Queen and King sizes offer more room to stretch.'],
  ['Is delivery free?', 'Yes. Somnera delivers mattresses free across India.'],
  ['Can I get help selecting a mattress?', 'Absolutely. Our sleep experts can guide you on comfort, size and thickness.'],
];

function Card({ product, onBrowse, onAddToCart, compact = false }) {
  
  const {
  isLoggedIn,
  openAuthModal,
} = useAuth();


  const {
  inWishlist,
  wishlistLoading,
  toggleWishlist,
} = useWishlistStatus({
  productId:
    product.id,

  isLoggedIn,

  openAuthModal,
});

  const handleWishlistToggle =
  async (event) => {

    event.stopPropagation();


    try {

      await toggleWishlist();


    } catch (error) {

      console.error(
        'Wishlist update failed:',
        error,
      );
    }
  };

  const rate = Math.min(...Object.values(product.prices || { 0: 0 }));
  const price = getPrice(product, '72x60', Object.keys(product.prices || {})[0]);
  return (
    <article className={`sleep-card ${compact ? 'sleep-card-compact' : ''}`}>
      <div className="sleep-card-image">
        <img src={product.image} alt={`${product.name} mattress`} />
        {product.badge && <span>{product.badge}</span>}
        <button
          aria-label={`Save ${product.name}`}
          className={`heart ${inWishlist ? 'active' : ''}`}
          onClick={handleWishlistToggle}
           disabled={ wishlistLoading}
          style={{ color: inWishlist ? '#ef4444' : 'inherit' }}
        >
          {inWishlist ? '♥' : '♡'}
        </button>
      </div>
      <div className="sleep-card-copy">
        <p>{product.category || product.eyebrow}</p>
        <h3>{product.name}</h3>
        <div className="rating">&#9733; 4.8 <small>| Loved by better sleepers</small></div>
        <div className="price">
          <strong>&#8377;{price.toLocaleString('en-IN')}</strong>
          <del>&#8377;{Math.round(price * 1.22).toLocaleString('en-IN')}</del>
          <b>18% off</b>
        </div>
        <small>Starting at &#8377;{rate}/sq. ft.</small>
        <div className="card-actions">
          <button onClick={() => {
            window.location.hash = `product/${product.id}`;
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}>
            View details
          </button>
          <button
            className="quick-add"
            onClick={() => onAddToCart({ ...product, size: '72x60', thickness: Object.keys(product.prices || {})[0], price })}
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}

/* ─── Hero Banner Slider ─── */
function HeroBannerSlider() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);
  const total = SLIDER_IMAGES.length;

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, SLIDE_INTERVAL_MS);
  };

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    startTimer();
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  const handleDotClick = (i) => {
    setCurrent(i);
    resetTimer();
  };

  const handlePrev = () => {
    setCurrent((prev) => (prev - 1 + total) % total);
    resetTimer();
  };

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % total);
    resetTimer();
  };

  return (
    <section className="banner-slider" aria-label="Promotional banner slider">
      <div className="banner-slider__track">
        {SLIDER_IMAGES.map((src, i) => (
          <div
            key={i}
            className={'banner-slider__slide' + (i === current ? ' is-active' : '')}
            aria-hidden={i !== current}
          >
            <img
              src={src}
              alt={'Somnera promotional banner ' + (i + 1)}
              draggable={false}
            />
          </div>
        ))}
      </div>

      <button
        className="banner-slider__arrow banner-slider__arrow--prev"
        onClick={handlePrev}
        aria-label="Previous slide"
      >
        &#8249;
      </button>
      <button
        className="banner-slider__arrow banner-slider__arrow--next"
        onClick={handleNext}
        aria-label="Next slide"
      >
        &#8250;
      </button>

      <div className="banner-slider__dots" role="tablist" aria-label="Slide indicators">
        {SLIDER_IMAGES.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === current}
            aria-label={'Go to slide ' + (i + 1)}
            className={'banner-slider__dot' + (i === current ? ' is-active' : '')}
            onClick={() => handleDotClick(i)}
          />
        ))}
      </div>
    </section>
  );
}

/* ─── Hero Text (below slider) ─── */
function HeroText({ onBrowse }) {
  return (
    <div className="hero-text-section">
      <div className="container hero-text-inner">
        <p className="hero-eyebrow">SOMNERA SLEEP EVENT &middot; ENDS SOON</p>
        <h1>Wake up to <em>better sleep.</em></h1>
        <p className="hero-sub">
          Premium mattress comfort made for the way India sleeps &mdash; with thoughtful support in every layer.
        </p>
        <div className="hero-actions">
          <button className="hero-button" onClick={() => onBrowse && onBrowse()}>
            Shop mattresses &rarr;
          </button>
          <button
            className="hero-link-btn"
            onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Explore collections
          </button>
          <button
            className="hero-link-btn hero-distributor-btn"
            onClick={() => {
              window.location.hash = 'distributor';
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Become Our Distributor
          </button>
        </div>
        <div className="hero-offer">
          <b>Up to 25% off</b>
          <span>on BodySense mattresses</span>
        </div>
      </div>
    </div>
  );
}

export default function Home({ products = [], categories = [], onBrowse, onNavigate, onAddToCart }) {
  
  const [openFaq, setOpenFaq] = useState(0);
  const displayProducts = products.length ? products : [];
  const active = displayProducts[0];
  const mattressProducts = displayProducts.filter(
    (product) =>
      product.productType === 'MATTRESS' ||
      product.productSection === 'MATTRESS',
  );

  const findCategoryImage =
    (productType, keywords, fallbackImage) => {

      const matchingProduct =
        displayProducts.find(
          (product) => {

            if (product.productType !== productType) {
              return false;
            }

            const searchable = [
              product.name,
              product.category,
              product.subcategory,
              product.productSection,
            ].join(' ').toLowerCase();


            return keywords.some(
              (keyword) =>
                searchable.includes(keyword),
            );
          },
        );


      return matchingProduct?.image ||
        fallbackImage;
    };

  const sleepCategories = [
    {
      name: 'Mattresses',
      route: 'mattresses',
      image: findCategoryImage(
        'MATTRESS',
        ['mattress'],
        mattressCategoryImage,
      ),
    },
    {
      name: 'Pillows',
      route: 'pillows',
      image: findCategoryImage(
        'PILLOW',
        ['pillow'],
        displayProducts[1]?.image || slider3,
      ),
    },
    {
      name: 'Protectors',
      route: 'pillows-protectors?type=protectors',
      image: findCategoryImage(
        'PROTECTOR',
        ['protector'],
        displayProducts[2]?.image || slider4,
      ),
    },
  ];

  const activePillows =
    displayProducts.filter(
      (product) =>
        product.productType === 'PILLOW' &&
        product.isActive !== false,
    );

  const homepagePillows =
    activePillows.some(
      (product) =>
        product.showOnHomepage,
    )
      ? activePillows.filter(
          (product) =>
            product.showOnHomepage,
        )
      : activePillows;

  return (
    <div className="sleep-home" id="top">

      {/* ── Banner Slider ── */}
      <HeroBannerSlider />

      {/* ── Hero Text Below Slider ── */}
      <HeroText onBrowse={() => onBrowse && onBrowse(active)} />

      {/* ── Trust strip ── */}
      <section className="trust-strip">
        <div className="container">
          {benefits.map(([icon, title, text]) => (
            <div key={title}>
              <b>{icon}</b>
              <span>
                <strong>{title}</strong>
                <small>{text}</small>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="home-section category-section" id="categories">
        <div className="container">
          <div className="section-heading discover-categories-heading">
            <div>
              <p>Sleep essentials</p>
              <h2>Discover Sleep <em>Categories</em></h2>
            </div>
          </div>
          <div className="category-cards">
            {(categories && categories.length > 0
    ? categories.map((cat) => ({
        name: cat.name,
        route: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'),
        image: cat.imageUrl || cat.image || findCategoryImage('MATTRESS', [cat.name.toLowerCase()], mattressCategoryImage),
      }))
    : sleepCategories).map((category) => (
              <button
                key={category.name}
                type="button"
                onClick={
                  () =>
                    onNavigate
                      ? onNavigate(category.route)
                      : onBrowse()
                }
                className="category-card"
                aria-label={`Shop ${category.name}`}
              >
                <span className="category-card-image">
                  <img src={category.image} alt="" />
                </span>
                <span className="category-card-copy">
                  <small>Somnera collection</small>
                  <strong>{category.name}</strong>
                  <b>Explore <i aria-hidden="true">&rarr;</i></b>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {
        homepagePillows.length > 0 && (
          <section className="home-section home-pillows-section">
            <div className="container">
              <div className="section-heading">
                <div>
                  <p>Pillow collection</p>
                  <h2>Find Your <em>Perfect Pillow.</em></h2>
                </div>
                <button
                  type="button"
                  onClick={
                    () => onNavigate?.('pillows')
                  }
                >
                  View all pillows &rarr;
                </button>
              </div>

              <div className="home-pillow-grid">
                {
                  homepagePillows
                    .slice(0, 3)
                    .map(
                      (product) => (
                        <PillowProductCard
                          key={product.id}
                          product={product}
                          compact
                        />
                      ),
                    )
                }
              </div>
            </div>
          </section>
        )
      }

      {/* ── New Arrivals ── */}
      <section className="home-section products-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p>New arrivals</p>
              <h2>Fresh comfort for <em>every night.</em></h2>
            </div>
            <button onClick={() => onBrowse()}>See the collection &rarr;</button>
          </div>
          <div className="product-rail">
            {mattressProducts.slice(0, 4).map((p) => (
              <Card key={p.id} product={p} onBrowse={onBrowse} onAddToCart={onAddToCart} compact />
            ))}
          </div>
        </div>
      </section>

      {/* ── Comfort Banner ── */}
      <section className="comfort-banner">
        <div className="container">
          <div>
            <div>
              <p>OUR SLEEP PROMISE</p>
              <h2>Designed for deep rest.<br /><em>Made to last.</em></h2>
              <span>Every Somnera mattress is built with considered materials, trusted support and quality that stays comfortable night after night.</span>
              <button onClick={() => onBrowse()}>Explore our mattress range &rarr;</button>
            </div>
          </div>
          <img src={displayProducts[1]?.image || active?.image} alt="Somnera mattress comfort" />
        </div>
      </section>

      {/* ── Best Sellers ── */}
      <section className="home-section products-section best-sellers">
        <div className="container">
          <div className="section-heading">
            <div>
              <p>Most loved by sleepers</p>
              <h2>Somnera <em>best sellers.</em></h2>
            </div>
          </div>
          <div className="product-rail">
            {[...mattressProducts].reverse().slice(0, 4).map((p) => (
              <Card key={p.id} product={p} onBrowse={onBrowse} onAddToCart={onAddToCart} compact />
            ))}
          </div>
        </div>
      </section>

      {/* ── Sleep Guide ── */}
      <section className="sleep-guide">
        <div className="container">
          <div>
            <p>Not sure where to begin?</p>
            <h2>Find the mattress<br />made for <em>you.</em></h2>
            <span>Answer a few simple questions about your sleep and get a comfort recommendation.</span>
            <button onClick={() => onBrowse()}>Find your sleep match &rarr;</button>
          </div>
          <div className="guide-points">
            <article>
              <b>01</b>
              <h3>Your comfort</h3>
              <p>From responsive support to plush pressure relief.</p>
            </article>
            <article>
              <b>02</b>
              <h3>Your size</h3>
              <p>Find the perfect fit for your room and routine.</p>
            </article>
            <article>
              <b>03</b>
              <h3>Your thickness</h3>
              <p>Choose the feel that supports you best.</p>
            </article>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="home-section faq-section">
        <div className="container">
          <div>
            <p>Sleep better, informed</p>
            <h2>Your Somnera questions,<br /><em>answered.</em></h2>
          </div>
          <div className="faq-list">
            {faqs.map(([q, a], i) => (
              <article className={openFaq === i ? 'open' : ''} key={q}>
                <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                  {q}<b>{openFaq === i ? '\u2212' : '+'}</b>
                </button>
                {openFaq === i && <p>{a}</p>}
              </article>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
