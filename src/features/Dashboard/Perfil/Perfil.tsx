import React, { useState, useEffect } from 'react';
import { supabase } from '../../../api/supabaseClient';
import { UsuarioDataType } from '../../../types';
import { FaUser, FaEdit, FaSave, FaCamera, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaUserTag } from 'react-icons/fa';
import { message } from 'antd';

const Perfil: React.FC = () => {
  const [userData, setUserData] = useState<UsuarioDataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<UsuarioDataType>>({});

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Obtener datos del perfil desde la tabla perfil_usuario
        const { data: profile, error } = await supabase
          .from('perfil_usuario')
          .select('*')
          .eq('id_perfil', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error;
        }

        if (profile) {
          setUserData(profile);
          setFormData(profile);
        } else {
          // Si no existe perfil, crear uno básico
          const basicProfile: UsuarioDataType = {
            id_perfil: user.id,
            primer_nombre: '',
            segundo_nombre: null,
            primer_apellido: '',
            segundo_apellido: null,
            telefono: null,
            direccion: null,
            fecha_nacimiento: null,
            fecha_registro: user.created_at,
            estado: 'activo',
            username: user.email?.split('@')[0] || null,
            avatar_url: null,
            ultimo_acceso: user.last_sign_in_at || null
          };
          setUserData(basicProfile);
          setFormData(basicProfile);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      message.error('Error al cargar el perfil de usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UsuarioDataType, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!userData) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('perfil_usuario')
        .upsert({
          ...formData,
          id_perfil: userData.id_perfil,
          ultimo_acceso: new Date().toISOString()
        });

      if (error) throw error;

      setUserData(formData as UsuarioDataType);
      setEditing(false);
      message.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(userData || {});
    setEditing(false);
  };

  const getInitials = (user: UsuarioDataType | null) => {
    if (!user) return 'U';
    const firstName = user.primer_nombre || '';
    const lastName = user.primer_apellido || '';
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return firstName[0]?.toUpperCase() || lastName[0]?.toUpperCase() || 'U';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Mi Perfil</h1>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaEdit size={16} />
                Editar Perfil
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <FaSave size={16} />
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {/* Profile Header */}
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              {userData?.avatar_url ? (
                <img
                  src={userData.avatar_url}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                  {getInitials(userData)}
                </div>
              )}
              {editing && (
                <>
                  <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors">
                    <FaCamera size={12} />
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute bottom-0 right-0 opacity-0 w-8 h-8 cursor-pointer"
                    style={{ zIndex: 2 }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !userData) return;

                      try {
                        // Generate a user-scoped filename to avoid collisions and make paths predictable
                        const ext = file.name.split('.').pop();
                        const { data: userInfo } = await supabase.auth.getUser();
                        const userId = userInfo?.user?.id;
                        if (!userId) {
                          message.error('No se encontró la sesión de usuario. Vuelve a iniciar sesión.');
                          return;
                        }

                        const fileName = `${userId}/avatar-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

                        // Log file information to ensure browser reports correct mime type
                        console.debug('avatar file info:', { name: file.name, type: file.type, size: file.size });
                        console.debug('avatar file diagnostics:', {
                          constructor: file?.constructor?.name,
                          toString: Object.prototype.toString.call(file),
                          isFile: file instanceof File,
                          isBlob: file instanceof Blob
                        });

                        // Ensure we upload raw binary: read ArrayBuffer and wrap in a Blob with correct MIME
                        const arrayBuffer = await file.arrayBuffer();
                        const blob = new Blob([arrayBuffer], { type: file.type || 'application/octet-stream' });
                        const { data: upData, error: uploadError } = await supabase.storage.from('user-img').upload(fileName, blob, { upsert: true, contentType: file.type });
                        if (uploadError) {
                          console.error('Error subiendo avatar:', uploadError);
                          message.error('Error subiendo avatar: ' + (uploadError.message || JSON.stringify(uploadError)));
                          return;
                        }

                        const uploadedPath = upData?.path;
                        if (!uploadedPath) {
                          console.error('Upload succeeded but no path returned:', upData);
                          message.error('Error: no se obtuvo la ruta del archivo subido.');
                          return;
                        }

                        const publicUrl = supabase.storage.from('user-img').getPublicUrl(uploadedPath).data.publicUrl;
                        console.debug('user-img upload:', { fileName, uploadedPath, publicUrl, upData });

                        // Diagnostic checks: metadata, list files in user's prefix, and HTTP fetch of publicUrl
                        try {
                          // Try to download the file to confirm existence (this will return a Blob if present)
                          const { data: downloadData, error: downloadError } = await supabase.storage.from('user-img').download(uploadedPath);
                          if (downloadError) {
                            console.debug('download error for uploadedPath:', { uploadedPath, downloadError });
                          } else {
                            console.debug('download OK (blob):', { uploadedPath, size: downloadData?.size });
                          }
                        } catch (e) {
                          console.debug('download threw:', e);
                        }

                        try {
                          const { data: listData, error: listError } = await supabase.storage.from('user-img').list(userId + '/');
                          if (listError) {
                            console.debug('list(userId) error:', listError);
                          } else {
                            console.debug('list(userId) result count:', Array.isArray(listData) ? listData.length : listData, listData);
                          }
                        } catch (e) {
                          console.debug('list(userId) threw:', e);
                        }

                        try {
                          const res = await fetch(publicUrl, { method: 'HEAD' });
                          console.debug('fetch publicUrl HEAD status:', res.status, publicUrl);
                        } catch (e) {
                          console.debug('fetch(publicUrl) threw:', e, publicUrl);
                        }

                        // Build a safe, complete profile payload (avoid NOT NULL violations)
                        const payload = {
                          id_perfil: userId,
                          primer_nombre: formData.primer_nombre ?? '',
                          segundo_nombre: formData.segundo_nombre ?? null,
                          primer_apellido: formData.primer_apellido ?? '',
                          segundo_apellido: formData.segundo_apellido ?? null,
                          telefono: formData.telefono ?? null,
                          direccion: formData.direccion ?? null,
                          fecha_nacimiento: formData.fecha_nacimiento ?? null,
                          fecha_registro: userInfo?.user?.created_at ?? new Date().toISOString(),
                          estado: formData.estado ?? 'activo',
                          username: formData.username ?? userInfo?.user?.email?.split('@')[0] ?? null,
                          avatar_url: publicUrl,
                          ultimo_acceso: new Date().toISOString()
                        };

                        // Use a single upsert with onConflict to avoid duplicate-key/409 errors
                        const { error: upsertError } = await supabase
                          .from('perfil_usuario')
                          .upsert(payload, { onConflict: 'id_perfil' });

                        if (upsertError) {
                          console.error('Error upserting perfil after avatar upload:', upsertError);
                          message.error('Error guardando avatar en perfil: ' + (upsertError.message || JSON.stringify(upsertError)));
                          return;
                        }

                        // Actualizar UI
                        setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
                        setUserData(prev => prev ? ({ ...prev, avatar_url: publicUrl }) : prev);
                        message.success('Avatar actualizado correctamente');
                      } catch (err: unknown) {
                        const errMsg = err instanceof Error ? err.message : String(err);
                        console.error('Unhandled error uploading avatar:', err);
                        message.error('Error al subir avatar: ' + errMsg);
                      }
                    }}
                  />
                </>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                {userData?.primer_nombre && userData?.primer_apellido
                  ? `${userData.primer_nombre} ${userData.segundo_nombre || ''} ${userData.primer_apellido} ${userData.segundo_apellido || ''}`.trim()
                  : userData?.username || 'Usuario'
                }
              </h2>
              <p className="text-gray-600 flex items-center gap-2">
                <FaUserTag size={14} />
                {userData?.estado === 'activo' ? 'Usuario Activo' : 'Usuario Inactivo'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Miembro desde {formatDate(userData?.fecha_registro || null)}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información Personal */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaUser className="text-blue-600" />
              Información Personal
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primer Nombre</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.primer_nombre || ''}
                      onChange={(e) => handleInputChange('primer_nombre', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">{userData?.primer_nombre || 'No especificado'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Segundo Nombre</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.segundo_nombre || ''}
                      onChange={(e) => handleInputChange('segundo_nombre', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{userData?.segundo_nombre || 'No especificado'}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primer Apellido</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.primer_apellido || ''}
                      onChange={(e) => handleInputChange('primer_apellido', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">{userData?.primer_apellido || 'No especificado'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Segundo Apellido</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.segundo_apellido || ''}
                      onChange={(e) => handleInputChange('segundo_apellido', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{userData?.segundo_apellido || 'No especificado'}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.username || ''}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{userData?.username || 'No especificado'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaEnvelope className="text-green-600" />
              Información de Contacto
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <FaPhone size={14} />
                  Teléfono
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.telefono || ''}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1234567890"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{userData?.telefono || 'No especificado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <FaMapMarkerAlt size={14} />
                  Dirección
                </label>
                {editing ? (
                  <textarea
                    value={formData.direccion || ''}
                    onChange={(e) => handleInputChange('direccion', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ingresa tu dirección completa"
                  />
                ) : (
                  <p className="text-gray-900">{userData?.direccion || 'No especificada'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Información Adicional */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaCalendarAlt className="text-purple-600" />
              Información Adicional
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                {editing ? (
                  <input
                    type="date"
                    value={formData.fecha_nacimiento ? formData.fecha_nacimiento.split('T')[0] : ''}
                    onChange={(e) => handleInputChange('fecha_nacimiento', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{formatDate(userData?.fecha_nacimiento || null)}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Último Acceso</label>
                <p className="text-gray-900">{formatDate(userData?.ultimo_acceso || null)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado de la Cuenta</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  userData?.estado === 'activo'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {userData?.estado === 'activo' ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Estadísticas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-sm text-gray-600">Ventas Realizadas</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-sm text-gray-600">Productos Gestionados</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-sm text-gray-600">Reportes Generados</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">0</div>
                <div className="text-sm text-gray-600">Días Activo</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
