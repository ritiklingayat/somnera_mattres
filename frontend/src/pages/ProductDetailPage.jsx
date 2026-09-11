import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useParams,
} from 'react-router-dom';

import {
  getPrice,
} from '../data/productsData';

import {
  ProductImageGallery,
} from '../components/products/ProductImageGallery';

import {
  getMinProductPrice,
} from '../utils/productFilterUtils';

import {
  getProductByIdApi,
} from '../services/catalogService';

import {
  MATTRESS_SIZE_OPTIONS,
} from '../config/productSections';

import './ProductDetailPage.css';


const SIZE_OPTIONS = [
  {
    id: 'SINGLE',
    label: 'Single',
    description: 'For one sleeper',
  },
  {
    id: 'DOUBLE',
    label: 'Double',
    description: 'Compact two-person size',
  },
  {
    id: 'QUEEN',
    label: 'Queen',
    description: 'Comfortable for couples',
  },
  {
    id: 'KING',
    label: 'King',
    description: 'Extra room to stretch',
  },
  {
    id: 'CUSTOM',
    label: 'Custom Size',
    description: 'Any size you need',
  },
];

const SIZE_DIMENSIONS = {
  SINGLE: ['72x30', '72x36', '75x36', '78x30', '78x36', '84x36'],
  DOUBLE: ['72x48', '75x48', '78x48', '84x48'],
  QUEEN: ['72x60', '72x66', '75x60', '78x60', '78x66', '80x60', '84x60'],
  KING: ['72x72', '75x72', '78x72', '80x72', '84x72'],
};


export default function ProductDetailPage({
  id: propId,
  products = [],
  addToCart,
}) {

  /*
  ==================================================
  PRODUCT ID
  ==================================================
  */

  const params =
    useParams();


  const targetId =
    propId ||
    params.id;


  /*
  ==================================================
  PRODUCT STATE
  ==================================================
  */

  const [
    product,
    setProduct,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState('');


  /*
  ==================================================
  PRODUCT OPTIONS
  ==================================================
  */

  const [
    selectedSizeOption,
    setSelectedSizeOption,
  ] = useState('SINGLE');


  const [
    selectedDimension,
    setSelectedDimension,
  ] = useState('72x30');


  const [
    customLength,
    setCustomLength,
  ] = useState('72');


  const [
    customWidth,
    setCustomWidth,
  ] = useState('60');


  const [
    selectedThickness,
    setSelectedThickness,
  ] = useState('6');


  const [
    quantity,
    setQuantity,
  ] = useState(1);


  const [
    selectedAccessorySize,
    setSelectedAccessorySize,
  ] = useState('');


  useEffect(() => {
    const sizes =
      Array.isArray(product?.availableSizes)
        ? product.availableSizes.filter(Boolean)
        : [];

    setSelectedAccessorySize(sizes[0] || '');
  }, [product]);


  /*
  ==================================================
  LOAD PRODUCT FROM LOCAL CATALOG
  */

  useEffect(() => {

    let cancelled = false;


    const loadProduct =
      async () => {

        if (!targetId) {

          setProduct(null);

          setLoading(false);

          return;
        }


        try {

          setLoading(true);

          setError('');


          /*
           * Optional immediate fallback:
           *
           * If the product already exists in the
           * loaded catalog, we can show it while
           * the fresh backend request completes.
           */

          const cachedProduct =
            products.find(
              (item) =>
                String(item.id) ===
                String(targetId),
            );


          if (
            cachedProduct &&
            !cancelled
          ) {

            setProduct(
              cachedProduct,
            );
          }


          /* Always read the latest IndexedDB record. */

          const apiProduct =
            await getProductByIdApi(
              targetId,
            );


          if (cancelled) {
            return;
          }


          setProduct(
            apiProduct,
          );


        } catch (err) {

          if (cancelled) {
            return;
          }


          console.error(
            'Unable to load product details:',
            err,
          );


          /*
           * If catalog fallback exists,
           * keep showing it.
           */

          const fallbackProduct =
            products.find(
              (item) =>
                String(item.id) ===
                String(targetId),
            );


          if (fallbackProduct) {

            setProduct(
              fallbackProduct,
            );

            setError('');

          } else {

            setProduct(null);

            setError(
              err.message ||
              'Unable to load product details.',
            );
          }


        } finally {

          if (!cancelled) {

            setLoading(false);
          }
        }
      };


    loadProduct();


    return () => {

      cancelled = true;
    };

  }, [
    targetId,
    products,
  ]);


  /*
  ==================================================
  THICKNESS OPTIONS
  ==================================================
  */

  const thicknessKeys =
    Object.keys(
      product?.prices || {},
    );


  useEffect(() => {

    const keys =
      Object.keys(
        product?.prices || {},
      );


    if (
      keys.length > 0
    ) {

      setSelectedThickness(
        (previous) => {

          if (
            keys.includes(
              String(previous),
            )
          ) {

            return String(
              previous,
            );
          }


          return keys[0];
        },
      );
    }

  }, [product]);


  const configuredSizeIds =
    Array.isArray(product?.availableSizes)
      ? product.availableSizes.map(
          (size) =>
            String(size)
              .trim()
              .toUpperCase()
              .replace(/\s+/g, '_'),
        )
      : [];


  const availableSizeOptions =
    configuredSizeIds.length > 0
      ? SIZE_OPTIONS.filter(
          (option) =>
            configuredSizeIds.includes(option.id),
        )
      : SIZE_OPTIONS.filter(
          (option) =>
            MATTRESS_SIZE_OPTIONS.includes(option.label),
        );


  useEffect(() => {

    if (
      availableSizeOptions.length > 0 &&
      !availableSizeOptions.some(
        (option) => option.id === selectedSizeOption,
      )
    ) {
      setSelectedSizeOption(availableSizeOptions[0].id);
    }

  }, [product, selectedSizeOption]);


  const dimensionOptions =
    SIZE_DIMENSIONS[selectedSizeOption] || [];


  useEffect(() => {

    if (
      dimensionOptions.length > 0 &&
      !dimensionOptions.includes(selectedDimension)
    ) {
      setSelectedDimension(dimensionOptions[0]);
    }

  }, [selectedSizeOption, selectedDimension]);


  const customLengthNumber =
    Number(customLength);


  const customWidthNumber =
    Number(customWidth);


  const customSizeIsValid =
    Number.isFinite(customLengthNumber) &&
    Number.isFinite(customWidthNumber) &&
    customLengthNumber >= 24 &&
    customLengthNumber <= 120 &&
    customWidthNumber >= 24 &&
    customWidthNumber <= 120;


  const selectedStandardSize =
    selectedDimension ||
    dimensionOptions[0] ||
    '72x30';


  const selectedSize =
    selectedSizeOption === 'CUSTOM' &&
    customSizeIsValid
      ? `${customLengthNumber}x${customWidthNumber}`
      : selectedStandardSize;


  /*
  ==================================================
  LOADING
  ==================================================
  */

  if (
    loading &&
    !product
  ) {

    return (

      <div
        className="container product-not-found"
      >

        <span
          className="product-not-found-icon"
        >
          🛏️
        </span>


        <h2>
          Loading product...
        </h2>


        <p>
          Please wait while we load
          the latest product details.
        </p>

      </div>
    );
  }


  /*
  ==================================================
  ERROR / PRODUCT NOT FOUND
  ==================================================
  */

  if (!product) {

    return (

      <div
        className="container product-not-found"
      >

        <span
          className="product-not-found-icon"
        >
          🛏️
        </span>


        <h2>
          Product not found
        </h2>


        <p>

          {
            error ||
            'The product you are looking for is not currently available.'
          }

        </p>


        <a
          href="#home"
          className="button button-primary"
        >
          Return to Home →
        </a>

      </div>
    );
  }


  /*
  ==================================================
  PRICE
  ==================================================
  */

  const isMattress =
    product.productType ===
      'MATTRESS' ||
    product.productSection ===
      'MATTRESS';


  const legacyAccessoryText = [
    product.protectorType,
    product.category,
    product.subcategory,
    product.name,
  ].join(' ').toLowerCase();


  const isProtector =
    product.productType === 'PROTECTOR' ||
    product.productSection === 'PROTECTOR' ||
    (
      product.productSection === 'PILLOWS_ACCESSORIES' &&
      legacyAccessoryText.includes('protector')
    );


  const isPillow =
    !isProtector &&
    (
      product.productType === 'PILLOW' ||
      product.productSection === 'PILLOW' ||
      product.productSection === 'PILLOWS_ACCESSORIES'
    );


  const packSize =
    isPillow && Number(product.packSize) === 2
      ? 2
      : 1;


  const accessorySizes =
    isProtector && Array.isArray(product.availableSizes)
      ? product.availableSizes.filter(Boolean)
      : [];


  const collectionHash =
    isMattress
      ? 'mattresses'
      : isPillow
        ? 'pillows'
        : 'pillows-protectors?type=protectors';


  const collectionLabel =
    isMattress
      ? 'Mattresses'
      : isPillow
        ? 'Pillows'
        : 'Protectors';


  const genericPrice =
    product.price == null
      ? null
      : Number(product.price);


  const price =
    isMattress
      ? getPrice(
          product,
          selectedSize,
          selectedThickness,
        )
      : Number.isFinite(genericPrice)
        ? genericPrice
        : null;


  const minimumPrice =
    getMinProductPrice(
      product,
    );


  const displayPrice =
    isMattress
      ? price > 0
        ? price
        : minimumPrice
      : price;


  /*
   * Existing UI uses a display discount.
   *
   * Backend currently does not provide a
   * trusted discountPercent field.
   *
   * Keep current UI behavior for now.
   * Payment amount will come only from backend
   * cart/checkout in later phases.
   */

  const discountPercent =
    isMattress
      ? product.discountPercent ||
        15
      : Number(product.mrp) >
          Number(displayPrice) &&
        Number(displayPrice) > 0
        ? Math.round(
            (
              1 -
              Number(displayPrice) /
                Number(product.mrp)
            ) * 100,
          )
        : 0;


  const originalPrice =
    isMattress
      ? Math.round(
          displayPrice *
          (
            1 +
            discountPercent /
            100
          ),
        )
      : Number(product.mrp) > 0
        ? Number(product.mrp)
        : null;


  const checkoutPrice =
    displayPrice != null &&
    Number.isFinite(Number(displayPrice))
      ? Number(displayPrice) * quantity
      : displayPrice;


  const checkoutOriginalPrice =
    originalPrice != null &&
    Number.isFinite(Number(originalPrice))
      ? Number(originalPrice) * quantity
      : originalPrice;


  const isOutOfStock =
    product.stock != null &&
    Number(product.stock) <= 0;


  const hasPurchasablePrice =
    Number.isFinite(Number(displayPrice)) &&
    Number(displayPrice) > 0;


  const materials =
    Array.isArray(
      product.materials,
    )
      ? product.materials
      : [];


  /*
  ==================================================
  UI
  ==================================================
  */

  return (

    <div className="product-detail-page">

      <div className="container">

        <nav
          className="product-breadcrumb"
          aria-label="Breadcrumb"
        >

          <a href="#home">
            Home
          </a>


          <span>
            /
          </span>


          <a href={`#${collectionHash}`}>
            {collectionLabel}
          </a>


          <span>
            /
          </span>


          <span
            className="breadcrumb-current"
          >
            {product.name}
          </span>

        </nav>


        <div className="product-detail-grid">

          {/* =====================================
              IMAGE
          ===================================== */}

          <div className="product-detail-image-col">

            <ProductImageGallery
              mainImage={product.image}
              galleryImages={product.galleryImages}
              galleryVideos={product.galleryVideos}
              productName={product.name}
              badge={product.badge}
            />

          </div>


          {/* =====================================
              PRODUCT INFO
          ===================================== */}

          <div className="product-detail-info-col">

            <span className="product-detail-eyebrow">

              {
                product.category
              }

              {
                product.eyebrow
                  ? ` • ${product.eyebrow}`
                  : ''
              }

            </span>


            <h1 className="product-detail-title">
              {product.name}
            </h1>


            <div className="product-detail-rating">

              <span className="stars">
                ★★★★★
              </span>


              <strong>
                {
                  product.rating ||
                  4.8
                }
              </strong>


              <small>

                (
                {
                  product.reviewCount ||
                  28
                }
                {' '}
                reviews)

              </small>

            </div>


            <p className="product-detail-desc">
              {product.description}
            </p>


            {/* =================================
                SPECS
            ================================= */}

            <div className="product-detail-specs-box">

              {
                isMattress
                  ? (
                    <>
                      <div>
                        <strong>Firmness:</strong>{' '}
                        <span>
                          {product.firmness || 'Medium firm'}
                        </span>
                      </div>
                      <div>
                        <strong>Warranty:</strong>{' '}
                        <span>
                          {product.warranty || '10 years'}
                        </span>
                      </div>
                    </>
                  )
                  : (
                    <>
                      <div>
                        <strong>Material:</strong>{' '}
                        <span>
                          {product.material || 'Not specified'}
                        </span>
                      </div>
                      <div>
                        <strong>Type:</strong>{' '}
                        <span>
                          {
                            product.pillowType ||
                            product.protectorType ||
                            collectionLabel.slice(0, -1)
                          }
                        </span>
                      </div>
                      {
                        product.sku && (
                          <div>
                            <strong>SKU:</strong>{' '}
                            <span>{product.sku}</span>
                          </div>
                        )
                      }
                      <div>
                        <strong>Availability:</strong>{' '}
                        <span>
                          {
                            product.stock != null &&
                            Number(product.stock) <= 0
                              ? 'Out of stock'
                              : 'In stock'
                          }
                        </span>
                      </div>
                      {
                        isPillow && (
                          <div>
                            <strong>Sold as:</strong>{' '}
                            <span>
                              {packSize === 2 ? 'Pair of 2 pillows' : 'Single pillow'}
                            </span>
                          </div>
                        )
                      }
                    </>
                  )
              }

            </div>


            {/* =================================
                MATERIALS
            ================================= */}

            {
              materials.length > 0 && (

                <div className="product-detail-materials">

                  <strong>
                    Key Materials:
                  </strong>


                  <div className="materials-tags">

                    {
                      materials.map(
                        (material) => (

                          <span
                            key={material}
                            className="mat-tag"
                          >
                            {material}
                          </span>
                        ),
                      )
                    }

                  </div>

                </div>
              )
            }


            {
              isMattress && (
                <div className="mattress-configurator">
                  <fieldset className="product-size-selector">
                    <legend>Step 2: Choose your Size</legend>
                    <div className="product-size-options">
                      {availableSizeOptions.map((option) => (
                        <button
                          type="button"
                          key={option.id}
                          className={`${option.id === selectedSizeOption ? 'active' : ''} ${option.id === 'CUSTOM' ? 'custom-size-option' : ''}`.trim()}
                          onClick={() => setSelectedSizeOption(option.id)}
                          aria-pressed={option.id === selectedSizeOption}
                        >
                          <strong>{option.label}</strong>
                          {option.id === 'CUSTOM' && <small>{option.description}</small>}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <div className="mattress-config-grid">
                    <label className="mattress-config-field">
                      <span>Step 3: Unit of Measurement</span>
                      <select value="inches" disabled aria-label="Unit of measurement">
                        <option value="inches">Inches</option>
                      </select>
                    </label>

                    <label className="mattress-config-field">
                      <span>Step 4: Length &amp; Width</span>
                      {selectedSizeOption === 'CUSTOM' ? (
                        <div className="custom-dimension-inputs">
                          <input
                            type="number"
                            min="24"
                            max="120"
                            value={customLength}
                            onChange={(event) => setCustomLength(event.target.value)}
                            aria-label="Custom mattress length in inches"
                            placeholder="Length"
                          />
                          <span>×</span>
                          <input
                            type="number"
                            min="24"
                            max="120"
                            value={customWidth}
                            onChange={(event) => setCustomWidth(event.target.value)}
                            aria-label="Custom mattress width in inches"
                            placeholder="Width"
                          />
                        </div>
                      ) : (
                        <select
                          value={selectedDimension}
                          onChange={(event) => setSelectedDimension(event.target.value)}
                        >
                          {dimensionOptions.map((dimension) => {
                            const [length, width] = dimension.split('x');
                            return (
                              <option key={dimension} value={dimension}>
                                {length} inch × {width} inch
                              </option>
                            );
                          })}
                        </select>
                      )}
                      {selectedSizeOption === 'CUSTOM' && !customSizeIsValid && (
                        <small className="config-error" role="alert">
                          Enter dimensions between 24 and 120 inches.
                        </small>
                      )}
                    </label>

                    <label className="mattress-config-field">
                      <span>Step 5: Mattress Thickness</span>
                      <select
                        value={selectedThickness}
                        onChange={(event) => setSelectedThickness(event.target.value)}
                      >
                        {thicknessKeys.map((thickness) => (
                          <option key={thickness} value={thickness}>
                            {thickness} inch
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="mattress-config-field">
                      <span>Step 6: Quantity</span>
                      <div className="product-quantity-control">
                        <button
                          type="button"
                          onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                          disabled={quantity <= 1}
                          aria-label="Decrease quantity"
                        >−</button>
                        <output aria-live="polite">{quantity}</output>
                        <button
                          type="button"
                          onClick={() => setQuantity((value) => Math.min(10, value + 1))}
                          disabled={quantity >= 10}
                          aria-label="Increase quantity"
                        >+</button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }


            {
              isProtector && accessorySizes.length > 0 && (
                <label className="mattress-config-field accessory-size-selector">
                  <span>Choose a Size</span>
                  <select
                    value={selectedAccessorySize}
                    onChange={(event) => setSelectedAccessorySize(event.target.value)}
                  >
                    {accessorySizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>
              )
            }


            {
              !isMattress && (
                <div className="accessory-quantity-row">
                  <span>{isPillow ? 'Pack Quantity' : 'Quantity'}</span>
                  <div className="product-quantity-control">
                    <button
                      type="button"
                      onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                    >−</button>
                    <output aria-live="polite">{quantity}</output>
                    <button
                      type="button"
                      onClick={() => setQuantity((value) => Math.min(10, value + 1))}
                      disabled={quantity >= 10}
                      aria-label="Increase quantity"
                    >+</button>
                  </div>
                  {
                    isPillow && (
                      <small className="pillow-pack-summary">
                        {quantity} {quantity === 1 ? 'pack' : 'packs'} ={' '}
                        {quantity * packSize} {quantity * packSize === 1 ? 'pillow' : 'pillows'}
                      </small>
                    )
                  }
                </div>
              )
            }


            {/* =================================
                PRICE
            ================================= */}

            <div className="product-detail-price-row">

              <div>

                <small>
                  {
                    isMattress
                      ? quantity > 1
                        ? `Total Price (${quantity} mattresses)`
                        : 'Total Price'
                      : quantity > 1
                        ? `Total Price (${quantity} ${isPillow ? 'packs' : 'items'})`
                        : isPillow
                          ? `Price per ${packSize === 2 ? 'pair' : 'pillow'}`
                          : 'Price'
                  }
                </small>


                <strong className="price-val">
                  {
                    checkoutPrice != null &&
                    Number.isFinite(
                      Number(checkoutPrice),
                    )
                      ? `₹${Number(
                          checkoutPrice,
                        ).toLocaleString(
                          'en-IN',
                        )}`
                      : 'Price on request'
                  }

                </strong>


                {
                  checkoutOriginalPrice != null &&
                  Number(checkoutOriginalPrice) >
                    Number(checkoutPrice) && (
                    <del className="original-price">
                      ₹{Number(
                        checkoutOriginalPrice,
                      ).toLocaleString(
                        'en-IN',
                      )}
                    </del>
                  )
                }


                {
                  discountPercent > 0 && (
                    <span className="discount-tag">
                      ({discountPercent}% OFF)
                    </span>
                  )
                }

              </div>


              {
                checkoutPrice != null && (
                  <span className="tax-inclusive-text">
                    (Incl. of all taxes)
                  </span>
                )
              }

            </div>


            {/* =================================
                ACTIONS
            ================================= */}

            <div className="product-detail-actions">

              <button
                type="button"
                className="button button-primary quickview-add-btn"
                onClick={
                  () =>
                    addToCart({
                      ...product,
                      size: isMattress
                        ? selectedSize
                        : selectedAccessorySize,
                      thickness: isMattress
                        ? selectedThickness
                        : '',
                      price: displayPrice,
                      quantity,
                      packSize,
                    })
                }
                disabled={
                  isOutOfStock ||
                  !hasPurchasablePrice ||
                  (
                    isMattress &&
                    selectedSizeOption === 'CUSTOM' &&
                    !customSizeIsValid
                  )
                }
              >
                {isOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}
              </button>


              <a
                href={`#${collectionHash}`}
                className="back-to-mattresses"
              >
                ← Back to {collectionLabel}
              </a>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
