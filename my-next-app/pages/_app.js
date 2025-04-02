import { useEffect } from 'react';
import { connectToDatabases } from '../lib/db';
import '../styles/Home.module.css';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Initialize database connections when app loads
    connectToDatabases();
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;