// src/pages/pending-review.js
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '@/firebase/init';
import { onAuthStateChanged, signOut } from 'firebase/auth'; // Import signOut
import { doc, getDoc } from 'firebase/firestore';

export default function PendingReviewPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserStatus, setCurrentUserStatus] = useState('loading');
  const router = useRouter();

  // --- Authentication and User Status Check ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUser(null); // Explicitly set to null if no user
        setCurrentUserStatus('unauthenticated');
        router.replace('/login'); // Redirect to login if not authenticated
        return;
      }
      setCurrentUser(user);

      // Fetch user's status from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      try {
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setCurrentUserStatus(userData.status);
          // IMPORTANT: Only redirect if status is 'approved'
          if (userData.status === 'approved') {
            router.replace('/'); // If already approved, redirect to home/dashboard
          }
        } else {
          // This user is authenticated but has no Firestore document.
          // This should ideally be handled during signup, but as a fallback,
          // treat them as pending review until a doc is created.
          console.warn("Firestore user document not found for logged-in user on pending-review page:", user.uid);
          setCurrentUserStatus('pending_review'); // Default to pending
        }
      } catch (error) {
        console.error("Error fetching user status:", error);
        setCurrentUserStatus('error'); // Handle error state
        // Optionally, redirect or show a more specific error
      }
    });
    return () => unsubscribe();
  }, [router]);

  // --- Logout Function ---
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login'); // Redirect to login page after successful logout
    } catch (error) {
      console.error('Logout error:', error);
      // Optionally, display a user-friendly error message
      alert('Failed to log out. Please try again.');
    }
  };


  // --- Render based on status ---
  if (currentUserStatus === 'loading') {
    return (
      <div style={styles.loadingContainer}>
        <p>Loading account status...</p>
      </div>
    );
  }

  // If status becomes 'approved' (after a re-render or if it was initially approved)
  if (currentUserStatus === 'approved') {
    return null; // Will be redirected by useEffect
  }

  // If status is 'unauthenticated' or 'error' (or should be redirected by useEffect)
  if (currentUserStatus === 'unauthenticated' || currentUserStatus === 'error') {
    return null; // Handled by useEffect or simple rendering
  }

  // Render the pending review page for 'pending_review' or 'rejected' users
  return (
    <div style={styles.container}>
      <Head>
        <title>Account Pending Review</title>
      </Head>

      <main style={styles.main}>
        <h1 style={styles.heading}>Account Under Review</h1>
        <p style={styles.message}>
          Thank you for signing up! Your account is currently <strong>pending review</strong>.
          During this period, you will have limited access to the platform.
        </p>

        <p style={styles.nextSteps}>
          To expedite your approval, you can:
        </p>
        <ul style={styles.optionList}>
          <li>
            <Link href="/request-endorsement" style={styles.linkButton}>Request an Endorsement</Link>
            <p style={styles.optionDescription}>
              If you know an existing verified member, you can request them to endorse your account.
              This typically results in faster approval.
            </p>
          </li>
          <li>
            <p style={styles.optionDescription}>
              Alternatively, your account will be manually reviewed within approximately <strong>6 hours</strong>.
            </p>
          </li>
        </ul>

        <div style={styles.actions}>
          <Link href="/my-press-releases" style={styles.disabledLink} aria-disabled="true">My Press Releases (Unavailable)</Link>
          {/* Changed Link to a button with onClick handler for logout */}
          <button onClick={handleLogout} style={styles.link}>
            Logout
          </button>
        </div>
      </main>
    </div>
  );
}

// --- Inline Styles (kept as is, but ensure `styles.link` looks like a button) ---
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontFamily: 'sans-serif',
    backgroundColor: '#f0f2f5',
    padding: '20px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontFamily: 'sans-serif',
  },
  main: {
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    width: '100%',
    maxWidth: '600px',
  },
  heading: {
    color: '#333',
    marginBottom: '20px',
    fontSize: '2.5em',
  },
  message: {
    fontSize: '1.1em',
    color: '#555',
    marginBottom: '20px',
    lineHeight: '1.6',
  },
  nextSteps: {
    fontSize: '1.1em',
    color: '#333',
    fontWeight: 'bold',
    marginTop: '30px',
    marginBottom: '15px',
  },
  optionList: {
    listStyleType: 'none',
    padding: 0,
    margin: 0,
    width: '100%',
  },
  optionItem: {
    marginBottom: '20px',
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #eee',
  },
  optionDescription: {
    fontSize: '0.95em',
    color: '#666',
    marginTop: '10px',
    lineHeight: '1.5',
  },
  linkButton: { // Style for the endorsement request link
    display: 'inline-block',
    backgroundColor: '#007bff',
    color: '#ffffff',
    padding: '12px 25px',
    border: 'none',
    borderRadius: '5px',
    textDecoration: 'none',
    fontSize: '1em',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    marginTop: '10px',
  },
  actions: {
    marginTop: '40px',
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },
  link: { // This style is now applied to a <button> so it acts like a button
    color: '#0070f3',
    backgroundColor: 'transparent', // Ensure background is transparent if Link had it
    textDecoration: 'none',
    fontWeight: 'bold',
    padding: '10px 20px',
    border: '1px solid #0070f3',
    borderRadius: '5px',
    cursor: 'pointer', // Important for button-like behavior
    transition: 'background-color 0.2s ease, color 0.2s ease',
  },
  disabledLink: { // Styling for disabled links (e.g., My Press Releases)
    color: '#bbb',
    textDecoration: 'none',
    fontWeight: 'bold',
    padding: '10px 20px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    cursor: 'not-allowed',
  },
};