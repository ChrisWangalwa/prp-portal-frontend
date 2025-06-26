// src/pages/index.js
import Head from 'next/head';
import Link from 'next/link';
// Removed useState, useEffect, useRouter - these are no longer needed locally for auth state
// Removed auth, onAuthStateChanged, signOut imports - these are handled globally in _app.js

export default function HomePage({ currentUser, currentUserStatus }) { // Accept currentUser and currentUserStatus as props
  // No local state for user or loading, as it's passed from _app.js
  // No local handleLogout, as it's handled in _app.js or a global context/component now

  // You can still have local state for other UI elements if needed
  // const [someLocalState, setSomeLocalState] = useState(false);

  // Determine if content is loading or user status is still being fetched by _app.js
  const isLoading = currentUserStatus === 'loading';

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Head>
        <title>PRP - Press Release Portal</title>
        <meta name="description" content="Secure and verifiable press release distribution platform." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main style={styles.main}>
        <h1 style={styles.heading}>Welcome to the Press Release Portal</h1>
        <p style={styles.subheading}>
          Your journey to secure, scalable, and community-powered PR distribution begins here.
        </p>

        {/* Link to Verified News - Publicly accessible */}
        <div style={styles.publicLinks}>
          <Link href="/news-feed" passHref> {/* Changed to /news-feed as per common pattern */}
            <button style={styles.publicLink}>Browse Verified News</button>
          </Link>
        </div>

        {/* Display Firebase Authentication status and actions */}
        <div style={styles.authStatusContainer}>
          {currentUser ? (
            // User is logged in
            <>
              <p style={styles.loggedInStatus}>Logged in as: {currentUser.email}</p>
              {currentUserStatus === 'approved' ? (
                // Approved user actions
                <div style={styles.authActions}>
                  <Link href="/add-press-release" passHref>
                    <button style={styles.addPRButton}>Add New Press Release</button>
                  </Link>
                  <Link href="/my-press-releases" passHref>
                    <button style={styles.myPRButton}>My Press Releases</button>
                  </Link>
                  {/* Logout button now relies on global logout from _app.js or a shared component */}
                  {/* For now, direct user to /logout if you have a page that handles signOut there,
                      or if you have a global context for signOut.
                      For a simple setup, redirect to /login after logout in _app.js */}
                  <Link href="/login" passHref> {/* Assumes _app.js handles actual signOut on redirect */}
                    <button style={styles.logoutButton}>Logout</button>
                  </Link>
                </div>
              ) : (
                // Pending/Rejected user logged in
                <div style={styles.pendingAuthActions}>
                  <p style={styles.loggedInStatus}>Account status: {currentUserStatus.replace('_', ' ')}</p>
                  <Link href="/pending-review" passHref>
                    <button style={styles.addPRButton}>View Account Status</button>
                  </Link>
                  <Link href="/login" passHref> {/* Assumes _app.js handles actual signOut on redirect */}
                    <button style={styles.logoutButton}>Logout</button>
                  </Link>
                </div>
              )}
            </>
          ) : (
            // User is not logged in
            <p style={styles.loggedOutStatus}>
              You are not logged in.
              <div style={styles.authActions}>
                <Link href="/login" passHref>
                  <button style={styles.loginButton}>Login</button>
                </Link>
                <Link href="/signup" passHref>
                  <button style={styles.signupButton}>Sign Up</button>
                </Link>
              </div>
            </p>
          )}
        </div>
      </main>

      <footer style={styles.footer}>
        <p>&copy; 2024 Press Release Portal. All rights reserved.</p>
      </footer>
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
    maxWidth: '800px',
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
  publicLinks: { // New style for public links container
    marginTop: '20px',
    marginBottom: '30px',
  },
  publicLink: { // Style for the new public link
    display: 'inline-block',
    backgroundColor: '#007bff', // Blue color for public access
    color: '#ffffff',
    padding: '12px 25px',
    border: 'none',
    borderRadius: '5px',
    textDecoration: 'none',
    fontSize: '1.1em',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  publicLinkHover: {
    backgroundColor: '#0055bb',
  },
  authStatusContainer: {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #eee',
    width: '100%',
  },
  loggedInStatus: {
    fontSize: '1.1em',
    color: '#28a745', // Green for logged in
    marginBottom: '20px',
  },
  loggedOutStatus: {
    fontSize: '1.1em',
    color: '#dc3545', // Red for logged out
    marginBottom: '20px',
  },
  authActions: {
    display: 'flex',
    flexWrap: 'wrap', // Allow buttons to wrap
    justifyContent: 'center',
    gap: '15px',
  },
  pendingAuthActions: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '15px',
    // Added specific styles for pending actions if needed
  },
  addPRButton: {
    backgroundColor: '#007bff',
    color: '#ffffff',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease',
  },
  myPRButton: {
    backgroundColor: '#6c757d', // Grey
    color: '#ffffff',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease',
  },
  logoutButton: {
    backgroundColor: '#f44336', // Red
    color: '#ffffff',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease',
  },
  loginButton: {
    backgroundColor: '#007bff',
    color: '#ffffff',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease',
    marginRight: '10px',
  },
  signupButton: {
    backgroundColor: '#6c757d', // Grey
    color: '#ffffff',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease',
  },
  footer: {
    marginTop: '40px',
    fontSize: '0.9em',
    color: '#777',
  },
};
