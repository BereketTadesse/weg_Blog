import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// 1. Configure Cloudinary with your .env keys
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Setup where and how the images are stored
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'weg_blog_profiles', // Folder name inside Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg'],
        transformation: [{ width: 500, height: 500, crop: 'fill' }] // Auto-crop to square!
    },
});

// 3. Create the 'upload' middleware
const upload = multer({ storage: storage });

export default upload;