import prisma from '../../config/prisma.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

export const createDistributorRequest = async (req, res, next) => {
  try {
    const {
      fullName,
      name,
      email,
      phone,
      phoneNumber,
      targetCity,
      targetLocation,
      investmentRange,
      businessExperience,
      company,
      message,
    } = req.body;

    const applicantName = (fullName || name || '').trim();
    const applicantEmail = (email || '').trim();
    const applicantPhone = (phone || phoneNumber || '').trim();
    const location = (targetCity || targetLocation || '').trim();
    const investment = (investmentRange || '').trim();
    const experience = (businessExperience || message || '').trim();

    if (!applicantName) {
      return sendError(res, 'Full Name is required.', 400);
    }
    if (!applicantEmail) {
      return sendError(res, 'Email address is required.', 400);
    }
    if (!applicantPhone) {
      return sendError(res, 'Phone number is required.', 400);
    }

    const created = await prisma.distributorRequest.create({
      data: {
        fullName: applicantName,
        name: applicantName,
        email: applicantEmail,
        phoneNumber: applicantPhone,
        phone: applicantPhone,
        targetLocation: location,
        city: location,
        investmentRange: investment,
        businessExperience: experience,
        company: company || null,
        message: experience || message || null,
        status: 'PENDING',
      },
    });

    return sendSuccess(
      res,
      created,
      'Thank you! Your distributor request has been submitted successfully. Our team will contact you soon.',
      201
    );
  } catch (error) {
    next(error);
  }
};
