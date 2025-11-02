// ================================================================
// 🐛 DEBUG: Componente temporal para ver el estado de autenticación
// ================================================================
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { ROLE_PERMISSIONS } from '../../constants/permissions';

export const DebugAuth = () => {
  const { user, role, loading } = useAuth();
  const { getUserLevel, checkPermission } = usePermissions();

  if (!user) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      background: '#000',
      color: '#0f0',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div>🐛 DEBUG INFO:</div>
      <div>User: {user.email}</div>
      <div>Role: {role || 'NULL'}</div>
      <div>Level: {getUserLevel()}</div>
      <div>Loading: {loading ? 'YES' : 'NO'}</div>
      <div>---</div>
      <div>Can Dashboard (10): {checkPermission(10) ? '✅' : '❌'}</div>
      <div>Can Ventas (30): {checkPermission(30) ? '✅' : '❌'}</div>
      <div>Can Admin (80): {checkPermission(80) ? '✅' : '❌'}</div>
      <div>Can Config (100): {checkPermission(100) ? '✅' : '❌'}</div>
      <div>---</div>
      <div>Roles Map: {JSON.stringify(ROLE_PERMISSIONS)}</div>
    </div>
  );
};
