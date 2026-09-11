import { api } from '../config/apiClient';

export async function submitDistributorRequest({
  fullName,
  phone,
  email,
  targetCity,
  investmentRange,
  businessExperience,
}) {
  const data = await api.post('/distributor-requests', {
    fullName: fullName.trim(),
    phone: phone.trim(),
    phoneNumber: phone.trim(),
    email: email.trim(),
    targetCity: targetCity.trim(),
    targetLocation: targetCity.trim(),
    investmentRange: investmentRange.trim(),
    businessExperience: businessExperience.trim(),
  });
  return {
    success: true,
    message: 'Thank you! Your distributor request has been submitted successfully. Our team will contact you soon.',
    data,
  };
}
