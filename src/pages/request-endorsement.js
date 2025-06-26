// src/pages/request-endorsement.js
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '@/firebase/init';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export default function RequestEndorsementPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserStatus, setCurrentUserStatus] = useState('loading');
  // --- CHANGES START HERE ---
  const [targetEmail, setTargetEmail] = useState(''); // New state for the target endorser's email
  // --- CHANGES END HERE ---
  const [message, setMessage] = useState('');
  const [requestStatus, setRequestStatus] = useState(''); // Status of the request sending
  const router = useRouter();

  // 1. Check User Authentication and Status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/login'); // Redirect to login if not authenticated
        return;
      }
      setCurrentUser(user);

      // Fetch user's status from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setCurrentUserStatus(userData.status);
        if (userData.status === 'approved') {
          // If approved, this page is not for them, redirect to home
          router.replace('/');
        }
      } else {
        // User logged in, but no Firestore doc? Should not happen if signup.js works.
        // Treat as pending or redirect.
        console.warn("Firestore user document not found for logged-in user on request-endorsement page:", user.uid);
        setCurrentUserStatus('pending_review'); // Assume pending if doc missing after login
      }
    });
    return () => unsubscribe();
  }, [router]);

  // --- CHANGES START HERE: No Search, Direct Request ---
  const handleSendRequest = async (e) => {
    e.preventDefault(); // Prevent form default submission

    if (!currentUser) {
      setRequestStatus('Error: User not authenticated.');
      return;
    }
    if (!targetEmail.trim()) {
      setRequestStatus('Please enter the email of the member you want to request an endorsement from.');
      return;
    }
    if (currentUser.email === targetEmail.trim()) {
      setRequestStatus('You cannot request an endorsement from yourself.');
      return;
    }

    setRequestStatus('Validating and sending request...');
    try {
      // 1. Find the target user by email and ensure they are 'approved'
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('email', '==', targetEmail.trim()),
        where('status', '==', 'approved')
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setRequestStatus('Error: No approved member found with that email address.');
        return;
      }

      const targetUserDoc = querySnapshot.docs[0];
      const targetUserData = targetUserDoc.data();
      const targetUid = targetUserDoc.id; // Get the UID from the document ID

      // 2. Check if a pending request already exists to prevent duplicates
      const existingRequestsQuery = query(
        collection(db, 'endorsement_requests'),
        where('requesterUid', '==', currentUser.uid),
        where('targetUid', '==', targetUid),
        where('status', '==', 'pending')
      );
      const existingRequestsSnap = await getDocs(existingRequestsQuery);

      if (!existingRequestsSnap.empty) {
        setRequestStatus('You already have a pending endorsement request with this member.');
        return;
      }

      // 3. Create the endorsement request document
      await setDoc(doc(collection(db, 'endorsement_requests')), {
        requesterUid: currentUser.uid,
        requesterEmail: currentUser.email,
        targetUid: targetUid,
        targetEmail: targetUserData.email, // Use the email from the found user doc
        status: 'pending',
        message: message.trim() || 'I would like to request an endorsement for the Press Release Portal.',
        createdAt: serverTimestamp(),
      });
      setRequestStatus(`Request sent to ${targetUserData.displayName || targetUserData.email} successfully! The member will be notified.`);
      setTargetEmail(''); // Clear input
      setMessage(''); // Clear message
    } catch (error) {
      console.error("Error sending endorsement request:", error);
      setRequestStatus(`Failed to send request: ${error.message}`);
    }
  };
  // --- CHANGES END HERE ---


  if (currentUserStatus === 'loading') {
    return (
      <div style={styles.loadingContainer}>
        <p>Loading account status...</p>
      </div>
    );
  }

  if (currentUserStatus === 'approved') {
    // This component is for pending users, approved users get redirected.
    return null;
  }

  if (currentUserStatus !== 'pending_review' && currentUserStatus !== 'rejected') {
    // Handle other statuses or unknown states appropriately
    return (
      <div style={styles.container}>
        <Head><title>Access Denied</title></Head>
        <main style={styles.main}>
          <h1 style={styles.heading}>Access Denied</h1>
          <p style={styles.message}>You do not have permission to access this page.</p>
          <Link href="/" style={styles.link}>Back to Home</Link>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Head>
        <title>Request Endorsement</title>
      </Head>

      <main style={styles.main}>
        <h1 style={styles.heading}>Request Endorsement</h1>
        <p style={styles.infoMessage}>
          Your account is currently under review. If you know an existing verified member,
          you can request an endorsement from them to expedite your approval.
        </p>
        <p style={styles.smallMessage}>
          (You must know their full email address. Verified members' contact information is not searchable for privacy.)
        </p>

        <form onSubmit={handleSendRequest} style={styles.formSection}>
          <input
            type="email"
            placeholder="Enter the email of the verified member you know"
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
            style={styles.emailInput}
            required
          />
          <textarea
            placeholder="Optional message to the member (e.g., how you know them)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={styles.messageInput}
            rows="4"
          />
          <button
            type="submit"
            style={styles.requestButton}
            disabled={requestStatus.includes('Sending') || requestStatus.includes('successfully')}
          >
            {requestStatus.includes('Sending') ? 'Sending...' : 'Send Endorsement Request'}
          </button>
        </form>

        {requestStatus && <p style={styles.statusMessage}>{requestStatus}</p>}

        <p style={styles.bottomLinks}>
          <Link href="/pending-review" style={styles.link}>Back to Account Status</Link>
          <Link href="/logout" style={styles.link}>Logout</Link>
        </p>
      </main>
    </div>
  );
}

// Inline styles (merge with your existing styles if needed)
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
    maxWidth: '700px',
  },
  heading: {
    color: '#333',
    marginBottom: '20px',
    fontSize: '2.5em',
  },
  infoMessage: {
    fontSize: '1.1em',
    color: '#555',
    marginBottom: '10px',
    lineHeight: '1.6',
  },
  smallMessage: { // New style for the "You must know their email" hint
    fontSize: '0.9em',
    color: '#777',
    marginBottom: '30px',
  },
  formSection: { // New style for the form container
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    width: '100%',
    maxWidth: '500px',
    margin: '0 auto', // Center the form
  },
  emailInput: { // Styling for the email input
    padding: '12px 15px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '1em',
    outline: 'none',
  },
  messageInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    minHeight: '80px',
    resize: 'vertical',
    fontSize: '0.9em',
    outline: 'none',
  },
  requestButton: {
    backgroundColor: '#28a745',
    color: '#ffffff',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease',
  },
  statusMessage: {
    marginTop: '20px',
    fontSize: '0.9em',
    // Dynamic color based on status (success/error)
    color: 'green', // Default to green, logic in component for red on error
  },
  bottomLinks: {
    marginTop: '30px',
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },
  link: {
    color: '#007bff',
    textDecoration: 'none',
    fontWeight: 'bold',
    padding: '10px 20px',
    border: '1px solid #007bff',
    borderRadius: '5px',
    transition: 'background-color 0.2s ease, color 0.2s ease',
  },
};