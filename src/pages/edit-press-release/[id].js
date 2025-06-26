// src/pages/edit-press-release/[id].js
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '@/firebase/init.js'; // Firebase auth and db instances
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore'; // Firestore functions for doc operations
import { onAuthStateChanged } from 'firebase/auth'; // For checking auth state

export default function EditPressReleasePage() {
  const router = useRouter();
  const { id } = router.query; // Get the dynamic ID from the URL
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [pressReleaseData, setPressReleaseData] = useState({
    headline: '',
    location: '',
    date: '',
    what: '',
    who: '',
    when: '',
    where: '',
    why: '',
    how: '',
    website: '',
    userId: '', // Will be set from fetched data
  });
  const [loadingPressRelease, setLoadingPressRelease] = useState(true);
  const [error, setError] = useState(null);
  const [formStatus, setFormStatus] = useState(''); // For success/error messages after submission
  const [livePreview, setLivePreview] = useState('');

  // Authentication Check
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

  // Function to generate live preview (Declared before useEffect that uses it)
  const generatePreview = useCallback((dataToPreview) => {
    const { headline, location, date, what, who, when, where, why, how, website } = dataToPreview;

    let previewText = `**${headline || '[Headline]'}**\n\n`;
    previewText += `${location || '[Location]'} — ${date || '[Date]'}\n\n`;

    if (what) previewText += `**What:** ${what}\n\n`;
    if (who) previewText += `**Who:** ${who}\n\n`;
    if (when) previewText += `**When:** ${when}\n\n`;
    if (where) previewText += `**Where:** ${where}\n\n`;
    if (why) previewText += `**Why:** ${why}\n\n`;
    if (how) previewText += `**How:** ${how}\n\n`;
    if (website) previewText += `For more information, visit: ${website}\n\n`;

    return previewText;
  }, []);


  // Fetch existing press release data
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
          const data = docSnap.data();
          // Check ownership before setting data
          if (user.uid !== data.userId) {
            setError("You are not authorized to edit this press release.");
            setLoadingPressRelease(false);
            return;
          }

          // Set form fields with existing data
          setPressReleaseData({
            headline: data.headline || '',
            location: data.location || '',
            date: data.date || '',
            what: data.what || '',
            who: data.who || '',
            when: data.when || '',
            where: data.where || '',
            why: data.why || '',
            how: data.how || '',
            website: data.website || '',
            userId: data.userId, // Store userId from fetched data
          });
          setLivePreview(generatePreview(data)); // Generate initial preview
        } else {
          setError("Press release not found.");
        }
      } catch (err) {
        console.error("Error fetching press release:", err);
        setError("Failed to load press release details for editing.");
      } finally {
        setLoadingPressRelease(false);
      }
    };

    fetchPressRelease();
  }, [id, user, generatePreview]); // generatePreview is correctly in the dependency array

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    const newData = { ...pressReleaseData, [name]: value };
    setPressReleaseData(newData);
    setLivePreview(generatePreview(newData)); // Update preview on change
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('Saving...');

    if (!user || user.uid !== pressReleaseData.userId) {
      setFormStatus('Error: You are not authorized to edit this press release.');
      return;
    }

    try {
      // Remove userId from data before sending to Firestore, as it's already there
      const { userId, ...dataToUpdate } = pressReleaseData;

      // Update existing document in Firestore
      const docRef = doc(db, "press_releases", id);
      await updateDoc(docRef, {
        ...dataToUpdate,
        updatedAt: Timestamp.now(), // Add an updatedAt timestamp
      });

      setFormStatus('Press release updated successfully!');
      // Optionally, redirect after a short delay
      setTimeout(() => {
        router.push(`/press-releases/${id}`); // Go back to detail page
      }, 1500);
    } catch (err) {
      console.error("Error updating document:", err);
      setFormStatus(`Error: ${err.message}`);
    }
  };

  if (loadingAuth || loadingPressRelease) {
    return (
      <div style={styles.loadingContainer}>
        <p>Loading {loadingAuth ? 'user session' : 'press release data'}...</p>
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

  return (
    <div style={styles.container}>
      <Head>
        <title>Edit Press Release</title>
      </Head>

      <main style={styles.main}>
        <h1 style={styles.heading}>Edit Press Release</h1>
        <p style={styles.subheading}>Modify the details of your press release below.</p>

        {/* New wrapper for side-by-side layout */}
        <div style={styles.mainContentWrapper}>
          {/* Form Section */}
          <div style={styles.formSection}>
            <form onSubmit={handleSubmit} style={styles.form}>
              {/* Headline */}
              <div style={styles.formGroup}>
                <label htmlFor="headline" style={styles.label}>Headline</label>
                <input
                  type="text"
                  id="headline"
                  name="headline"
                  value={pressReleaseData.headline}
                  onChange={handleChange}
                  required
                  style={styles.input}
                  placeholder="e.g., Company X Launches New Product"
                />
              </div>

              {/* Location and Date */}
              <div style={styles.flexGroup}>
                <div style={styles.formGroupHalf}>
                  <label htmlFor="location" style={styles.label}>Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={pressReleaseData.location}
                    onChange={handleChange}
                    required
                    style={styles.input}
                    placeholder="e.g., New York, NY"
                  />
                </div>
                <div style={styles.formGroupHalf}>
                  <label htmlFor="date" style={styles.label}>Date</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={pressReleaseData.date}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  />
                </div>
              </div>

              {/* 5Ws and H */}
              <div style={styles.formGroup}>
                <label htmlFor="what" style={styles.label}>What (Main Body - max 1000 words)</label>
                <textarea
                  id="what"
                  name="what"
                  value={pressReleaseData.what}
                  onChange={handleChange}
                  required
                  style={{ ...styles.textarea, minHeight: '150px' }}
                  placeholder="Describe the main subject of your press release."
                  maxLength={6000} // Approximately 1000 words
                ></textarea>
              </div>

              <div style={styles.formGroup}>
                <label htmlFor="who" style={styles.label}>Who (Involved parties)</label>
                <textarea
                  id="who"
                  name="who"
                  value={pressReleaseData.who}
                  onChange={handleChange}
                  style={styles.textarea}
                  placeholder="Who are the key people or organizations involved?"
                  maxLength={1000}
                ></textarea>
              </div>

              <div style={styles.formGroup}>
                <label htmlFor="when" style={styles.label}>When (Relevant dates/times)</label>
                <textarea
                  id="when"
                  name="when"
                  value={pressReleaseData.when}
                  onChange={handleChange}
                  style={styles.textarea}
                  placeholder="When did or will this event/development occur?"
                  maxLength={500}
                ></textarea>
              </div>

              <div style={styles.formGroup}>
                <label htmlFor="where" style={styles.label}>Where (Location details)</label>
                <textarea
                  id="where"
                  name="where"
                  value={pressReleaseData.where}
                  onChange={handleChange}
                  style={styles.textarea}
                  placeholder="Where did or will this take place?"
                  maxLength={500}
                ></textarea>
              </div>

              <div style={styles.formGroup}>
                <label htmlFor="why" style={styles.label}>Why (Significance/Purpose)</label>
                <textarea
                  id="why"
                  name="why"
                  value={pressReleaseData.why}
                  onChange={handleChange}
                  style={styles.textarea}
                  placeholder="Why is this important? What is the purpose or impact?"
                  maxLength={1000}
                ></textarea>
              </div>

              <div style={styles.formGroup}>
                <label htmlFor="how" style={styles.label}>How (Process/Method)</label>
                <textarea
                  id="how"
                  name="how"
                  value={pressReleaseData.how}
                  onChange={handleChange}
                  style={styles.textarea}
                  placeholder="How did this happen or how will it be achieved?"
                  maxLength={1000}
                ></textarea>
              </div>

              {/* Website/Link */}
              <div style={styles.formGroup}>
                <label htmlFor="website" style={styles.label}>Related Website (Optional)</label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={pressReleaseData.website}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., https://www.yourcompany.com"
                />
              </div>

              <button type="submit" style={styles.submitButton}>Update Press Release</button>
            </form>
            {formStatus && <p style={styles.formStatus}>{formStatus}</p>}
          </div>

          {/* Live Preview Section */}
          <div style={styles.previewSection}>
            <h2 style={styles.previewHeading}>Live Preview</h2>
            <pre style={styles.previewText}>{livePreview}</pre>
          </div>
        </div>

        <p style={styles.backLinkContainer}>
          <Link href={`/press-releases/${id}`} style={styles.link}>Back to Press Release Details</Link>
        </p>
      </main>
    </div>
  );
}

// Basic inline styles
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
    maxWidth: '1200px', // Increased max-width to accommodate side-by-side
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
  // New styles for side-by-side layout
  mainContentWrapper: {
    display: 'flex',
    gap: '40px', // Space between the form and the preview
    width: '100%',
    justifyContent: 'space-between', // Distribute space
    flexWrap: 'wrap', // Allow wrapping on smaller screens
    marginTop: '30px',
  },
  formSection: {
    flex: '1', // Take up available space
    minWidth: '350px', // Minimum width for the form before wrapping
    textAlign: 'left', // Keep form labels left-aligned
  },
  previewSection: {
    flex: '1', // Take up available space
    minWidth: '350px', // Minimum width for the preview before wrapping
    textAlign: 'left',
    backgroundColor: '#f9f9f9',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '25px',
    boxSizing: 'border-box', // Include padding in width
  },
  // End new styles

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    textAlign: 'left', // This ensures labels are left-aligned within the formSection
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
    boxSizing: 'border-box', // Include padding in width
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
    marginTop: '20px',
  },
  submitButtonHover: {
    backgroundColor: '#005bb5',
  },
  formStatus: {
    marginTop: '20px',
    fontSize: '1em',
    fontWeight: 'bold',
    color: '#0070f3', // Can be dynamically changed for error/success
  },
  // The original previewContainer styles are now mostly absorbed by previewSection
  previewContainer: {
    marginTop: '0px', // Ensure no extra top margin if using previewSection
  },
  previewHeading: {
    fontSize: '1.8em',
    color: '#333',
    marginBottom: '15px',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
  },
  previewText: {
    whiteSpace: 'pre-wrap', // Preserve whitespace and line breaks
    wordWrap: 'break-word', // Break long words
    fontFamily: 'monospace',
    fontSize: '0.9em',
    lineHeight: '1.6',
    color: '#555',
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: '15px',
    fontSize: '1em',
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