import cloudinary from 'cloudinary';
import streamifier from 'streamifier';
import { prisma } from '../config/db.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      { folder: 'luralink/verification-documents' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

export async function uploadDocument(req, res, next) {
  try {
    const { documentType } = req.body;

    if (!req.file) {
      return errorResponse(res, 400, 'No file uploaded', 'FILE_MISSING');
    }

    const result = await uploadBufferToCloudinary(req.file.buffer);

    const verification = await prisma.verification.create({
      data: {
        userId: req.user.id,
        documentType,
        documentUrl: result.secure_url,
        status: 'pending'
      }
    });

    return successResponse(res, 201, verification);
  } catch (err) {
    next(err);
  }
}

export async function getPendingVerifications(req, res, next) {
  try {
    const pending = await prisma.verification.findMany({
      where: { status: 'pending' },
      include: { user: { select: { name: true, email: true } } }
    });

    return successResponse(res, 200, pending);
  } catch (err) {
    next(err);
  }
}

export async function reviewVerification(req, res, next) {
  try {
    const { id } = req.params;
    const { decision, note } = req.body;

    if (!['approved', 'rejected'].includes(decision)) {
      return errorResponse(res, 400, 'Decision must be approved or rejected', 'INVALID_DECISION');
    }

    if (decision === 'rejected' && !note) {
      return errorResponse(res, 400, 'A note is required when rejecting', 'NOTE_REQUIRED');
    }

    const verification = await prisma.verification.update({
      where: { id: Number(id) },
      data: {
        status: decision,
        reviewNote: note || null,
        reviewedBy: req.user.id
      }
    });

    return successResponse(res, 200, verification);
  } catch (err) {
    next(err);
  }
}