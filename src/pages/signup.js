// src/pages/signup.js
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '@/firebase/init';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        status: 'pending_review',
        createdAt: serverTimestamp(),
      });

      router.push('/pending-review');
    } catch (err) {
      console.error("Signup error:", err.message);
      setError("Failed to sign up. Please try again with a different email.");
    }
  };

  return (
    <div style={styles.container}>
      <Head>
        <title>Sign Up - PRP</title>
      </Head>
      <main style={styles.main}>
        <h1 style={styles.heading}>Sign Up for PRP</h1>
        <form onSubmit={handleSignup} style={styles.form}>
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          {error && <p style={styles.errorText}>{error}</p>}
          <button type="submit" style={styles.button}>Sign Up</button>
        </form>
        <p style={styles.loginText}>
          Already have an account?{' '}
          <Link href="/login" passHref>
            <span style={styles.link}>Login</span>
          </Link>
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
    fontSize: '2.5em',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
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
  loginText: {
    marginTop: '25px',
    color: '#555',
    fontSize: '0.95em',
  },
  link: {
    color: '#007bff',
    textDecoration: 'none',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
  },
};