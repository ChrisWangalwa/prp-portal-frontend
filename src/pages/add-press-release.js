// src/pages/add-press-release.js
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '@/firebase/init.js'; // Ensure 'storage' is NOT imported
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
// Removed imports for Firebase Storage (ref, uploadBytesResumable, getDownloadURL)
// Removed import for CryptoJS

// Helper function to count words
// THIS FUNCTION IS CRUCIAL AND MUST BE AT THE TOP LEVEL OF THE MODULE
const wc = (s) => s.trim().split(/\s+/).filter(Boolean).length;

export default function AddPressReleasePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [userStatus, setUserStatus] = useState('loading'); // 'loading', 'unauthenticated', 'pending_review', 'approved'
  const [form, setForm] = useState({
    headline: '',
    date: '',
    location: '',
    what: '',
    who: '',
    when: '',
    where: '',
    why: '',
    how: '',
    website: '',
  });
  // Removed evidence state and related states
  // const [evidence, setEvidence] = useState(null);
  // const [uploadProgress, setUploadProgress] = useState(0);

  const [errMsg, setErrMsg] = useState('');
  const [okMsg, setOkMsg] = useState('');


  // --- Authentication and User Status Check ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserStatus('unauthenticated');
        router.replace('/login'); // Redirect unauthenticated users
        return;
      }
      setCurrentUser(user);

      // Fetch user's status from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setUserStatus(userData.status);
        if (userData.status !== 'approved') {
          // Redirect users who are not 'approved' to the pending page
          router.replace('/pending-review');
        }
      } else {
        console.warn("Firestore user document not found for logged-in user on pending-review page:", user.uid);
        setUserStatus('unauthenticated');
        router.replace('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // --- Form Field Update Handler ---
  const upd = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // --- Live Preview Function ---
  const generatePreview = useCallback((dataToPreview) => {
    const { headline, location, date, what, who, when, where, why, how, website } = dataToPreview;

    let previewText = `**${headline || '[Headline]'}**\n\n`;
    previewText += `${location || '[Location]'} : ${date || '[Date]'}\n\n`;

    if (what) previewText += `**What:** ${what}\n\n`;
    if (who) previewText += `**Who:** ${who}\n\n`;
    if (when) previewText += `**When:** ${when}\n\n`;
    if (where) previewText += `**Where:** ${where}\n\n`;
    if (why) previewText += `**Why:** ${why}\n\n`;
    if (how) previewText += `**How:** ${how}\n\n`;
    if (website) previewText += `🌐 Visit: ${website}\n\n`;

    return previewText;
  }, []);

  // --- Validate all required fields for form submission ---
  const isFormValid = () => {
    const { headline, date, location, what, who, when, where, why, how, website } = form;
    return (
      headline.trim() !== '' &&
      date.trim() !== '' &&
      location.trim() !== '' &&
      what.trim() !== '' &&
      who.trim() !== '' &&
      when.trim() !== '' &&
      where.trim() !== '' &&
      why.trim() !== '' &&
      how.trim() !== '' &&
      website.trim() !== ''
    );
  };

  // --- Submit Press Release (Without Evidence) ---
  async function handleSubmit(e) {
    e.preventDefault();
    setErrMsg('');
    setOkMsg('');

    if (!currentUser || userStatus !== 'approved') {
      setErrMsg('You are not authorized to submit press releases.');
      return;
    }

    // Check if all fields are valid before proceeding with submission
    if (!isFormValid()) {
      setErrMsg('Please fill in all required fields to submit.');
      return;
    }

    // `wc` function is now correctly defined and accessible
    const words =
      wc(form.what) + wc(form.who) + wc(form.when) +
      wc(form.where) + wc(form.why) + wc(form.how);

    if (words > 1000) {
      setErrMsg(`Word count ${words} exceeds limit (1000).`);
      return;
    }

    try {
      // No file upload logic here

      // Save press release data to Firestore
      await addDoc(collection(db, 'press_releases'), {
        ...form,
        userId: currentUser.uid,
        email: currentUser.email,
        // Removed evidenceUrl and evidenceHash fields
        status: 'pending_moderation', // Initial status after submission
        createdAt: serverTimestamp(),
      });

      setOkMsg('Press release submitted successfully! Awaiting moderation.');
      // Reset form fields
      setForm({ headline: '', date: '', location: '', what: '', who: '', when: '', where: '', why: '', how: '', website: '' });
    } catch (error) {
      console.error('Submit error:', error);
      setErrMsg(`Submission failed: ${error.message}`);
    }
  }

  // --- Loading / Access Denied States ---
  if (userStatus === 'loading' || !currentUser) {
    return (
      <div style={styles.loadingContainer}>
        <p>Loading user session...</p>
      </div>
    );
  }

  if (userStatus === 'unauthenticated') {
    return null; // Redirect handled by useEffect
  }

  if (userStatus === 'pending_review' || userStatus === 'rejected') {
    return (
      <main style={styles.accessDeniedMain}>
        <h1 style={styles.accessDeniedHeading}>Access Denied</h1>
        <p style={styles.accessDeniedMessage}>
          Your account status is: <strong>{userStatus.replace('_', ' ')}</strong>.
          You must be an approved member to submit press releases.
        </p>
        <Link href="/pending-review" style={styles.linkButton}>Go to Account Status</Link>
        <Link href="/" style={styles.linkButton}>Back to Home</Link>
      </main>
    );
  }

  // --- Main Dual-Pane Editor UI ---
  return (
    <div style={styles.container}>
      <Head>
        <title>Submit Press Release</title>
      </Head>

      <main style={styles.main}>
        <h1 style={styles.heading}>Submit Press Release</h1>
        <p style={styles.subheading}>
          Signed in as <strong>{currentUser?.email}</strong>
        </p>

        <div style={styles.mainContentWrapper}>
          {/* LEFT – form */}
          <div style={styles.formSection}>
            <form onSubmit={handleSubmit} style={styles.form}>
              {/* headline / date / city */}
              <div style={styles.formGroup}>
                <label style={styles.label}>📢 Headline</label>
                <input
                  required
                  value={form.headline}
                  onChange={upd('headline')}
                  placeholder="Mitumba Sector Emerges as Key Revenue Earner for Kenya"
                  style={styles.input}
                />
              </div>

              <div style={styles.flexGroup}>
                <div style={styles.formGroupHalf}>
                  <label style={styles.label}>🏙️ City / Town</label>
                  <input
                    required
                    value={form.location}
                    onChange={upd('location')}
                    placeholder="Nairobi"
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroupHalf}>
                  <label style={styles.label}>📅 Date</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={upd('date')}
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Ws + H */}
              {(['what', 'who', 'when', 'where', 'why', 'how']).map(f => (
                <div key={f} style={styles.formGroup}>
                  <label style={styles.label}>{f.charAt(0).toUpperCase() + f.slice(1)}</label>
                  <textarea
                    required
                    rows={3}
                    value={form[f]}
                    onChange={upd(f)}
                    placeholder={
                      f === 'what' ? 'What is happening? (Main body, max 1000 words)' :
                      f === 'who' ? 'Who is involved?' :
                      f === 'when' ? 'When did/will it occur?' :
                      f === 'where' ? 'Where is this taking place?' :
                      f === 'why' ? 'Why is this important?' :
                      'How is it being done?'
                    }
                    style={styles.textarea}
                  />
                </div>
              ))}

              {/* website */}
              <div style={styles.formGroup}>
                <label style={styles.label}>🌐 Organization Website</label>
                <input
                  required
                  type="url"
                  value={form.website}
                  onChange={upd('website')}
                  placeholder="https://www.organization.com"
                  style={styles.input}
                />
              </div>

              {/* REMOVED EVIDENCE INPUT SECTION ENTIRELY */}
              {/*
              <div style={styles.formGroup}>
                <label style={styles.label}>📎 Evidence (PDF/JPG/PNG)</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setEvidence(e.target.files?.[0] || null)}
                  style={styles.fileInput}
                />
                {evidence && <p style={styles.fileNameText}>Selected: {evidence.name}</p>}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <p style={styles.progressText}>Uploading: {uploadProgress}%</p>
                )}
              </div>
              */}

              {errMsg && <p style={styles.errorText}>{errMsg}</p>}
              {okMsg && <p style={styles.successText}>{okMsg}</p>}

              <div style={styles.actionButtons}>
                <button
                  type="submit"
                  disabled={!isFormValid()} // Button is disabled if form is not valid
                  style={!isFormValid() ? { ...styles.submitButton, ...styles.submitButtonDisabled } : styles.submitButton}
                >
                  Submit Press Release
                </button>
                <button
                  type="button"
                  onClick={() => window.print()} // Direct print
                  style={styles.printButton}
                >
                  Print / PDF
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT – preview */}
          <div style={styles.previewSection}>
            <h2 style={styles.previewHeading}>Press Release Preview</h2>
            <div style={styles.prose}>
              <h3 style={styles.previewHeadline}>
                {form.headline || <em>(Headline)</em>}
              </h3>

              <p style={styles.previewMeta}>
                📍 {form.location || <em>[City]</em>} : {form.date || <em>[Date]</em>}
              </p>

              {form.what && <p><strong>What:</strong> {form.what}</p>}
              {form.who && <p><strong>Who:</strong> {form.who}</p>}
              {form.when && <p><strong>When:</strong> {form.when}</p>}
              {form.where && <p><strong>Where:</strong> {form.where}</p>}
              {form.why && <p><strong>Why:</strong> {form.why}</p>}
              {form.how && <p><strong>How:</strong> {form.how}</p>}

              {form.website && (
                <p style={styles.previewWebsite}>
                  🌐 Visit: {form.website}
                </p>
              )}
              {/* Removed evidence preview */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- Inline Styles ---
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
    maxWidth: '1200px', // Adjusted for dual-pane
  },
  accessDeniedMain: { // Styles for access denied screen
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    width: '100%',
    maxWidth: '600px',
    margin: 'auto', // Center it
  },
  accessDeniedHeading: {
    color: '#dc3545', // Red color for denial
    marginBottom: '20px',
    fontSize: '2.5em',
  },
  accessDeniedMessage: {
    fontSize: '1.1em',
    color: '#555',
    marginBottom: '30px',
    lineHeight: '1.6',
  },
  linkButton: { // Reused from pending-review for consistency
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
  linkButtonHover: {
    backgroundColor: '#0056b3',
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
  mainContentWrapper: {
    display: 'flex',
    gap: '40px', // Space between form and preview
    width: '100%',
    justifyContent: 'space-between',
    flexWrap: 'wrap', // Allow wrapping on smaller screens
  },
  formSection: {
    flex: '1',
    minWidth: '400px', // Minimum width for the form
    textAlign: 'left',
  },
  previewSection: {
    flex: '1',
    minWidth: '400px', // Minimum width for the preview
    textAlign: 'left',
    backgroundColor: '#f9f9f9',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '25px',
    boxSizing: 'border-box',
    // Hide preview on print
    '@media print': {
        display: 'none',
    },
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    marginBottom: '10px',
  },
  flexGroup: {
    display: 'flex',
    gap: '20px',
    width: '100%',
  },
  formGroupHalf: {
    flex: '1',
    marginBottom: '10px',
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
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '1em',
    minHeight: '80px',
    resize: 'vertical',
    boxSizing: 'border-box',
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
  actionButtons: {
    display: 'flex',
    gap: '15px',
    marginTop: '20px',
    justifyContent: 'flex-start', // Align to left within form section
  },
  submitButton: {
    backgroundColor: '#0070f3',
    color: '#ffffff',
    padding: '12px 25px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1.1em',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease',
  },
  submitButtonHover: {
    backgroundColor: '#005bb5',
  },
  submitButtonDisabled: { // New style for disabled button
    backgroundColor: '#a0aec0', // Grayed out color
    cursor: 'not-allowed',
  },
  printButton: {
    backgroundColor: '#6c757d', // Grey for print button
    color: '#ffffff',
    padding: '12px 25px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1.1em',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease',
  },
  printButtonHover: {
    backgroundColor: '#5a6268',
  },
  prose: { // Mimics Tailwind's @tailwindcss/typography plugin for basic markdown rendering
    // Add basic styling for h3, p, strong, em within the preview
    '& h3': {
        fontSize: '1.5em',
        fontWeight: 'bold',
        borderBottom: '1px solid #eee',
        paddingBottom: '8px',
        marginBottom: '15px',
    },
    '& p': {
        lineHeight: '1.6',
        marginBottom: '10px',
    },
    '& strong': {
        fontWeight: 'bold',
    },
    '& em': {
        fontStyle: 'italic',
        color: '#888',
    },
  },
  previewHeading: {
    fontSize: '1.8em',
    color: '#333',
    marginBottom: '15px',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
  },
  previewHeadline: {
    fontSize: '1.8em',
    fontWeight: 'bold',
    borderBottom: '1px solid #eee',
    paddingBottom: '8px',
    marginBottom: '15px',
  },
  previewMeta: {
    fontStyle: 'italic',
    color: '#666',
    marginBottom: '20px',
  },
  previewWebsite: {
    marginTop: '25px',
    fontSize: '0.9em',
    color: '#666',
  },
};
