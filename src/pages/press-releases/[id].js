// src/pages/press-releases/[id].js
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase/init.js'; // Import auth and db
import { doc, getDoc, deleteDoc } from 'firebase/firestore'; // Firestore functions for doc operations
import { onAuthStateChanged } from 'firebase/auth'; // For auth state
import { format } from 'date-fns'; // Import date-fns for date formatting

export default function PressReleaseDetailPage() {
  const router = useRouter();
  const { id } = router.query; // Get the dynamic ID from the URL
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [pressRelease, setPressRelease] = useState(null);
  const [loadingPressRelease, setLoadingPressRelease] = useState(true);
  const [error, setError] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState(''); // For delete feedback

  // 1. Authentication Check and Redirection
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace('/login'); // Redirect to login if not authenticated
      } else {
        setUser(currentUser);
        setLoadingAuth(false);
      }
    });
    return () => unsubscribeAuth();
  }, [router]);

  // 2. Fetch Single Press Release Data
  useEffect(() => {
    if (!id || !user) {
      // Wait for id from router and user from auth to be available
      return;
    }

    const fetchPressRelease = async () => {
      setLoadingPressRelease(true);
      setError(null);
      try {
        const docRef = doc(db, "press_releases", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setPressRelease({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Press release not found.");
        }
      } catch (err) {
        console.error("Error fetching press release:", err);
        setError("Failed to load press release details.");
      } finally {
        setLoadingPressRelease(false);
      }
    };

    fetchPressRelease();
  }, [id, user]); // Re-fetch when ID or user changes

  // 3. Handle Delete Action
  const handleDelete = async () => {
    if (!user || user.uid !== pressRelease.userId) {
      setDeleteStatus('Error: You are not authorized to delete this press release.');
      return;
    }

    if (window.confirm("Are you sure you want to delete this press release? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "press_releases", id));
        setDeleteStatus('Press release deleted successfully!');
        // Redirect to 'My Press Releases' page after successful deletion
        router.push('/my-press-releases');
      } catch (err) {
        console.error("Error deleting document:", err);
        setDeleteStatus(`Error deleting press release: ${err.message}`);
      }
    }
  };

  if (loadingAuth || loadingPressRelease) {
    return (
      <div style={styles.loadingContainer}>
        <p>Loading {loadingAuth ? 'user session' : 'press release'}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <Head><title>Error</title></Head>
        <main style={styles.main}>
          <h1 style={styles.heading}>Error</h1>
          <p style={styles.errorText}>{error}</p>
          <Link href="/my-press-releases" style={styles.link}>Back to My Press Releases</Link>
        </main>
      </div>
    );
  }

  if (!pressRelease) {
    return (
      <div style={styles.container}>
        <Head><title>Not Found</title></Head>
        <main style={styles.main}>
          <h1 style={styles.heading}>Press Release Not Found</h1>
          <p style={styles.statusText}>The press release you are looking for does not exist.</p>
          <Link href="/my-press-releases" style={styles.link}>Back to My Press Releases</Link>
        </main>
      </div>
    );
  }

  // Check if the current user is the owner of the press release
  const isOwner = user && pressRelease && user.uid === pressRelease.userId;

  return (
    <div style={styles.container}>
      <Head>
        <title>{pressRelease.headline || 'Press Release Detail'}</title>
      </Head>

      <main style={styles.main}>
        <h1 style={styles.heading}>{pressRelease.headline}</h1>

        <div style={styles.detailSection}>
          <p style={styles.meta}>
            📍 {pressRelease.location} : {pressRelease.date}{' '}
            {pressRelease.createdAt &&
              `(${format(pressRelease.createdAt.toDate(), 'PPP')})`}
          </p>

          {pressRelease.what && <p><strong>What:</strong> {pressRelease.what}</p>}
          {pressRelease.who && <p><strong>Who:</strong> {pressRelease.who}</p>}
          {pressRelease.when && <p><strong>When:</strong> {pressRelease.when}</p>}
          {pressRelease.where && <p><strong>Where:</strong> {pressRelease.where}</p>}
          {pressRelease.why && <p><strong>Why:</strong> {pressRelease.why}</p>}
          {pressRelease.how && <p><strong>How:</strong> {pressRelease.how}</p>}

          {pressRelease.website && (
            <p style={styles.website}>
              🌐 Visit: <a href={pressRelease.website} target="_blank" rel="noopener noreferrer" style={styles.link}>{pressRelease.website}</a>
            </p>
          )}
        </div>

        {isOwner && (
          <div style={styles.actionButtons}>
            <Link href={`/edit-press-release/${pressRelease.id}`} passHref>
              <button style={styles.editButton}>Edit</button>
            </Link>
            <button onClick={handleDelete} style={styles.deleteButton}>Delete</button>
          </div>
        )}

        {deleteStatus && <p style={styles.statusMessage}>{deleteStatus}</p>}

        <p style={styles.backLinkContainer}>
          <Link href="/my-press-releases" style={styles.link}>Back to My Press Releases</Link>
        </p>
      </main>
    </div>
  );
}

// Basic inline styles (add to or merge with your existing styles)
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
    maxWidth: '800px',
  },
  heading: {
    color: '#333',
    marginBottom: '20px',
    fontSize: '2.5em',
  },
  detailSection: {
    textAlign: 'left',
    marginBottom: '30px',
    lineHeight: '1.8',
    color: '#444',
    border: '1px solid #eee',
    borderRadius: '8px',
    padding: '25px',
    backgroundColor: '#fdfdfd',
  },
  meta: {
    fontSize: '0.95em',
    color: '#777',
    marginBottom: '15px',
    fontWeight: 'bold',
  },
  website: {
    marginTop: '20px',
    fontSize: '0.9em',
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: '15px',
    fontSize: '1em',
  },
  statusText: {
    fontSize: '1em',
    color: '#888',
    marginTop: '20px',
  },
  actionButtons: {
    marginTop: '30px',
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
  },
  editButton: {
    backgroundColor: '#0070f3',
    color: '#ffffff',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1em',
    transition: 'background-color 0.2s ease',
  },
  editButtonHover: {
    backgroundColor: '#005bb5',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    color: '#ffffff',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1em',
    transition: 'background-color 0.2s ease',
  },
  deleteButtonHover: {
    backgroundColor: '#c0392b',
  },
  statusMessage: {
    marginTop: '20px',
    fontSize: '0.9em',
    color: '#555',
  },
  backLinkContainer: {
    marginTop: '30px',
  },
  link: {
    color: '#0070f3',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
  linkHover: {
    textDecoration: 'underline',
  },
};