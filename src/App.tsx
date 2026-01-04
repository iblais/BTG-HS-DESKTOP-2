export default function App() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#FF00FF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '20px',
      color: 'white',
      fontSize: '24px',
      fontWeight: 'bold',
      zIndex: 999999,
      padding: '20px',
    }}>
      <div>REACT IS WORKING</div>
      <div>Width: {window.innerWidth}px</div>
      <div>Height: {window.innerHeight}px</div>
      <div>Time: {new Date().toLocaleTimeString()}</div>
      <button
        onClick={() => alert('JavaScript is working!')}
        style={{
          padding: '20px 40px',
          fontSize: '20px',
          backgroundColor: '#00FF00',
          border: 'none',
          borderRadius: '8px',
          color: 'black',
          fontWeight: 'bold',
          cursor: 'pointer',
        }}
      >
        TAP ME
      </button>
    </div>
  );
}
