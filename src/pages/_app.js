// src/pages/_app.js
import '@/styles/globals.css'; // Import your global CSS (essential)
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth'; // Import onAuthStateChanged
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions
import { auth, db } from '@/firebase/init'; // Import auth and db from your Firebase init file

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserStatus, setCurrentUserStatus] = useState('loading'); // 'loading', 'unauthenticated', 'pending_review', 'approved'

  // Global authentication state listener
  useEffect(() => {
    // This console.log should now appear in the browser console on every page load
    console.log("App Component Started - Checking Firebase Auth State.");

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("onAuthStateChanged triggered. User:", user); // LOG: Auth state change

      if (!user) {
        setCurrentUser(null);
        setCurrentUserStatus('unauthenticated');
        // If on a restricted page and not logged in, redirect to login
        if (router.pathname !== '/login' && router.pathname !== '/signup') {
          router.replace('/login');
        }
        return;
      }

      setCurrentUser(user);
      console.log("User logged in. UID:", user.uid); // LOG: User UID

      // Fetch user's status from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      try {
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setCurrentUserStatus(userData.status);
          console.log("User status from Firestore:", userData.status); // LOG: User status
          // If user is pending/rejected and tries to access restricted pages, redirect
          if (userData.status !== 'approved' && (router.pathname === '/add-press-release' || router.pathname === '/my-press-releases')) {
            router.replace('/pending-review');
          }
        } else {
          // User exists in Auth but no Firestore document (e.g., new signup without full doc creation)
          setCurrentUserStatus('pending_review');
          console.warn("Firestore user document not found. Setting status to pending_review."); // LOG: User doc not found
          if (router.pathname === '/add-press-release' || router.pathname === '/my-press-releases') {
            router.replace('/pending-review');
          }
        }
      } catch (error) {
        console.error("Error fetching user status in _app.js:", error); // LOG: Error fetching status
        setCurrentUserStatus('error');
        router.replace('/login'); // Redirect on severe error
      }
    });

    return () => unsubscribe(); // Cleanup the listener on unmount
  }, [router]); // Depend on router to re-evaluate redirects if path changes

  // Pass currentUser and currentUserStatus to all pages as props,
  // or use React Context for global access if many components need it.
  const modifiedPageProps = {
    ...pageProps,
    currentUser,
    currentUserStatus,
  };

  // Render the current page component
  return <Component {...modifiedPageProps} />;
}

export default MyApp;
