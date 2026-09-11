import multer from 'multer';

// Use memory storage so we can stream buffers directly to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are supported.'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max per file
  },
});

export const productUploadMiddleware = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'galleryImages', maxCount: 10 },
  { name: 'galleryVideos', maxCount: 5 },
]);

export const singleImageUploadMiddleware = upload.single('image');
export const bannerUploadMiddleware = upload.single('image');
