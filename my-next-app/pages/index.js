import { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';

export default function DatabaseManager() {
  const [state, setState] = useState({
    loading: false, // Initialize as false to match server render
    connections: { production: false, development: false },
    collections: { production: [], development: [] },
    availableColumns: [],
    selectedColumns: [],
    cloneResult: null,
    error: null,
    operationInProgress: false
  });

  // Check database connections
  const checkConnections = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await fetch('/api/db/check-connections');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setState(prev => ({
        ...prev,
        connections: data,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  // Fetch collections from both databases
  const fetchCollections = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const [prodResponse, devResponse] = await Promise.all([
        fetch('/api/db/list-collections?db=production'),
        fetch('/api/db/list-collections?db=development')
      ]);

      if (!prodResponse.ok || !devResponse.ok) {
        throw new Error('Failed to fetch collections');
      }

      const [prodData, devData] = await Promise.all([
        prodResponse.json(),
        devResponse.json()
      ]);

      setState(prev => ({
        ...prev,
        collections: {
          production: prodData.collections || [],
          development: devData.collections || []
        },
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  // Fetch available columns from production database
  const fetchAvailableColumns = async () => {
    try {
      const response = await fetch('/api/db/get-sample-columns');
      if (!response.ok) {
        throw new Error('Failed to fetch available columns');
      }
      const data = await response.json();
      setState(prev => ({
        ...prev,
        availableColumns: data.columns || []
      }));
    } catch (error) {
      console.error('Failed to fetch columns:', error);
      setState(prev => ({
        ...prev,
        error: error.message
      }));
    }
  };

  // Clone selected columns from production to development
  const cloneSelectedColumns = async () => {
    if (state.selectedColumns.length === 0) {
      setState(prev => ({ ...prev, error: 'Please select at least one column' }));
      return;
    }

    try {
      setState(prev => ({ 
        ...prev, 
        operationInProgress: true,
        error: null,
        cloneResult: null 
      }));
      
      const response = await fetch('/api/db/clone-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          columns: state.selectedColumns
        })
      });

      if (!response.ok) {
        throw new Error(`Clone failed with status: ${response.status}`);
      }

      const result = await response.json();
      await fetchCollections(); // Refresh collections after clone

      setState(prev => ({
        ...prev,
        cloneResult: result,
        operationInProgress: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        operationInProgress: false,
        error: error.message
      }));
    }
  };

  // Toggle column selection
  const toggleColumnSelection = (column) => {
    setState(prev => {
      const newSelected = prev.selectedColumns.includes(column)
        ? prev.selectedColumns.filter(c => c !== column)
        : [...prev.selectedColumns, column];
      return { ...prev, selectedColumns: newSelected };
    });
  };

  // Select all columns
  const selectAllColumns = () => {
    setState(prev => ({
      ...prev,
      selectedColumns: [...prev.availableColumns]
    }));
  };

  // Deselect all columns
  const deselectAllColumns = () => {
    setState(prev => ({
      ...prev,
      selectedColumns: []
    }));
  };

  // Initial data load - runs only on client side
  useEffect(() => {
    const initialize = async () => {
      setState(prev => ({ ...prev, loading: true }));
      await checkConnections();
      await fetchCollections();
      await fetchAvailableColumns();
      setState(prev => ({ ...prev, loading: false }));
    };
    initialize();
  }, []);

  return (
    <div className={styles.container}>
      <h1>Database Management</h1>
      
      {/* Error display */}
      {state.error && (
        <div className={styles.error}>
          <p>{state.error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {/* Loading indicator */}
      {state.loading && (
        <div className={styles.loading}>Loading data...</div>
      )}

      {/* Connection status section */}
      <section className={styles.section}>
        <h2>Connection Status</h2>
        <div className={styles.status}>
          <p>
            Production: 
            <span className={state.connections.production ? styles.connected : styles.disconnected}>
              {state.connections.production ? ' ✅ Connected' : ' ❌ Disconnected'}
            </span>
          </p>
          <p>
            Development: 
            <span className={state.connections.development ? styles.connected : styles.disconnected}>
              {state.connections.development ? ' ✅ Connected' : ' ❌ Disconnected'}
            </span>
          </p>
          <button 
            onClick={checkConnections}
            disabled={state.loading || state.operationInProgress}
          >
            Refresh Status
          </button>
        </div>
      </section>

      {/* Collections section */}
      <section className={styles.section}>
        <h2>Collections</h2>
        <div className={styles.collections}>
          <div>
            <h3>Production</h3>
            {state.collections.production.length > 0 ? (
              <ul>
                {state.collections.production.map((col, i) => (
                  <li key={`prod-${i}`}>{col.name}</li>
                ))}
              </ul>
            ) : (
              <p>No collections found</p>
            )}
          </div>
          <div>
            <h3>Development</h3>
            {state.collections.development.length > 0 ? (
              <ul>
                {state.collections.development.map((col, i) => (
                  <li key={`dev-${i}`}>{col.name}</li>
                ))}
              </ul>
            ) : (
              <p>No collections found</p>
            )}
          </div>
        </div>
        <button 
          onClick={fetchCollections}
          disabled={state.loading || state.operationInProgress}
        >
          Refresh Collections
        </button>
      </section>

      {/* Column selection section */}
      <section className={styles.section}>
        <h2>Column Selection</h2>
        <div className={styles.columnControls}>
          <button 
            onClick={selectAllColumns}
            disabled={state.availableColumns.length === 0 || state.operationInProgress}
          >
            Select All
          </button>
          <button 
            onClick={deselectAllColumns}
            disabled={state.selectedColumns.length === 0 || state.operationInProgress}
          >
            Deselect All
          </button>
        </div>
        
        <div className={styles.columnGrid}>
          {state.availableColumns.length > 0 ? (
            state.availableColumns.map(column => (
              <label key={column} className={styles.columnItem}>
                <input
                  type="checkbox"
                  checked={state.selectedColumns.includes(column)}
                  onChange={() => toggleColumnSelection(column)}
                  disabled={state.operationInProgress}
                />
                {column}
              </label>
            ))
          ) : (
            <p>No columns available</p>
          )}
        </div>
      </section>

      {/* Data operations section */}
      <section className={styles.section}>
        <h2>Data Operations</h2>
        <button 
          onClick={cloneSelectedColumns}
          disabled={
            state.operationInProgress || 
            !state.connections.production || 
            state.selectedColumns.length === 0
          }
          className={styles.cloneButton}
        >
          {state.operationInProgress ? 'Cloning...' : 'Clone Selected Columns'}
        </button>
        {state.cloneResult && (
          <div className={styles.success}>
            <p>Successfully cloned {state.cloneResult.count} documents</p>
            <p>Columns cloned: {state.cloneResult.columnsCloned.join(', ')}</p>
          </div>
        )}
      </section>
    </div>
  );
}