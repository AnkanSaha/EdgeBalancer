import { User } from '../models/User';

export const generateUsername = async (fullName: string): Promise<string> => {
  // Convert to lowercase, remove spaces, and keep only alphanumeric
  let baseUsername = fullName
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');

  // If empty after sanitization, use default
  if (!baseUsername) {
    baseUsername = 'user';
  }

  // Try the base username first
  let username = baseUsername;
  let exists = await User.findOne({ username });

  // If it exists, append random 4-digit number until unique
  while (exists) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000); // 1000-9999
    username = `${baseUsername}${randomDigits}`;
    exists = await User.findOne({ username });
  }

  return username;
};
