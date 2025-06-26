// src/pages/api/generate-invite-code.js
import { db } from '@/firebase/init';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Helper function to generate a unique invite code
function generateUniqueCode(prefix = 'PRP', length = 6) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return `${prefix}-${result}`;
}

export default async function handler(req, res) {
  // Ensure this API route is only accessible by authorized users (e.g., admins)
  // For now, we'll keep it simple, but in a real app, you'd add:
  // - Authentication check (e.g., Firebase Admin SDK to verify ID token)
  // - Role check (ensure user is an admin/moderator)

  if (req.method === 'POST') {
    const { createdBy, maxUses = 1, inviteeDomain = null, expiresAt = null } = req.body;

    // Basic validation
    if (!createdBy) {
      return res.status(400).json({ message: 'Creator ID is required.' });
    }
    if (typeof maxUses !== 'number' || maxUses <= 0) {
      return res.status(400).json({ message: 'maxUses must be a positive number.' });
    }
    if (inviteeDomain !== null && typeof inviteeDomain !== 'string') {
      return res.status(400).json({ message: 'inviteeDomain must be a string or null.' });
    }

    try {
      const newCode = generateUniqueCode('MOD'); // Example prefix for Moderator codes

      const inviteCodeData = {
        code: newCode,
        createdBy: createdBy, // UID of the admin/moderator generating it
        createdAt: serverTimestamp(), // Firestore server timestamp
        expiresAt: expiresAt ? new Date(expiresAt) : null, // Convert to Date object if provided
        maxUses: maxUses,
        currentUses: 0,
        isActive: true,
        inviteeDomain: inviteeDomain, // Optional: domain restriction
        status: 'active',
      };

      const docRef = await addDoc(collection(db, 'invite_codes'), inviteCodeData);

      res.status(200).json({
        message: 'Invite code generated successfully!',
        inviteCode: newCode,
        docId: docRef.id,
      });

    } catch (error) {
      console.error('Error generating invite code:', error);
      res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}