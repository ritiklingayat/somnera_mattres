import {
  useEffect,
  useMemo,
  useState,
} from 'react';


function uniqueMedia(
  mainImage,
  galleryImages,
  galleryVideos,
) {
  const media = [
    { type: 'image', url: mainImage },
    ...(Array.isArray(galleryImages)
      ? galleryImages.map((url) => ({ type: 'image', url }))
      : []),
    ...(Array.isArray(galleryVideos)
      ? galleryVideos.map((url) => ({ type: 'video', url }))
      : []),
  ];

  return media.filter(
    (item, index, allMedia) =>
      typeof item.url === 'string' &&
      item.url.trim() &&
      allMedia.findIndex((candidate) => candidate.url === item.url) === index,
  );
}


export function ProductImageGallery({
  mainImage,
  galleryImages = [],
  galleryVideos = [],
  productName = 'Product',
  badge = '',
}) {

  const media =
    useMemo(
      () =>
        uniqueMedia(
          mainImage,
          galleryImages,
          galleryVideos,
        ),
      [mainImage, galleryImages, galleryVideos],
    );


  const [activeIndex, setActiveIndex] =
    useState(0);


  const [mediaFailed, setMediaFailed] =
    useState(false);


  useEffect(() => {
    setActiveIndex(0);
    setMediaFailed(false);
  }, [media]);


  const showPrevious = () => {

    setActiveIndex(
      (current) =>
        (current - 1 + media.length) %
        media.length,
    );

    setMediaFailed(false);
  };


  const showNext = () => {

    setActiveIndex(
      (current) =>
        (current + 1) % media.length,
    );

    setMediaFailed(false);
  };


  const selectMedia =
    (index) => {
      setActiveIndex(index);
      setMediaFailed(false);
    };


  const activeMedia =
    media[activeIndex];


  return (

    <div className="product-image-gallery">

      <div className="product-detail-image-wrap">

        {
          activeMedia && !mediaFailed
            ? activeMedia.type === 'video'
              ? (
                <video
                  key={activeMedia.url}
                  src={activeMedia.url}
                  controls
                  playsInline
                  preload="metadata"
                  aria-label={`${productName} video ${activeIndex + 1}`}
                  onError={() => setMediaFailed(true)}
                >
                  Your browser does not support product videos.
                </video>
              )
              : (
                <img
                  key={activeMedia.url}
                  src={activeMedia.url}
                  alt={`${productName} view ${activeIndex + 1}`}
                  onError={() => setMediaFailed(true)}
                />
              )
            : (

              <div
                className="product-gallery-empty"
                role="img"
                aria-label="Product media unavailable"
              >
                <span aria-hidden="true">◇</span>
                <strong>Media unavailable</strong>
              </div>
            )
        }


        {
          badge && (

            <span className="product-detail-badge">
              {badge}
            </span>
          )
        }


        {
          media.length > 1 && (

            <>

              <button
                type="button"
                className="product-gallery-arrow previous"
                onClick={showPrevious}
                aria-label="Show previous product media"
              >
                ‹
              </button>


              <button
                type="button"
                className="product-gallery-arrow next"
                onClick={showNext}
                aria-label="Show next product media"
              >
                ›
              </button>

            </>
          )
        }

      </div>


      {
        media.length > 1 && (

          <div
            className="product-gallery-thumbnails"
            aria-label="Product images and videos"
          >

            {
              media.map(
                (item, index) => (

                  <button
                    type="button"
                    key={item.url}
                    className={
                      index === activeIndex
                        ? 'active'
                        : ''
                    }
                    onClick={
                      () => selectMedia(index)
                    }
                    aria-label={`Show product ${item.type} ${index + 1}`}
                    aria-pressed={index === activeIndex}
                  >

                    {
                      item.type === 'video'
                        ? (
                          <>
                            <video src={item.url} muted preload="metadata" />
                            <span className="product-video-thumbnail-icon" aria-hidden="true">▶</span>
                          </>
                        )
                        : (
                          <img
                            src={item.url}
                            alt=""
                            onError={(event) => {
                              event.currentTarget.style.display = 'none';
                            }}
                          />
                        )
                    }

                  </button>
                ),
              )
            }

          </div>
        )
      }

    </div>
  );
}
