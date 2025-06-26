// src/pages/verified-news/index.js (This will be accessible at /verified-news)
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { db } from '@/firebase/init.js';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import Fuse from 'fuse.js';

export default function VerifiedNewsPage() { // Changed component name
  const [pressReleases, setPressReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPressReleases, setFilteredPressReleases] = useState([]);

  // Fetch ALL Press Releases (publicly accessible)
  useEffect(() => {
    const fetchAllPressReleases = async () => {
      setLoading(true);
      try {
        // Query to get all press releases, ordered by creation date
        const q = query(
          collection(db, 'press_releases'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedReleases = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPressReleases(fetchedReleases);
        setFilteredPressReleases(fetchedReleases);
      } catch (error) {
        console.error("Error fetching public press releases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllPressReleases();
  }, []);

  // Fuse.js search options
  const fuseOptions = {
    keys: [
      'headline', 'location', 'what', 'who', 'when', 'where', 'why', 'how',
    ],
    threshold: 0.3,
    includeScore: true,
  };

  // Handle search input change
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredPressReleases(pressReleases);
    } else {
      const fuse = new Fuse(pressReleases, fuseOptions);
      const result = fuse.search(searchTerm);
      setFilteredPressReleases(result.map(item => item.item));
    }
  }, [searchTerm, pressReleases]);


  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <p>Loading verified news...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Head>
        <title>Verified News</title>
      </Head>

      <main style={styles.main}>
        <h1 style={styles.heading}>Verified News</h1>
        <p style={styles.subheading}>Browse public announcements and fact checks.</p>

        <div style={styles.topSection}>
          <input
            type="text"
            placeholder="Search verified news..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {filteredPressReleases.length === 0 && searchTerm === '' && (
          <p style={styles.noReleases}>No verified news has been published yet.</p>
        )}

        {filteredPressReleases.length === 0 && searchTerm !== '' && (
          <p style={styles.noReleases}>No results found for "{searchTerm}" in verified news.</p>
        )}

        <div style={styles.grid}>
          {filteredPressReleases.map((release) => (
            <div key={release.id} style={styles.card}>
              {/* IMPORTANT: This links to the detail page at /press-releases/[id], NOT /verified-news/[id] */}
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
                <Link href={`/press-releases/${release.id}`} passHref>
                  <button style={styles.viewButton}>View Details</button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p style={styles.homeLink}>
            <Link href="/" style={styles.link}>Back to Home</Link>
        </p>
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
      maxWidth: '900px',
    },
    heading: {
      color: '#333',
      marginBottom: '10px',
      fontSize: '2.5em',
    },
    subheading: {
      fontSize: '1.1em',
      color: '#555',
      marginBottom: '30px',
    },
    topSection: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      width: '100%',
    },
    searchInput: {
      padding: '10px 15px',
      border: '1px solid #ddd',
      borderRadius: '5px',
      fontSize: '1em',
      width: '100%',
      maxWidth: '500px',
      boxSizing: 'border-box',
    },
    noReleases: {
      fontSize: '1.1em',
      color: '#555',
      marginTop: '30px',
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
    viewButton: {
      backgroundColor: '#007bff',
      color: '#ffffff',
      padding: '8px 15px',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '0.9em',
      transition: 'background-color 0.2s ease',
    },
    homeLink: {
        marginTop: '30px',
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
    linkHover: {
      backgroundColor: '#0070f3',
      color: '#ffffff',
    },
  };