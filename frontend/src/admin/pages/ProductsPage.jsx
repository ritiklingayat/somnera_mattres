import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import AdminModal
  from '../components/AdminModal';

import LoadingSpinner
  from '../../components/LoadingSpinner/LoadingSpinner';

import {
  PRODUCT_SECTION_OPTIONS,
  MATTRESS_NEED_OPTIONS,
  MATTRESS_USER_OPTIONS,
  MATTRESS_TECH_OPTIONS,
  MATTRESS_FEEL_OPTIONS,
  PRODUCT_SECTION_LABELS,
  PILLOW_MATERIAL_OPTIONS,
  PILLOW_TYPE_OPTIONS,
  PROTECTOR_SIZE_OPTIONS,
  MATTRESS_SIZE_OPTIONS,
} from '../../config/productSections';

import {
  addAdminProductApi,
  deleteAdminProductApi,
  getAdminProductsApi,
  updateAdminProductApi,
} from '../services/adminProductService';

import {
  getAdminCategoriesApi,
} from '../services/adminCategoryService';


const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
];
const ACCEPTED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
];
const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const MAX_GALLERY_IMAGES = 12;
const MAX_GALLERY_VIDEOS = 4;
const MAX_VIDEO_DURATION_SECONDS = 120;


function fileSignature(file) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}


function containsDuplicateFiles(selectedFiles, queuedFiles) {
  const signatures = new Set(
    queuedFiles.map((item) => fileSignature(item.file)),
  );

  return selectedFiles.some((file) => {
    const signature = fileSignature(file);
    if (signatures.has(signature)) return true;
    signatures.add(signature);
    return false;
  });
}


async function validateImageFile(file) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`${file.name}: use JPG, PNG, MP4, WebP, or AVIF.`);
  }

  if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
    throw new Error(`${file.name}: image must be smaller than 20 MB.`);
  }

  try {
    const bitmap = await createImageBitmap(file);
    const isReadable = bitmap.width > 0 && bitmap.height > 0;
    bitmap.close();
    if (!isReadable) throw new Error('Invalid dimensions.');
  } catch {
    throw new Error(`${file.name}: the image is damaged or unreadable.`);
  }
}


async function compressImageIfNeeded(file, maxBytes = 9.5 * 1024 * 1024) {
  if (!file || file.size <= maxBytes) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Max dimension 3840px (keeps ultra-sharp high resolution while reducing byte weight)
      const maxDim = 3840;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      const targetType = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
      const ext = targetType === 'image/webp' ? 'webp' : 'jpg';

      const attempt = (quality) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            if (blob.size > maxBytes && quality > 0.4) {
              attempt(Math.round((quality - 0.1) * 10) / 10);
            } else {
              const baseName = file.name.replace(/\.[^/.]+$/, '');
              const compressedFile = new File([blob], `${baseName}.${ext}`, {
                type: targetType,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            }
          },
          targetType,
          quality,
        );
      };

      attempt(0.88);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}


function validateVideoFile(file) {
  if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
    return Promise.reject(
      new Error(`${file.name}: use MP4, WebM, or OGG video.`),
    );
  }

  if (file.size <= 0 || file.size > MAX_VIDEO_SIZE) {
    return Promise.reject(
      new Error(`${file.name}: video must be smaller than 100 MB.`),
    );
  }

  return new Promise((resolve, reject) => {
    const previewUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    const timeoutId = window.setTimeout(() => {
      URL.revokeObjectURL(previewUrl);
      video.removeAttribute('src');
      reject(new Error(`${file.name}: video metadata could not be read.`));
    }, 10000);
    const cleanup = () => {
      window.clearTimeout(timeoutId);
      URL.revokeObjectURL(previewUrl);
    };

    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const duration = Number(video.duration);
      const validDimensions = video.videoWidth > 0 && video.videoHeight > 0;
      cleanup();

      if (!validDimensions || !Number.isFinite(duration) || duration <= 0) {
        reject(new Error(`${file.name}: the video is damaged or unreadable.`));
      } else if (duration > MAX_VIDEO_DURATION_SECONDS) {
        reject(new Error(`${file.name}: video must be 2 minutes or shorter.`));
      } else {
        resolve();
      }
    };
    video.onerror = () => {
      cleanup();
      reject(new Error(`${file.name}: the video is damaged or unsupported.`));
    };
    video.src = previewUrl;
  });
}


/*
==================================================
CHECKBOX GROUP
==================================================
*/

function CheckboxGroup({
  options,
  selected = [],
  onChange,
}) {

  const toggle =
    (value) => {

      const next =
        selected.includes(
          value,
        )
          ? selected.filter(
              (item) =>
                item !== value,
            )
          : [
              ...selected,
              value,
            ];


      onChange(next);
    };


  return (

    <div
      style={{
        marginBottom: 4,
      }}
    >

      {
        options.map(
          (option) => (

            <label
              key={option}
              style={{
                display:
                  'inline-flex',
                alignItems:
                  'center',
                gap: 5,
                marginRight:
                  12,
                marginBottom:
                  6,
                fontWeight:
                  400,
                fontSize:
                  '0.8rem',
                textTransform:
                  'none',
                letterSpacing:
                  'normal',
                cursor:
                  'pointer',
              }}
            >

              <input
                type="checkbox"
                checked={
                  selected.includes(
                    option,
                  )
                }
                onChange={
                  () =>
                    toggle(
                      option,
                    )
                }
                style={{
                  width: 'auto',
                }}
              />

              {option}

            </label>
          ),
        )
      }

    </div>
  );
}


/*
==================================================
EMPTY PRODUCT
==================================================
*/

const emptyProduct = {

  name: '',

  productSection:
    'MATTRESS',

  categoryId: '',

  subCategoryId: '',

  category: '',

  subcategory: '',

  eyebrow:
    'Premium collection',

  description: '',

  shortDescription: '',

  brand: 'Somnera',

  material: '',

  pillowType: '',

  packSize: 1,

  protectorType: '',

  sku: '',

  mrp: '',

  sellingPrice: '',

  offerPrice: '',

  stock: '',

  isActive: true,

  isFeatured: false,

  showOnHomepage: false,

  availableSizes: [],

  warranty:
    '10 years',

  firmness:
    'Medium firm',

  materials: '',

  needs: [],

  userTypes: [],

  tech: [],

  feels: [],

  price4: '',

  price5: '',

  price6: '',

  price8: '',

  badge:
    'New arrival',

  image: '',

  galleryImages: [],

  galleryVideos: [],
};


const PRODUCT_LIST_FILTERS = [
  {
    value: 'ALL',
    label: 'All Products',
  },
  {
    value: 'MATTRESS',
    label: 'Mattresses',
  },
  {
    value: 'PILLOW',
    label: 'Pillows',
  },
  {
    value: 'PROTECTOR',
    label: 'Protectors',
  },
];


function getProductListType(product) {
  if (product?.productSection === 'PILLOWS_ACCESSORIES') {
    const searchable = [
      product.protectorType,
      product.category,
      product.subcategory,
      product.name,
    ].join(' ').toLowerCase();

    return searchable.includes('protector')
      ? 'PROTECTOR'
      : 'PILLOW';
  }

  if (
    [
      'MATTRESS',
      'PILLOW',
      'PROTECTOR',
    ].includes(product?.productType)
  ) {
    return product.productType;
  }

  if (
    product?.productSection === 'MATTRESS' ||
    product?.productSection === 'MATTRESSES'
  ) {
    return 'MATTRESS';
  }

  if (product?.productSection === 'PROTECTOR') {
    return 'PROTECTOR';
  }

  if (product?.productSection === 'PILLOW') {
    return 'PILLOW';
  }

  return '';
}


/*
==================================================
PRODUCT → FORM MODEL
==================================================
*/

function toFormProduct(
  product,
  categories,
) {

  if (!product) {

    const firstCategory =
      categories[0];


    const firstSub =
      firstCategory
        ?.subCategories?.[0];


    return {

      ...emptyProduct,

      categoryId:
        firstCategory?.id ||
        '',

      subCategoryId:
        firstSub?.id ||
        '',

      category:
        firstCategory?.name ||
        '',

      subcategory:
        firstSub?.subCategoryName ||
        firstCategory
          ?.subcategories?.[0] ||
        '',
    };
  }


  const normalizedProductSection =
    getProductListType(product) ||
    product.productSection ||
    'MATTRESS';


  const matchedCategory =
    categories.find(
      (category) =>
        String(category.id) === String(product.categoryId),
    ) ||
    categories.find(
      (category) =>
        String(category.name).toLowerCase() ===
        String(product.category || product.categoryName || '').toLowerCase(),
    );


  const matchedSubCategory =
    matchedCategory?.subCategories?.find(
      (subCategory) =>
        String(subCategory.id) === String(product.subCategoryId),
    ) ||
    matchedCategory?.subCategories?.find(
      (subCategory) =>
        String(subCategory.name).toLowerCase() ===
        String(product.subcategory || product.subCategoryName || '').toLowerCase(),
    );


  return {

    ...emptyProduct,

    ...product,

    productSection:
      normalizedProductSection,

    categoryId:
      product.categoryId ||
      matchedCategory?.id ||
      '',

    subCategoryId:
      product.subCategoryId ||
      matchedSubCategory?.id ||
      '',

    category:
      product.category ||
      matchedCategory?.name ||
      '',

    subcategory:
      product.subcategory ||
      matchedSubCategory?.name ||
      '',

    materials:
      Array.isArray(
        product.materials,
      )
        ? product.materials.join(
            ', ',
          )
        : product.materials ||
          '',

    needs:
      Array.isArray(
        product.needs,
      )
        ? product.needs
        : [],

    userTypes:
      Array.isArray(
        product.userTypes,
      )
        ? product.userTypes
        : [],

    tech:
      Array.isArray(
        product.tech,
      )
        ? product.tech
        : [],

    feels:
      Array.isArray(
        product.feels,
      )
        ? product.feels
        : [],

    price4:
      product.prices?.[4] ??
      product.price4Inch ??
      '',

    price5:
      product.prices?.[5] ??
      product.price5Inch ??
      '',

    price6:
      product.prices?.[6] ??
      product.price6Inch ??
      '',

    price8:
      product.prices?.[8] ??
      product.price8Inch ??
      '',

    shortDescription:
      product.shortDescription ||
      '',

    sellingPrice:
      product.sellingPrice ??
      product.price ??
      '',

    offerPrice:
      product.offerPrice ??
      '',

    stock:
      product.stock ??
      product.stockQuantity ??
      '',

    isActive:
      product.isActive !== false,

    isFeatured:
      product.isFeatured === true,

    showOnHomepage:
      product.showOnHomepage === true,

    availableSizes:
      Array.isArray(
        product.availableSizes,
      )
        ? product.availableSizes
        : [],

    packSize:
      Number(product.packSize) === 2
        ? 2
        : 1,

    galleryVideos:
      Array.isArray(product.galleryVideos)
        ? product.galleryVideos
        : [],
  };
}


/*
==================================================
PRODUCT FORM
==================================================
*/

function ProductForm({
  product,
  categories,
  onSave,
  onClose,
}) {

  const [
    draft,
    setDraft,
  ] = useState(
    () =>
      toFormProduct(
        product,
        categories,
      ),
  );


  const [
    imageFile,
    setImageFile,
  ] = useState(null);


  const [
    imagePreview,
    setImagePreview,
  ] = useState(
    product?.image ||
    '',
  );


  const [
    galleryFiles,
    setGalleryFiles,
  ] = useState([]);


  const [
    galleryVideoFiles,
    setGalleryVideoFiles,
  ] = useState([]);


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    saveError,
    setSaveError,
  ] = useState('');


  useEffect(() => {

    setDraft(
      toFormProduct(
        product,
        categories,
      ),
    );


    setImageFile(null);


    setImagePreview(
      product?.image ||
      '',
    );


    setGalleryFiles((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.preview));
      return [];
    });


    setGalleryVideoFiles((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.preview));
      return [];
    });

  }, [
    product,
    categories,
  ]);


  const isMattress =
    draft.productSection ===
    'MATTRESS';


  const isPillow =
    draft.productSection ===
      'PILLOW' ||
    draft.productSection ===
      'PILLOWS_ACCESSORIES';


  const isProtector =
    draft.productSection ===
    'PROTECTOR';


  const selectedCategory =
    useMemo(
      () =>
        categories.find(
          (category) =>
            String(
              category.id,
            ) ===
            String(
              draft.categoryId,
            ),
        ),
      [
        categories,
        draft.categoryId,
      ],
    );


  const subCategories =
    selectedCategory
      ?.subCategories ||
    [];


  /*
  ==================================================
  GENERIC FIELD CHANGE
  ==================================================
  */

  const setValue =
    (event) => {

      const {
        name,
        value,
      } =
        event.target;


      setDraft(
        (current) => ({
          ...current,
          [name]: value,
        }),
      );
    };


  /*
  ==================================================
  ARRAY FIELD
  ==================================================
  */

  const setArrayValue =
    (
      field,
      value,
    ) => {

      setDraft(
        (current) => ({
          ...current,
          [field]: value,
        }),
      );
    };


  /*
  ==================================================
  CATEGORY
  ==================================================
  */

  const handleCategoryChange =
    (event) => {

      const categoryId =
        event.target.value;


      const category =
        categories.find(
          (item) =>
            String(item.id) ===
            String(categoryId),
        );


      const firstSub =
        category
          ?.subCategories?.[0];


      setDraft(
        (current) => ({
          ...current,

          categoryId,

          category:
            category?.name ||
            '',

          subCategoryId:
            firstSub?.id ||
            '',

          subcategory:
            firstSub
              ?.subCategoryName ||
            '',
        }),
      );
    };


  /*
  ==================================================
  SUB CATEGORY
  ==================================================
  */

  const handleSubcategoryChange =
    (event) => {

      const subCategoryId =
        event.target.value;


      const sub =
        subCategories.find(
          (item) =>
            String(item.id) ===
            String(
              subCategoryId,
            ),
        );


      setDraft(
        (current) => ({
          ...current,

          subCategoryId,

          subcategory:
            sub
              ?.subCategoryName ||
            '',
        }),
      );
    };


  /*
  ==================================================
  IMAGE
  ==================================================
  */

  const handleImageChange =
    async (event) => {

      const file =
        event.target.files?.[0];


      if (!file) {
        return;
      }


      try {
        await validateImageFile(file);
      } catch (error) {
        setSaveError(error.message);
        event.target.value = '';
        return;
      }


      if (imageFile && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }

      const processedFile = await compressImageIfNeeded(file);
      setImageFile(processedFile);

      const previewUrl =
        URL.createObjectURL(
          processedFile,
        );

      setImagePreview(
        previewUrl,
      );


      setSaveError('');
    };


  const handleGalleryChange =
    async (event) => {

      const selectedFiles =
        Array.from(
          event.target.files || [],
        );


      const totalImages =
        (draft.galleryImages || []).length +
        galleryFiles.length +
        selectedFiles.length;

      if (totalImages > MAX_GALLERY_IMAGES) {
        setSaveError(`A product can have up to ${MAX_GALLERY_IMAGES} gallery images.`);
        event.target.value = '';
        return;
      }


      if (containsDuplicateFiles(selectedFiles, galleryFiles)) {
        setSaveError('The same gallery image cannot be added more than once.');
        event.target.value = '';
        return;
      }


      try {
        for (const file of selectedFiles) {
          await validateImageFile(file);
        }
      } catch (error) {
        setSaveError(error.message);
        event.target.value = '';
        return;
      }


      const processedFiles = await Promise.all(
        selectedFiles.map((file) => compressImageIfNeeded(file)),
      );

      setGalleryFiles(
        (current) => [
          ...current,
          ...processedFiles.map(
            (file) => ({
              file,
              preview:
                URL.createObjectURL(
                  file,
                ),
            }),
          ),
        ],
      );


      setSaveError('');
      event.target.value = '';
    };


  const handleGalleryVideoChange =
    async (event) => {
      const selectedFiles = Array.from(event.target.files || []);
      const totalVideos =
        (draft.galleryVideos || []).length +
        galleryVideoFiles.length +
        selectedFiles.length;

      if (totalVideos > MAX_GALLERY_VIDEOS) {
        setSaveError(`A product can have up to ${MAX_GALLERY_VIDEOS} gallery videos.`);
        event.target.value = '';
        return;
      }

      if (containsDuplicateFiles(selectedFiles, galleryVideoFiles)) {
        setSaveError('The same gallery video cannot be added more than once.');
        event.target.value = '';
        return;
      }

      try {
        for (const file of selectedFiles) {
          await validateVideoFile(file);
        }
      } catch (error) {
        setSaveError(error.message);
        event.target.value = '';
        return;
      }

      setGalleryVideoFiles((current) => [
        ...current,
        ...selectedFiles.map((file) => ({
          file,
          preview: URL.createObjectURL(file),
        })),
      ]);
      setSaveError('');
      event.target.value = '';
    };


  const removeExistingGalleryImage =
    (index) => {

      setDraft(
        (current) => ({
          ...current,
          galleryImages:
            (current.galleryImages || [])
              .filter(
                (_, imageIndex) =>
                  imageIndex !== index,
              ),
        }),
      );
    };


  const removeNewGalleryImage =
    (index) => {

      setGalleryFiles(
        (current) => {

          const item =
            current[index];


          if (item?.preview) {
            URL.revokeObjectURL(
              item.preview,
            );
          }


          return current.filter(
            (_, imageIndex) =>
              imageIndex !== index,
          );
        },
      );
    };


  const moveExistingGalleryImage =
    (index, direction) => {

      setDraft(
        (current) => {

          const next = [
            ...(current.galleryImages || []),
          ];


          const targetIndex =
            index + direction;


          if (
            targetIndex < 0 ||
            targetIndex >= next.length
          ) {
            return current;
          }


          [next[index], next[targetIndex]] =
            [next[targetIndex], next[index]];


          return {
            ...current,
            galleryImages: next,
          };
        },
      );
    };


  const removeExistingGalleryVideo =
    (index) => {
      setDraft((current) => ({
        ...current,
        galleryVideos: (current.galleryVideos || []).filter(
          (_, videoIndex) => videoIndex !== index,
        ),
      }));
    };


  const removeNewGalleryVideo =
    (index) => {
      setGalleryVideoFiles((current) => {
        const item = current[index];
        if (item?.preview) URL.revokeObjectURL(item.preview);
        return current.filter((_, videoIndex) => videoIndex !== index);
      });
    };


  const moveExistingGalleryVideo =
    (index, direction) => {
      setDraft((current) => {
        const next = [...(current.galleryVideos || [])];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= next.length) return current;
        [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
        return { ...current, galleryVideos: next };
      });
    };


  /*
  ==================================================
  SUBMIT
  ==================================================
  */

  const handleSubmit =
    async (event) => {

      event.preventDefault();

      setSaveError('');


      if (
        !draft.name.trim()
      ) {

        setSaveError(
          'Product name is required.',
        );

        return;
      }


      if (
        !draft.categoryId
      ) {

        setSaveError(
          'Category is required.',
        );

        return;
      }


      if (
        !draft.subCategoryId
      ) {

        setSaveError(
          'Sub category is required.',
        );

        return;
      }


      if (
        !product &&
        !imageFile
      ) {

        setSaveError(
          'Product image is required.',
        );

        return;
      }


      try {

        setSaving(true);


        const finalImageFile = imageFile ? await compressImageIfNeeded(imageFile) : imageFile;
        const finalGalleryImages = await Promise.all(
          galleryFiles.map((item) => compressImageIfNeeded(item.file)),
        );

        await onSave(
          draft,
          finalImageFile,
          finalGalleryImages,
          galleryVideoFiles.map(
            (item) => item.file,
          ),
        );


      } catch (error) {

        setSaveError(
          error.message ||
          'Unable to save product.',
        );


      } finally {

        setSaving(false);
      }
    };


  /*
  ==================================================
  UI
  ==================================================
  */

  return (

    <form
      onSubmit={
        handleSubmit
      }
      className="admin-form-stack product-form"
    >

      <div className="product-form-section">

        <h3>
          Product Details
        </h3>


        <label>

          Product Name

          <input
            required
            name="name"
            value={
              draft.name
            }
            onChange={
              setValue
            }
            disabled={
              saving
            }
          />

        </label>


        <fieldset className="admin-product-type-picker">

          <legend>Product Type</legend>

          <div>
            {
              PRODUCT_SECTION_OPTIONS.map(
                (option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={
                      draft.productSection ===
                        option.value
                        ? 'active'
                        : ''
                    }
                    onClick={
                      () =>
                        setDraft(
                          (current) => ({
                            ...current,
                            productSection:
                              option.value,
                          }),
                        )
                    }
                    disabled={saving}
                    aria-pressed={
                      draft.productSection ===
                      option.value
                    }
                  >
                    <span aria-hidden="true">
                      {
                        option.value === 'MATTRESS'
                          ? '▰'
                          : option.value === 'PILLOW'
                            ? '◒'
                            : '◇'
                      }
                    </span>
                    {option.label}
                  </button>
                ),
              )
            }
          </div>

          {
            draft.productSection ===
              'PILLOWS_ACCESSORIES' && (
              <small>
                This is a legacy Pillow &amp; Accessories product. Choose Pillows or Protectors to migrate it safely.
              </small>
            )
          }

        </fieldset>


        <div className="form-two-columns">

          <label>
            Brand
            <input
              name="brand"
              value={draft.brand}
              onChange={setValue}
              placeholder="Somnera"
              disabled={saving}
            />
          </label>

          <label>
            SKU
            <input
              name="sku"
              value={draft.sku}
              onChange={setValue}
              placeholder="SOM-PIL-001"
              disabled={saving}
            />
          </label>

        </div>


        <div className="form-two-columns">

          <label>

            Category

            <select
              required
              value={
                draft.categoryId
              }
              onChange={
                handleCategoryChange
              }
              disabled={
                saving
              }
            >

              <option value="">
                Select category
              </option>


              {
                categories.map(
                  (category) => (

                    <option
                      key={
                        category.id
                      }
                      value={
                        category.id
                      }
                    >

                      {
                        category.name
                      }

                    </option>
                  ),
                )
              }

            </select>

          </label>


          <label>

            Sub Category

            <select
              required
              value={
                draft.subCategoryId
              }
              onChange={
                handleSubcategoryChange
              }
              disabled={
                saving ||
                !draft.categoryId
              }
            >

              <option value="">
                Select sub category
              </option>


              {
                subCategories.map(
                  (sub) => (

                    <option
                      key={
                        sub.id
                      }
                      value={
                        sub.id
                      }
                    >

                      {
                        sub.subCategoryName
                      }

                    </option>
                  ),
                )
              }

            </select>

          </label>

        </div>


        <div className="form-two-columns">

          <label>

            Badge

            <input
              name="badge"
              value={
                draft.badge
              }
              onChange={
                setValue
              }
              disabled={
                saving
              }
            />

          </label>


          <label>

            Warranty

            <input
              name="warranty"
              value={
                draft.warranty
              }
              onChange={
                setValue
              }
              placeholder="10 years"
              disabled={
                saving
              }
            />

          </label>

        </div>


        <label>

          Short Description

          <textarea
            name="shortDescription"
            rows="2"
            value={draft.shortDescription}
            onChange={setValue}
            placeholder="A concise product summary for cards."
            disabled={saving}
          />

        </label>


        <label>

          Full Description

          <textarea
            name="description"
            rows="4"
            value={draft.description}
            onChange={setValue}
            disabled={saving}
          />

        </label>


        {
          isMattress && (
            <label>

              Materials

              <small>
                Separate each with a comma
              </small>

              <input
                name="materials"
                value={draft.materials}
                onChange={setValue}
                placeholder="Natural Latex, HR foam, Knitted fabric"
                disabled={saving}
              />

            </label>
          )
        }


        <label>

          Main Product Image

          <input
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            onChange={
              handleImageChange
            }
            disabled={
              saving
            }
          />

          {
            product && (

              <small>
                Leave empty to keep the current main image.
              </small>
            )
          }

          <small>
            JPG, PNG, WebP, or AVIF. Maximum 20 MB.
          </small>

        </label>


        {
          imagePreview && (

            <div className="admin-main-image-preview">

              <img
                src={
                  imagePreview
                }
                alt="Product preview"
              />

            </div>
          )
        }


        <label>

          Product Gallery

          <input
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            multiple
            onChange={
              handleGalleryChange
            }
            disabled={
              saving
            }
          />

          <small>
            Up to 12 JPG, PNG, WebP, or AVIF images; maximum 20 MB each. Existing images stay unless removed.
          </small>

        </label>


        {
          (
            draft.galleryImages?.length > 0 ||
            galleryFiles.length > 0
          ) && (

            <div className="admin-gallery-preview-grid">

              {
                (draft.galleryImages || []).map(
                  (imageUrl, index) => (

                    <div
                      className="admin-gallery-preview"
                      key={imageUrl}
                    >

                      <img
                        src={imageUrl}
                        alt={`Saved gallery image ${index + 1}`}
                      />


                      <div className="admin-gallery-preview-actions">

                        <button
                          type="button"
                          onClick={
                            () =>
                              moveExistingGalleryImage(
                                index,
                                -1,
                              )
                          }
                          disabled={
                            saving || index === 0
                          }
                          aria-label="Move image left"
                        >
                          ←
                        </button>


                        <button
                          type="button"
                          onClick={
                            () =>
                              moveExistingGalleryImage(
                                index,
                                1,
                              )
                          }
                          disabled={
                            saving ||
                            index ===
                              draft.galleryImages.length - 1
                          }
                          aria-label="Move image right"
                        >
                          →
                        </button>


                        <button
                          type="button"
                          className="remove-gallery-image"
                          onClick={
                            () =>
                              removeExistingGalleryImage(
                                index,
                              )
                          }
                          disabled={saving}
                        >
                          Remove
                        </button>

                      </div>

                    </div>
                  ),
                )
              }


              {
                galleryFiles.map(
                  (item, index) => (

                    <div
                      className="admin-gallery-preview is-new"
                      key={item.preview}
                    >

                      <span>New</span>

                      <img
                        src={item.preview}
                        alt={`New gallery image ${index + 1}`}
                      />


                      <button
                        type="button"
                        className="remove-gallery-image"
                        onClick={
                          () =>
                            removeNewGalleryImage(
                              index,
                            )
                        }
                        disabled={saving}
                      >
                        Remove
                      </button>

                    </div>
                  ),
                )
              }

            </div>
          )
        }


        <label>

          Product Videos

          <input
            type="file"
            accept={ACCEPTED_VIDEO_TYPES.join(',')}
            multiple
            onChange={handleGalleryVideoChange}
            disabled={saving}
          />

          <small>
            Up to 4 MP4, WebM, or OGG videos; maximum 100 MB and 2 minutes each.
          </small>

        </label>


        {
          (
            draft.galleryVideos?.length > 0 ||
            galleryVideoFiles.length > 0
          ) && (
            <div className="admin-gallery-preview-grid admin-video-preview-grid">
              {(draft.galleryVideos || []).map((videoUrl, index) => (
                <div className="admin-gallery-preview" key={videoUrl}>
                  <video src={videoUrl} controls muted playsInline preload="metadata" />
                  <div className="admin-gallery-preview-actions">
                    <button
                      type="button"
                      onClick={() => moveExistingGalleryVideo(index, -1)}
                      disabled={saving || index === 0}
                      aria-label="Move video left"
                    >←</button>
                    <button
                      type="button"
                      onClick={() => moveExistingGalleryVideo(index, 1)}
                      disabled={saving || index === draft.galleryVideos.length - 1}
                      aria-label="Move video right"
                    >→</button>
                    <button
                      type="button"
                      className="remove-gallery-image"
                      onClick={() => removeExistingGalleryVideo(index)}
                      disabled={saving}
                    >Remove</button>
                  </div>
                </div>
              ))}

              {galleryVideoFiles.map((item, index) => (
                <div className="admin-gallery-preview is-new" key={item.preview}>
                  <span>New video</span>
                  <video src={item.preview} controls muted playsInline preload="metadata" />
                  <button
                    type="button"
                    className="remove-gallery-image"
                    onClick={() => removeNewGalleryVideo(index)}
                    disabled={saving}
                  >Remove</button>
                </div>
              ))}
            </div>
          )
        }

      </div>


      {
        (isPillow || isProtector) && (

          <div className="product-form-section">

            <h3>
              {
                isPillow
                  ? 'Pillow Details'
                  : 'Protector Details'
              }
            </h3>


            <div className="form-two-columns">

              <label>
                Material
                {
                  isPillow
                    ? (
                      <select
                        value={
                          PILLOW_MATERIAL_OPTIONS.includes(
                            draft.material,
                          )
                            ? draft.material
                            : draft.material
                              ? 'Other'
                              : ''
                        }
                        onChange={
                          (event) =>
                            setDraft(
                              (current) => ({
                                ...current,
                                material:
                                  event.target.value,
                              }),
                            )
                        }
                        disabled={saving}
                      >
                        <option value="">Select material</option>
                        {
                          PILLOW_MATERIAL_OPTIONS.map(
                            (option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ),
                          )
                        }
                      </select>
                    )
                    : (
                      <input
                        name="material"
                        value={draft.material}
                        onChange={setValue}
                        placeholder="Terry Cotton"
                        disabled={saving}
                      />
                    )
                }
              </label>


              <label>
                {
                  isPillow
                    ? 'Pillow Type'
                    : 'Protector Type'
                }
                {
                  isPillow
                    ? (
                      <select
                        value={
                          PILLOW_TYPE_OPTIONS.includes(
                            draft.pillowType,
                          )
                            ? draft.pillowType
                            : draft.pillowType
                              ? 'Other'
                              : ''
                        }
                        onChange={
                          (event) =>
                            setDraft(
                              (current) => ({
                                ...current,
                                pillowType:
                                  event.target.value,
                              }),
                            )
                        }
                        disabled={saving}
                      >
                        <option value="">Select pillow type</option>
                        {
                          PILLOW_TYPE_OPTIONS.map(
                            (option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ),
                          )
                        }
                      </select>
                    )
                    : (
                      <input
                        name="protectorType"
                        value={draft.protectorType}
                        onChange={setValue}
                        placeholder="Waterproof Mattress Protector"
                        disabled={saving}
                      />
                    )
                }
              </label>

            </div>


            {
              isPillow &&
              (
                draft.material === 'Other' ||
                (
                  draft.material &&
                  !PILLOW_MATERIAL_OPTIONS.includes(
                    draft.material,
                  )
                )
              ) && (
                <label>
                  Custom Material
                  <input
                    name="material"
                    value={
                      draft.material === 'Other'
                        ? ''
                        : draft.material
                    }
                    onChange={setValue}
                    placeholder="Enter material"
                    disabled={saving}
                  />
                </label>
              )
            }


            {
              isPillow && (
                <label>
                  Selling Unit
                  <select
                    name="packSize"
                    value={draft.packSize}
                    onChange={setValue}
                    disabled={saving}
                  >
                    <option value="1">Single pillow (1 piece per pack)</option>
                    <option value="2">Pair of pillows (2 pieces per pack)</option>
                  </select>
                  <small>
                    The selling price and stock below apply to one complete pack.
                  </small>
                </label>
              )
            }


            {
              isPillow &&
              (
                draft.pillowType === 'Other' ||
                (
                  draft.pillowType &&
                  !PILLOW_TYPE_OPTIONS.includes(
                    draft.pillowType,
                  )
                )
              ) && (
                <label>
                  Custom Pillow Type
                  <input
                    name="pillowType"
                    value={
                      draft.pillowType === 'Other'
                        ? ''
                        : draft.pillowType
                    }
                    onChange={setValue}
                    placeholder="Enter pillow type"
                    disabled={saving}
                  />
                </label>
              )
            }


            {
              isProtector && (
                <label className="admin-checkbox-fieldset">
                  Available Sizes
                  <CheckboxGroup
                    options={PROTECTOR_SIZE_OPTIONS}
                    selected={draft.availableSizes}
                    onChange={
                      (value) =>
                        setArrayValue(
                          'availableSizes',
                          value,
                        )
                    }
                  />
                </label>
              )
            }

          </div>
        )
      }


      {
        (isPillow || isProtector) && (

          <div className="product-form-section">

            <h3>Pricing, Stock &amp; Visibility</h3>

            <div className="form-four-columns">
              <label>
                {isPillow ? 'MRP per pack (₹)' : 'MRP (₹)'}
                <input
                  name="mrp"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.mrp}
                  onChange={setValue}
                  disabled={saving}
                />
              </label>

              <label>
                {isPillow ? 'Selling Price per pack (₹)' : 'Selling Price (₹)'}
                <input
                  name="sellingPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.sellingPrice}
                  onChange={setValue}
                  placeholder="Optional"
                  disabled={saving}
                />
              </label>

              <label>
                {isPillow ? 'Offer Price per pack (₹)' : 'Offer Price (₹)'}
                <input
                  name="offerPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.offerPrice}
                  onChange={setValue}
                  disabled={saving}
                />
              </label>

              <label>
                {isPillow ? 'Stock Quantity (packs)' : 'Stock Quantity'}
                <input
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={draft.stock}
                  onChange={setValue}
                  disabled={saving}
                />
              </label>
            </div>


            <div className="admin-product-flags">
              {
                [
                  ['isActive', 'Active product'],
                  ['isFeatured', 'Featured product'],
                  ['showOnHomepage', 'Show on homepage'],
                ].map(
                  ([field, label]) => (
                    <label key={field}>
                      <input
                        type="checkbox"
                        checked={draft[field] === true}
                        onChange={
                          (event) =>
                            setDraft(
                              (current) => ({
                                ...current,
                                [field]:
                                  event.target.checked,
                              }),
                            )
                        }
                        disabled={saving}
                      />
                      {label}
                    </label>
                  ),
                )
              }
            </div>

          </div>
        )
      }


      {
        isMattress && (

          <>

            <div className="product-form-section">

              <h3>
                Mattress Attributes
              </h3>


              <label
                style={{
                  display: 'grid',
                  gap: 6,
                }}
              >
                Available Mattress Sizes
                <CheckboxGroup
                  options={MATTRESS_SIZE_OPTIONS}
                  selected={draft.availableSizes}
                  onChange={
                    (value) =>
                      setArrayValue(
                        'availableSizes',
                        value,
                      )
                  }
                />
                <small>
                  Leave every option unchecked to offer all standard sizes.
                </small>
              </label>


              <label
                style={{
                  display:
                    'grid',
                  gap: 6,
                }}
              >

                Shop by Need

                <CheckboxGroup
                  options={
                    MATTRESS_NEED_OPTIONS
                  }
                  selected={
                    draft.needs
                  }
                  onChange={
                    (value) =>
                      setArrayValue(
                        'needs',
                        value,
                      )
                  }
                />

              </label>


              <label
                style={{
                  display:
                    'grid',
                  gap: 6,
                }}
              >

                Shop by User

                <CheckboxGroup
                  options={
                    MATTRESS_USER_OPTIONS
                  }
                  selected={
                    draft.userTypes
                  }
                  onChange={
                    (value) =>
                      setArrayValue(
                        'userTypes',
                        value,
                      )
                  }
                />

              </label>


              <label
                style={{
                  display:
                    'grid',
                  gap: 6,
                }}
              >

                Shop by Tech

                <CheckboxGroup
                  options={
                    MATTRESS_TECH_OPTIONS
                  }
                  selected={
                    draft.tech
                  }
                  onChange={
                    (value) =>
                      setArrayValue(
                        'tech',
                        value,
                      )
                  }
                />

              </label>


              <label
                style={{
                  display:
                    'grid',
                  gap: 6,
                }}
              >

                Mattress Feel

                <CheckboxGroup
                  options={
                    MATTRESS_FEEL_OPTIONS
                  }
                  selected={
                    draft.feels
                  }
                  onChange={
                    (value) =>
                      setArrayValue(
                        'feels',
                        value,
                      )
                  }
                />

              </label>


              <label>

                Firmness

                <input
                  name="firmness"
                  value={
                    draft.firmness
                  }
                  onChange={
                    setValue
                  }
                  disabled={
                    saving
                  }
                />

              </label>

            </div>


            <div className="product-form-section">

              <h3>
                Pricing by thickness
              </h3>


              <small>
                Rate per square foot (₹)
              </small>


              <div className="form-four-columns">

                {
                  [
                    4,
                    5,
                    6,
                    8,
                  ].map(
                    (size) => (

                      <label
                        key={
                          size
                        }
                      >

                        {size} inch

                        <input
                          name={
                            `price${size}`
                          }
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            draft[
                              `price${size}`
                            ]
                          }
                          onChange={
                            setValue
                          }
                          disabled={
                            saving
                          }
                        />

                      </label>
                    ),
                  )
                }

              </div>

            </div>

          </>
        )
      }


      {
        saveError && (

          <p
            className="account-form-error"
            role="alert"
          >

            {
              saveError
            }

          </p>
        )
      }


      <div className="product-form-actions">

        <button
          type="button"
          onClick={
            onClose
          }
          disabled={
            saving
          }
        >
          Cancel
        </button>


        <button
          type="submit"
          className="admin-action"
          disabled={
            saving
          }
        >

          {
            saving
              ? (
                <LoadingSpinner
                  label={
                    product
                      ? 'Updating Product...'
                      : 'Adding Product...'
                  }
                  inline
                />
              )
              : 'Save product'
          }

        </button>

      </div>

    </form>
  );
}


/*
==================================================
PRODUCTS PAGE
==================================================
*/

export default function ProductsPage() {

  const [
    products,
    setProducts,
  ] = useState([]);


  const [
    categories,
    setCategories,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    pageError,
    setPageError,
  ] = useState('');


  const [
    deletingId,
    setDeletingId,
  ] = useState(null);


  const [
    editingProduct,
    setEditingProduct,
  ] = useState(null);


  const [
    isOpen,
    setIsOpen,
  ] = useState(false);


  const [
    productListFilter,
    setProductListFilter,
  ] = useState('ALL');


  const productTypeCounts =
    useMemo(
      () =>
        products.reduce(
          (counts, product) => {
            const type =
              getProductListType(product);

            counts.ALL += 1;

            if (type && counts[type] !== undefined) {
              counts[type] += 1;
            }

            return counts;
          },
          {
            ALL: 0,
            MATTRESS: 0,
            PILLOW: 0,
            PROTECTOR: 0,
          },
        ),
      [products],
    );


  const visibleProducts =
    useMemo(
      () =>
        productListFilter === 'ALL'
          ? products
          : products.filter(
              (product) =>
                getProductListType(product) ===
                productListFilter,
            ),
      [products, productListFilter],
    );


  /*
  ==================================================
  LOAD DATA
  ==================================================
  */

  const loadData =
    async () => {

      try {

        setLoading(true);

        setPageError('');


        const [
          productsData,
          categoriesData,
        ] =
          await Promise.all([
            getAdminProductsApi(),
            getAdminCategoriesApi(),
          ]);


        setProducts(
          productsData,
        );


        setCategories(
          categoriesData,
        );


      } catch (error) {

        setPageError(
          error.message ||
          'Unable to load products.',
        );


      } finally {

        setLoading(false);
      }
    };


  useEffect(() => {

    loadData();

  }, []);


  /*
  ==================================================
  MODAL
  ==================================================
  */

  const close =
    () => {

      setIsOpen(false);

      setEditingProduct(
        null,
      );
    };


  /*
  ==================================================
  SAVE PRODUCT
  ==================================================
  */

  const handleSave =
    async (
      draft,
      imageFile,
      galleryFiles,
      galleryVideoFiles,
    ) => {

      if (
        editingProduct
      ) {

        const updated =
          await updateAdminProductApi(
            editingProduct.id,
            draft,
            imageFile,
            galleryFiles,
            galleryVideoFiles,
          );


        setProducts(
          (current) =>
            current.map(
              (product) =>
                product.id ===
                updated.id
                  ? updated
                  : product,
            ),
        );


      } else {

        const created =
          await addAdminProductApi(
          draft,
          imageFile,
          galleryFiles,
          galleryVideoFiles,
          );


        setProducts(
          (current) => [
            ...current,
            created,
          ],
        );
      }


      close();
    };


  /*
  ==================================================
  DELETE PRODUCT
  ==================================================
  */

  const handleDelete =
    async (
      productId,
    ) => {

      const confirmed =
        window.confirm(
          'Are you sure you want to delete this product?',
        );


      if (!confirmed) {
        return;
      }


      try {

        setDeletingId(
          productId,
        );

        setPageError('');


        await deleteAdminProductApi(
          productId,
        );


        setProducts(
          (current) =>
            current.filter(
              (product) =>
                product.id !==
                productId,
            ),
        );


      } catch (error) {

        setPageError(
          error.message ||
          'Unable to delete product.',
        );


      } finally {

        setDeletingId(null);
      }
    };


  /*
  ==================================================
  UI
  ==================================================
  */

  return (

    <>

      <div className="admin-title">

        <div>

          <p>
            Catalog
          </p>

          <h1>
            Products
          </h1>

        </div>


        <button
          className="admin-action"
          onClick={
            () =>
              setIsOpen(true)
          }
        >
          + Add product
        </button>

      </div>


      <section className="admin-card product-admin">

        {
          pageError && (

            <p
              className="account-form-error"
              role="alert"
            >
              {
                pageError
              }
            </p>
          )
        }


        {
          !loading &&
          products.length > 0 && (

            <div
              className="admin-product-filter-bar"
              role="group"
              aria-label="Filter products by type"
            >

              {
                PRODUCT_LIST_FILTERS.map(
                  (filter) => (

                    <button
                      type="button"
                      key={filter.value}
                      className={
                        productListFilter === filter.value
                          ? 'active'
                          : ''
                      }
                      aria-pressed={
                        productListFilter === filter.value
                      }
                      onClick={
                        () =>
                          setProductListFilter(
                            filter.value,
                          )
                      }
                    >

                      <span>{filter.label}</span>

                      <strong>
                        {
                          productTypeCounts[
                            filter.value
                          ]
                        }
                      </strong>

                    </button>
                  ),
                )
              }

            </div>
          )
        }


        {
          loading
            ? (

              <div
                style={{
                  padding:
                    '40px',
                  textAlign:
                    'center',
                }}
              >

                <LoadingSpinner
                  label="Loading Products..."
                />

              </div>
            )

            : products.length ===
              0
              ? (

                <div className="module-empty">

                  <h2>
                    No products found
                  </h2>

                  <p>
                    Add your first product.
                  </p>

                </div>
              )

              : visibleProducts.length ===
                0
                ? (

                  <div className="module-empty admin-filter-empty">

                    <h2>
                      No {
                        PRODUCT_LIST_FILTERS.find(
                          (filter) =>
                            filter.value ===
                            productListFilter,
                        )?.label.toLowerCase()
                      } found
                    </h2>

                    <p>
                      Add a product of this type or choose another filter.
                    </p>

                  </div>
                )

              : (

                visibleProducts.map(
                  (product) => {

                    const sectionLabel =
                      PRODUCT_SECTION_LABELS[
                        product.productSection
                      ] ||
                      product.productSection ||
                      '—';


                    const priceValues =
                      Object.values(
                        product.prices ||
                        {},
                      ).filter(
                        (value) =>
                          Number(
                            value,
                          ) >
                          0,
                      );


                    const minPriceDisplay =
                      product.productType !==
                        'MATTRESS'
                        ? product.price != null
                          ? `₹${Number(
                              product.price,
                            ).toLocaleString(
                              'en-IN',
                            )}`
                          : 'Price on request'
                        : priceValues.length
                        ? `₹${Math.min(
                            ...priceValues,
                          )}/sq.ft`
                        : '—';


                    return (

                      <div
                        className="admin-product"
                        key={
                          product.id
                        }
                      >

                        <img
                          src={
                            product.image
                          }
                          alt={
                            product.name
                          }
                        />


                        <span>

                          <b>
                            {
                              product.name
                            }
                          </b>


                          <small>

                            <span
                              style={{
                                background:
                                  '#f3e9d2',
                                color:
                                  '#5e3a00',
                                borderRadius:
                                  4,
                                padding:
                                  '1px 7px',
                                fontWeight:
                                  700,
                                fontSize:
                                  '0.72rem',
                                marginRight:
                                  6,
                              }}
                            >

                              {
                                sectionLabel
                              }

                            </span>


                            {
                              product.category &&
                              (
                                <strong>
                                  {
                                    product.category
                                  }
                                </strong>
                              )
                            }


                            {
                              product.subcategory &&
                              ` · ${product.subcategory}`
                            }


                            {
                              getProductListType(product) === 'PILLOW' &&
                              ` · ${Number(product.packSize) === 2 ? 'Pair of 2' : 'Single pillow'}`
                            }


                            {
                              product.firmness &&
                              ` · ${product.firmness}`
                            }


                            {
                              product.warranty &&
                              ` · ${product.warranty} warranty`
                            }

                          </small>


                          <small className="product-description-preview">

                            {
                              product.description
                            }

                          </small>

                        </span>


                        <strong>
                          {
                            minPriceDisplay
                          }
                        </strong>


                        <button
                          className="edit-product"
                          onClick={
                            () => {

                              setEditingProduct(
                                product,
                              );

                              setIsOpen(
                                true,
                              );
                            }
                          }
                          disabled={
                            deletingId ===
                            product.id
                          }
                        >
                          Edit
                        </button>


                        <button
                          onClick={
                            () =>
                              handleDelete(
                                product.id,
                              )
                          }
                          disabled={
                            deletingId ===
                            product.id
                          }
                        >

                          {
                            deletingId ===
                            product.id
                              ? 'Deleting...'
                              : 'Delete'
                          }

                        </button>

                      </div>
                    );
                  },
                )
              )
        }

      </section>


      {
        isOpen && (

          <AdminModal
            title={
              editingProduct
                ? `Edit ${editingProduct.name}`
                : 'Add a new product'
            }
            onClose={
              close
            }
          >

            <ProductForm
              product={
                editingProduct
              }
              categories={
                categories
              }
              onSave={
                handleSave
              }
              onClose={
                close
              }
            />

          </AdminModal>
        )
      }

    </>
  );
}
