
import multer from "multer";

const uploadQR = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(
        new Error("Sirf JPG, PNG aur WEBP images allowed hain.")
      );
    }

    callback(null, true);
  },
});

export default uploadQR;
