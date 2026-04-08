import CSSInheritanceTest from './CSSInheritanceTest';

export default function App() {
  return (
    <scroll-view
      scroll-orientation="vertical"
      style={{ width: '100%', height: '100%', backgroundColor: '#f5f5f5', padding: '16px' }}
    >
      <text style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#111' }}>
        React CSS Inheritance Test
      </text>
      <CSSInheritanceTest />
    </scroll-view>
  );
}
