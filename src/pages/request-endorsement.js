// src/pages/request-endorsement.js
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '@/firebase/init';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function RequestEndorsementPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserStatus, setCurrentUserStatus] = useState('loading');
  const [endorsementEmail, setEndorsementEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/login');
        return;
      }
      setCurrentUser(user);

      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setCurrentUserStatus(userData.status);
        if (userData.status === 'approved') {
          router.replace('/');
        }
      } else {
        console.warn("Firestore user document not found on request-endorsement page:", user.uid);
        setCurrentUserStatus('pending_review');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleEndorsementRequest = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!currentUser) {
      setError('You must be logged in to request an endorsement.');
      return;
    }
    if (!endorsementEmail) {
      setError('Please enter the endorser email address.');
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setMessage(`Endorsement request sent to ${endorsementEmail}.`);
      setEndorsementEmail('');
    } catch (err) {
      console.error("Endorsement request failed:", err);
      setError('Failed to send endorsement request. Please try again.');
    }
  };

  if (currentUserStatus === 'loading') {
    return (
      <div style={styles.loadingContainer}>
        <p>Loading endorsement page...</p>
      </div>
    );
  }

  if (currentUserStatus === 'approved') {
    return null;
  }

  if (currentUserStatus === 'unauthenticated' || currentUserStatus === 'rejected') {
    return (
      <main style={styles.accessDeniedMain}>
        <h1 style={styles.accessDeniedHeading}>Access Denied</h1>
        <p style={styles.accessDeniedMessage}>
          Your account status is: <strong>{currentUserStatus.replace('_', ' ')}</strong>.
          You cannot request an endorsement if you are not pending review.
        </p>
        <Link href="/" style={styles.linkButton}>Back to Home</Link>
      </main>
    );
  }

  return (
    <div style={styles.container}>
      <Head>
        <title>Request Endorsement</title>
      </Head>

      <main style={styles.main}>
        <h1 style={styles.heading}>Request Account Endorsement</h1>
        <p style={styles.message}>
          Your account is currently <strong>pending review</strong>. You can request an endorsement from an existing verified member to expedite the approval process.
        </p>
        <p style={styles.loggedInAs}>Logged in as: <strong>{currentUser?.email}</strong></p>

        <form onSubmit={handleEndorsementRequest} style={styles.form}>
          <div style={styles.formGroup}>
            <label htmlFor="endorsementEmail" style={styles.label}>Endorser Email</label>
            <input
              type="email"
              id="endorsementEmail"
              value={endorsementEmail}
              onChange={(e) => setEndorsementEmail(e.target.value)}
              placeholder="verified.member@example.com"
              required
              style={styles.input}
            />
          </div>
          {error && <p style={styles.errorText}>{error}</p>}
          {message && <p style={styles.successText}>{message}</p>}
          <button type="submit" style={styles.button}>Send Endorsement Request</button>
        </form>

        <div style={styles.actions}>
          <Link href="/pending-review" style={styles.backButton}>Back to Account Status</Link>
          <Link href="/" style={styles.backButton}>Back to Home</Link>
        </div>
      </main>
    </div>
  );
}

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
  accessDeniedMain: {
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    width: '100%',
    maxWidth: '600px',
    margin: 'auto',
  },
  accessDeniedHeading: {
    color: '#dc3545',
    marginBottom: '20px',
    fontSize: '2.5em',
  },
  accessDeniedMessage: {
    fontSize: '1.1em',
    color: '#555',
    marginBottom: '30px',
    lineHeight: '1.6',
  },
  linkButton: {
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
    margin: '0 10px',
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
  loggedInAs: {
    fontSize: '1em',
    color: '#777',
    marginBottom: '30px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginTop: '20px',
  },
  formGroup: {
    textAlign: 'left',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#333',
    fontSize: '0.95em',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '1em',
    boxSizing: 'border-box',
  },
  button: {
    backgroundColor: '#28a745',
    color: '#ffffff',
    padding: '12px 25px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1.1em',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease',
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: '15px',
    fontSize: '0.9em',
  },
  successText: {
    color: '#28a745',
    marginBottom: '15px',
    fontSize: '0.9em',
  },
  actions: {
    marginTop: '30px',
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
    flexWrap: 'wrap',
  },
  backButton: {
    backgroundColor: '#6c757d',
    color: '#ffffff',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    textDecoration: 'none',
    fontSize: '1em',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
};