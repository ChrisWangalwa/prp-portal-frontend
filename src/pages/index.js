// src/pages/index.js
import Head from 'next/head';

export default function HomePage() {
  return (
    <div>
      <Head>
        <title>Press Release Portal (PRP)</title>
        <meta name="description" content="Welcome to your new Press Release Portal!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: 'sans-serif',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#333' }}>
          Welcome to the <span style={{ color: '#0070f3' }}>Press Release Portal (PRP)</span>!
        </h1>
        <p style={{ fontSize: '1.2em', color: '#555' }}>
          Your journey to secure, scalable, and community-powered PR distribution begins here.
        </p>
      </main>
    </div>
  );
}