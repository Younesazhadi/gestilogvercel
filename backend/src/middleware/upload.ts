import multer from 'multer';
import { Request } from 'express';

// Configuration de multer pour stocker temporairement en mémoire
const storage = multer.memoryStorage();

// Filtre pour accepter uniquement les images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Vérifier le type MIME
  if (file.mimetype.startsWith('image/')) {
    // Vérifier l'extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non accepté. Formats acceptés: JPG, PNG, GIF, WEBP'));
    }
  } else {
    cb(new Error('Le fichier doit être une image'));
  }
};

// Configuration de multer
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: fileFilter,
});


