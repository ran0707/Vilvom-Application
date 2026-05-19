import { setItem, getItem } from '../utils/storage';
import NotificationService from './notificationService';

export interface GuestProfile {
  id: string;
  name: string;
  avatar: string;
  isGuest: true;
  createdAt: string;
}

const GUEST_KEY = 'guest_profile';

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const generateId = () => {
  // simple UUIDv4-lite
  return (
    'guest-' +
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2, 8)
  );
};

const pickAvatar = (): string => {
  // use pravatar with a random id 1..70
  const id = randomInt(1, 70);
  return `https://i.pravatar.cc/150?img=${id}`;
};

export const createGuestProfile = async (): Promise<GuestProfile> => {
  // If there's already a stored guest, return it
  try {
    const existing = await getItem(GUEST_KEY);
    if (existing) {
      try {
        const parsed = JSON.parse(existing) as GuestProfile;
        if (parsed && parsed.isGuest) return parsed;
      } catch (e) {
        // ignore parse errors and recreate
      }
    }

    const profile: GuestProfile = {
      id: generateId(),
      name: `Guest-${randomInt(1000, 9999)}`,
      avatar: pickAvatar(),
      isGuest: true,
      createdAt: new Date().toISOString(),
    };

    await setItem(GUEST_KEY, JSON.stringify(profile));
    return profile;
  } catch (e) {
    // fallback: return a profile but do not persist
    return {
      id: generateId(),
      name: `Guest-${randomInt(1000, 9999)}`,
      avatar: pickAvatar(),
      isGuest: true,
      createdAt: new Date().toISOString(),
    } as GuestProfile;
  }
};

export const getGuestProfile = async (): Promise<GuestProfile | null> => {
  const raw = await getItem(GUEST_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GuestProfile;
    return parsed;
  } catch (e) {
    return null;
  }
};

export default {
  createGuestProfile,
  getGuestProfile,
};
