// src/pages/login.js
import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase/init.js'; // Use the alias for Firebase init

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false); // State for loading indicator
  const router = useRouter(); // Initialize Next.js router for navigation

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setError(null); // Clear previous errors
    setLoading(true); // Set loading to true

    try {
      // Attempt to sign in with email and password
      await signInWithEmailAndPassword(auth, email, password);
      // If successful, redirect to the home page or a dashboard
      router.push('/');
    } catch (err) {
      // Catch and display any errors during sign-in
      console.error("Login error:", err.message);
      setError(err.message); // Set the error message to be displayed
    } finally {
      setLoading(false); // Set loading to false regardless of success or failure
    }
  };

  return (
    <div style={styles.container}>
      <Head>
        <title>PRP Login</title>
        <meta name="description" content="Login to Press Release Portal" />
      </Head>

      <main style={styles.main}>
        <h1 style={styles.heading}>Login to PRP</h1>

        <form onSubmit={handleLogin} style={styles.form}>
          {error && <p style={styles.errorText}>{error}</p>} {/* Display error message if present */}

          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={styles.signupText}>
          Don't have an account?{' '}
          <a href="/signup" style={styles.link}>Sign Up</a>
        </p>
      </main>
    </div>
  );
}

// Basic inline styles (you might move these to a CSS module later)
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontFamily: 'sans-serif',
    backgroundColor: '#f0f2f5',
  },
  main: {
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    width: '100%',
    maxWidth: '400px',
  },
  heading: {
    color: '#333',
    marginBottom: '30px',
    fontSize: '2em',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    textAlign: 'left',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#555',
    fontSize: '0.9em',
    fontWeight: 'bold',
  },
  input: {
    width: 'calc(100% - 20px)',
    padding: '12px 10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1em',
  },
  button: {
    backgroundColor: '#0070f3',
    color: '#ffffff',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1.1em',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  buttonHover: {
    backgroundColor: '#005bb5',
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: '15px',
    fontSize: '0.9em',
  },
  signupText: {
    marginTop: '20px',
    color: '#666',
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