import OldLoginForm from '@/components/auth/OldLoginForm';
import '@/styles/old-design.css';

export default function LoginPage() {
  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#f3f3f3',
      fontFamily: '"Bai Jamjuree", sans-serif'
    }}>
      <OldLoginForm />
    </div>
  );
}
