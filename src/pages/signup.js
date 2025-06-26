// src/pages/signup.js
import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/firebase/init.js'; // Import 'db' for Firestore
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'; // Import Firestore functions

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Create user with Email and Password in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Create a corresponding user document in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || null, // Firebase Auth might not provide a display name initially
        status: 'pending_review', // <<<<<< CRITICAL: Set initial status
        reputationScore: 0, // Initialize reputation score
        endorsementsGivenMonthly: 0, // Track monthly endorsements given by this user
        lastEndorsementReset: serverTimestamp(), // Timestamp for monthly reset
        companyDomain: email.split('@')[1] || null, // Extract company domain from email
        createdAt: serverTimestamp(),
      });

      console.log("User signed up and Firestore document created:", user.uid);

      // 3. Redirect to a dedicated pending review page
      router.push('/pending-review'); // Redirect to inform the user about their status

    } catch (err) {
      console.error("Signup error:", err.message);
      let errorMessage = "An unexpected error occurred during signup.";
      if (err.code) {
        switch (err.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email address is already in use.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'The email address is not valid.';
            break;
          case 'auth/weak-password':
            errorMessage = 'The password is too weak. Please choose a stronger password.';
            break;
          default:
            errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <Head>
        <title>PRP Signup</title>
        <meta name="description" content="Sign up for Press Release Portal" />
      </Head>

      <main style={styles.main}>
        <h1 style={styles.heading}>Sign Up for PRP</h1>

        <form onSubmit={handleSignup} style={styles.form}>
          {error && <p style={styles.errorText}>{error}</p>}

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
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>

        <p style={styles.loginText}>
          Already have an account?{' '}
          <Link href="/login" style={styles.link}>Login</Link>
        </p>
      </main>
    </div>
  );
}

// Basic inline styles (reused from login page for consistency)
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
  loginText: {
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