// src/pages/my-press-releases.js
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '@/firebase/init.js';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Fuse from 'fuse.js'; // Import Fuse.js

export default function MyPressReleasesPage() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [pressReleases, setPressReleases] = useState([]);
  const [loadingPressReleases, setLoadingPressReleases] = useState(true);
  const [error, setError] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState('');
  const router = useRouter();

  // --- NEW STATE FOR SEARCH ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPressReleases, setFilteredPressReleases] = useState([]);
  // --- END NEW STATE ---

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

  // 2. Fetch User-Specific Press Releases
  useEffect(() => {
    if (!user) {
      // Wait for user to be authenticated
      return;
    }

    const fetchUserPressReleases = async () => {
      setLoadingPressReleases(true);
      setError(null);
      try {
        const q = query(
          collection(db, 'press_releases'),
          where('userId', '==', user.uid), // Filter by the logged-in user's ID
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedReleases = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPressReleases(fetchedReleases);
        setFilteredPressReleases(fetchedReleases); // Initialize filtered list with all releases
      } catch (err) {
        console.error("Error fetching user's press releases:", err);
        setError("Failed to load your press releases.");
      } finally {
        setLoadingPressReleases(false);
      }
    };

    fetchUserPressReleases();
  }, [user]); // Re-fetch when user changes (i.e., after login)

  // --- NEW: Fuse.js Search Logic ---
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredPressReleases(pressReleases); // If no search term, show all
    } else {
      const fuseOptions = {
        keys: [
          'headline', 'location', 'what', 'who', 'when', 'where', 'why', 'how', // Fields to search within
        ],
        threshold: 0.3, // Adjust for fuzziness (0.0 = exact match, 1.0 = very fuzzy)
        includeScore: true, // Useful for debugging search relevance
      };
      const fuse = new Fuse(pressReleases, fuseOptions);
      const result = fuse.search(searchTerm);
      setFilteredPressReleases(result.map(item => item.item)); // Map Fuse results back to original items
    }
  }, [searchTerm, pressReleases]); // Re-run search when searchTerm or original pressReleases change
  // --- END NEW SEARCH LOGIC ---


  // 3. Handle Delete Action
  const handleDelete = async (idToDelete) => {
    if (!window.confirm("Are you sure you want to delete this press release? This action cannot be undone.")) {
      return; // User cancelled
    }

    setDeleteStatus('Deleting...');
    try {
      await deleteDoc(doc(db, "press_releases", idToDelete));
      setDeleteStatus('Press release deleted successfully!');
      // Update state to remove the deleted item from both lists
      setPressReleases(prev => prev.filter(pr => pr.id !== idToDelete));
      // filteredPressReleases will update automatically via the useEffect for search
    } catch (err) {
      console.error("Error deleting document:", err);
      setDeleteStatus(`Error deleting press release: ${err.message}`);
    }
  };

  if (loadingAuth || loadingPressReleases) {
    return (
      <div style={styles.loadingContainer}>
        <p>Loading {loadingAuth ? 'user session' : 'your press releases'}...</p>
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
          <Link href="/" style={styles.link}>Back to Home</Link>
        </main>
      </div>
    );
  }

  // If user is logged in but has no press releases
  if (pressReleases.length === 0 && searchTerm === '') {
    return (
      <div style={styles.container}>
        <Head>
          <title>My Press Releases</title>
        </Head>
        <main style={styles.main}>
          <h1 style={styles.heading}>My Press Releases</h1>
          <p style={styles.noReleases}>You haven't published any press releases yet.</p>
          <Link href="/add-press-release" style={styles.addPRLink}>Create New Press Release</Link>
          <p style={styles.backLinkContainer}>
            <Link href="/" style={styles.link}>Back to Home</Link>
          </p>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Head>
        <title>My Press Releases</title>
      </Head>

      <main style={styles.main}>
        <h1 style={styles.heading}>My Press Releases</h1>

        {/* --- NEW: Search Input Field --- */}
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search your press releases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        {/* --- END NEW SEARCH INPUT --- */}

        {deleteStatus && <p style={styles.statusMessage}>{deleteStatus}</p>}

        {filteredPressReleases.length === 0 && searchTerm !== '' ? (
            <p style={styles.noResults}>No results found for "{searchTerm}" in your press releases.</p>
        ) : (
            <div style={styles.grid}>
            {filteredPressReleases.map((release) => (
                <div key={release.id} style={styles.card}>
                <Link href={`/press-releases/${release.id}`} passHref>
                    <h2 style={styles.cardTitle}>{release.headline}</h2>
                </Link>
                <p style={styles.cardLocationDate}>
                    {release.location} : {release.date}
                </p>
                <p style={styles.cardSnippet}>
                    {release.what?.substring(0, 150)}{release.what?.length > 150 ? '...' : ''}
                </p>
                <div style={styles.cardActions}>
                    <Link href={`/edit-press-release/${release.id}`} passHref>
                    <button style={styles.editButton}>Edit</button>
                    </Link>
                    <button onClick={() => handleDelete(release.id)} style={styles.deleteButton}>Delete</button>
                </div>
                </div>
            ))}
            </div>
        )}


        <p style={styles.bottomLinks}>
          <Link href="/add-press-release" style={styles.addPRLink}>Create New Press Release</Link>
          <Link href="/" style={styles.link}>Back to Home</Link>
        </p>
      </main>
    </div>
  );
}

// Inline styles (add to or merge with your existing styles)
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
        maxWidth: '900px',
    },
    heading: {
        color: '#333',
        marginBottom: '20px',
        fontSize: '2.5em',
    },
    searchContainer: { // NEW STYLE
        marginBottom: '30px',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
    },
    searchInput: { // NEW STYLE
        padding: '12px 20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        fontSize: '1em',
        width: '100%',
        maxWidth: '500px',
        boxSizing: 'border-box',
        outline: 'none',
        '&:focus': {
            borderColor: '#0070f3',
            boxShadow: '0 0 0 3px rgba(0, 112, 243, 0.2)',
        },
    },
    noReleases: {
        fontSize: '1.2em',
        color: '#555',
        marginTop: '30px',
        marginBottom: '20px',
    },
    noResults: { // NEW STYLE
        fontSize: '1.1em',
        color: '#555',
        marginTop: '20px',
        marginBottom: '20px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        width: '100%',
        marginTop: '20px',
    },
    card: {
        backgroundColor: '#f9f9f9',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'left',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    cardTitle: {
        fontSize: '1.5em',
        color: '#0070f3',
        marginBottom: '10px',
        textDecoration: 'none',
    },
    cardLocationDate: {
        fontSize: '0.9em',
        color: '#666',
        marginBottom: '10px',
    },
    cardSnippet: {
        fontSize: '0.95em',
        color: '#444',
        marginBottom: '15px',
        lineHeight: '1.5',
    },
    cardActions: {
        display: 'flex',
        gap: '10px',
        marginTop: '15px',
        justifyContent: 'flex-end',
    },
    editButton: {
        backgroundColor: '#ffc107',
        color: '#333',
        padding: '8px 15px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '0.9em',
        transition: 'background-color 0.2s ease',
    },
    deleteButton: {
        backgroundColor: '#dc3545',
        color: '#ffffff',
        padding: '8px 15px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '0.9em',
        transition: 'background-color 0.2s ease',
    },
    statusMessage: {
        marginTop: '20px',
        fontSize: '0.9em',
        color: '#555',
    },
    bottomLinks: {
        marginTop: '30px',
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        flexWrap: 'wrap',
    },
    link: {
        color: '#0070f3',
        textDecoration: 'none',
        fontWeight: 'bold',
        padding: '10px 20px',
        border: '1px solid #0070f3',
        borderRadius: '5px',
        transition: 'background-color 0.2s ease, color 0.2s ease',
    },
    addPRLink: {
        backgroundColor: '#28a745', // Green button
        color: '#ffffff',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '1em',
        fontWeight: 'bold',
        textDecoration: 'none',
        transition: 'background-color 0.2s ease',
    },
    errorText: {
        color: '#e74c3c',
        marginBottom: '15px',
        fontSize: '1em',
    },
};