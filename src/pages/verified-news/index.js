// src/pages/verified-news/index.js
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/init';
import Fuse from 'fuse.js';

export default function VerifiedNewsPage() {
  const [allPressReleases, setAllPressReleases] = useState([]);
  const [filteredPressReleases, setFilteredPressReleases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fuse.js options for fuzzy searching
  const fuseOptions = useMemo(() => ({
    keys: ['headline', 'what', 'who', 'location'],
    threshold: 0.3,
    includeScore: true,
  }), []);

  useEffect(() => {
    const q = query(
      collection(db, 'press_releases'),
      where('status', '==', 'approved')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const releases = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllPressReleases(releases);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching approved press releases:", err);
      setError("Failed to load news feed. Please try again.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Effect for filtering based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPressReleases(allPressReleases);
    } else {
      const fuse = new Fuse(allPressReleases, fuseOptions);
      const result = fuse.search(searchTerm).map(item => item.item);
      setFilteredPressReleases(result);
    }
  }, [searchTerm, allPressReleases, fuseOptions]); // Added fuseOptions to dependency array

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <p>Loading verified news feed...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <main style={styles.main}>
          <h1 style={styles.heading}>Error</h1>
          <p style={styles.errorText}>{error}</p>
          <Link href="/" passHref>
            <button style={styles.backButton}>Back to Home</button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Head>
        <title>Verified News Feed</title>
      </Head>

      <main style={styles.main}>
        <h1 style={styles.heading}>Verified News Feed</h1>
        <p style={styles.subheading}>
          Browse press releases that have been approved by our moderators.
        </p>

        <div style={styles.searchBar}>
          <input
            type="text"
            placeholder="Search news by headline, content, etc."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {filteredPressReleases.length === 0 && searchTerm.length > 0 ? (
          <p style={styles.message}>No press releases found matching {searchTerm}.</p>
        ) : filteredPressReleases.length === 0 && searchTerm.length === 0 && !loading ? (
          <p style={styles.message}>No approved press releases available yet.</p>
        ) : (
          <div style={styles.grid}>
            {filteredPressReleases.map((release) => (
              <div key={release.id} style={styles.card}>
                <h2 style={styles.cardTitle}>{release.headline}</h2>
                <p style={styles.cardMeta}>{release.location}, {release.date}</p>
                <p style={styles.cardContent}>{release.what.substring(0, 150)}...</p>
                <Link href={`/press-releases/${release.id}`} passHref>
                  <span style={styles.viewDetailsButton}>View Details</span>
                </Link>
              </div>
            ))}
          </div>
        )}

        <div style={styles.actions}>
          <Link href="/" passHref>
            <button style={styles.backButton}>Back to Home</button>
          </Link>
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
    maxWidth: '1000px',
  },
  heading: {
    color: '#333',
    marginBottom: '15px',
    fontSize: '2.5em',
  },
  subheading: {
    fontSize: '1.2em',
    color: '#555',
    marginBottom: '30px',
  },
  searchBar: {
    marginBottom: '25px',
    width: '100%',
    maxWidth: '500px',
  },
  searchInput: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '1em',
    boxSizing: 'border-box',
  },
  message: {
    fontSize: '1.1em',
    color: '#555',
    marginTop: '20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '30px',
    width: '100%',
  },
  card: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    textAlign: 'left',
    borderLeft: '5px solid #28a745',
    display: 'flex',
    flexDirection: 'column',
  },
  cardTitle: {
    fontSize: '1.5em',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px',
  },
  cardMeta: {
    fontSize: '0.9em',
    color: '#777',
    marginBottom: '10px',
  },
  cardContent: {
    fontSize: '0.9em',
    color: '#555',
    lineHeight: '1.5',
    marginBottom: '15px',
    flexGrow: 1,
  },
  viewDetailsButton: {
    display: 'inline-block',
    backgroundColor: '#007bff',
    color: '#ffffff',
    padding: '8px 15px',
    borderRadius: '5px',
    textDecoration: 'none',
    fontSize: '0.9em',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    marginTop: '10px',
  },
  actions: {
    marginTop: '40px',
  },
  backButton: {
    backgroundColor: '#6c757d',
    color: '#ffffff',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease',
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: '15px',
    fontSize: '0.9em',
  },
};