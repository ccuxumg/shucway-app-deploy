import { useState, useEffect } from "react";
import TableTitle from "../TableTitle/TableTitle";
import "./UsuariosTable.css";
import TableHeader from "../TableHeader/TableHeader";
import { Pagination, PaginationProps, Spin, Modal, message } from "antd";
import AddDrawer from "../Drawer/AddDrawer";
import EditDrawer from "../Drawer/EditDrawer";
import { useLocation } from "react-router-dom";
import { getUsuario } from "../../api/getUsuario";
import { UsuarioDataType } from "../../types";
import { useQuery } from "@tanstack/react-query";
// Importar el nuevo servicio del backend
import { getUsuarios } from "../../api/usuariosService";

import { IFilters, TColumns } from "../../types";
import { useMemo } from "react";
import AvatarIcon from "../../assets/icons/avatar.svg";
import { usePermissions } from "../../hooks/usePermissions";
import { MdVisibility, MdEdit, MdDelete } from "react-icons/md";
import { PiArrowUpBold, PiArrowDownBold } from "react-icons/pi";
import { useToggleDrawer } from "../../hooks/usetoggleDrawer";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteUsuario } from "../../api/deleteUsuario";
import { cambiarEstado } from "../../api/usuariosService";
import { useAuth } from "../../hooks/useAuth";

const itemRender: PaginationProps["itemRender"] = (_, type, orginalElement) => {
  return type === "prev" ? (
    <a>Anterior</a>
  ) : type === "next" ? (
    <a>Siguiente</a>
  ) : (
    orginalElement
  );
};

interface UsuariosTableProps {
  estadoFilter?: string;
}

const UsuariosTable: React.FC<UsuariosTableProps> = ({ estadoFilter }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);
  const [searchValue, setSearchValue] = useState<string>("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState<string>("");

  const [filters, setFilters] = useState<IFilters>({
    telefono: null,
    fecha_nacimiento: null,
    estado: null,
    rol: null,
  });

  // Estados para ordenamiento
  type SortKey = 'id' | 'estado' | 'nombreCompleto' | 'ultimoAcceso' | 'rol';
  const [sortBy, setSortBy] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  // Hooks de permisos y acciones
  const permissions = usePermissions();
  const toggleDrawer = useToggleDrawer();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { mutate: deleteUsuarioApi } = useMutation({
    mutationFn: (id: number) => cambiarEstado(id, 'eliminado'),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["usuarios"],
      });
      message.success('Usuario marcado como eliminado');
    },
    onError: (error: Error) => {
      message.error(`Error al eliminar usuario: ${error.message}`);
    },
  });

  // Mutación para borrado físico (hard delete)
  const { mutateAsync: hardDeleteApi } = useMutation({
    mutationFn: (id: string) => deleteUsuario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      message.success('Usuario eliminado permanentemente');
    },
    onError: (error: Error) => {
      message.error(`Error al eliminar usuario permanentemente: ${error.message}`);
    },
  });

  // Funciones de manejo de acciones
  const handleView = (record: UsuarioDataType) => {
    // Abrir el drawer en modo vista (solo lectura)
    toggleDrawer(true, "showDrawerView", record?.id_perfil?.toString());
  };

  const handleEdit = (record: UsuarioDataType) => {
    toggleDrawer(true, "showDrawerEdit", record?.id_perfil?.toString());
  };

  const handleDelete = (record: UsuarioDataType) => {
    // Verificar si es el usuario actual
    if (currentUser && record?.id_perfil === currentUser.id_perfil) {
      Modal.error({
        title: 'No se puede eliminar',
        content: 'No puedes eliminar tu propio usuario mientras estás conectado al sistema.',
        okText: 'Entendido',
      });
      return;
    }

    // Si ya está marcado como 'eliminado', pedir confirmación escrita para borrado definitivo
    if (record.estado === 'eliminado') {
      let confirmation = '';
      Modal.confirm({
        title: 'Eliminar usuario permanentemente',
        content: (
          <div>
            <p>El usuario ya está marcado como <strong>eliminado</strong>. Esto borrará sus datos permanentemente.</p>
            <p>Escribe <strong>ELIMINAR</strong> para confirmar:</p>
            <input
              onChange={(e) => (confirmation = e.target.value)}
              className="w-full border rounded px-2 py-1"
              placeholder="ELIMINAR"
            />
          </div>
        ),
        okText: 'Eliminar permanentemente',
        okType: 'danger',
        cancelText: 'Cancelar',
        async onOk() {
          if (confirmation !== 'ELIMINAR') {
            Modal.error({ title: 'Confirmación inválida', content: 'Debes escribir ELIMINAR para confirmar.' });
            return Promise.reject();
          }

          // Llamar al endpoint de borrado físico
          return hardDeleteApi(record.id_perfil.toString());
        },
      });
      return;
    }

    // Si está activo o inactivo, solo marcar como 'eliminado'
    Modal.confirm({
      title: 'Confirmar eliminación',
      content: `¿Estás seguro que deseas eliminar al usuario "${record?.primer_nombre} ${record?.primer_apellido}"? Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk() {
        deleteUsuarioApi(record.id_perfil);
      },
    });
  };

  // Función para alternar ordenamiento
  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  // Funciones para selección de filas
  const handleSelectAll = () => {
    if (selectedRows.length === usuarios.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(usuarios.map(u => u.id_perfil));
    }
  };

  const handleRowSelect = (id: number) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  // Definición de columnas dentro del componente para acceder a las funciones
  const columns: TColumns = [
    {
      title: "ID",
      dataIndex: "id_perfil",
      width: 180,
      key: "id_perfil",
      hidden: false,
      render: (text, record) => (
        <div className="flex gap-6 items-center min-w-fit">
          <img
            src={record?.avatar_url || AvatarIcon}
            alt="avatar"
            className="min-w-16 h-16 rounded-[50%] object-cover"
          />
          <div className="flex flex-col ">
            <p className="font-semibold">{record?.primer_nombre} {record?.primer_apellido}</p>
            <p> #{text}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      align: "center",
      render: (estado) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          estado === 'activo' ? 'bg-green-100 text-green-800' :
          estado === 'inactivo' ? 'bg-yellow-100 text-yellow-800' :
          estado === 'suspendido' ? 'bg-orange-100 text-orange-800' :
          estado === 'eliminado' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {estado}
        </span>
      ),
    },
    {
      title: "Nombre Completo",
      dataIndex: "primer_nombre",
      key: "primer_nombre",
      align: "center",
      hidden: false,
      width: 200,
      render: (_, record) => (
        <p>{record?.primer_nombre} {record?.segundo_nombre} {record?.primer_apellido} {record?.segundo_apellido}</p>
      ),
    },
    {
      title: "Teléfono",
      key: "telefono",
      hidden: true,
      align: "center",
      dataIndex: "telefono",
      width: 150,
    },
    {
      title: "Estado",
      key: "estado",
      hidden: false,
      align: "center",
      dataIndex: "estado",
      width: 120,
    },
    {
      title: "Último Acceso",
      key: "ultimo_acceso",
      hidden: false,
      align: "center",
      width: 180,
      render: (_, record) => {
        const date = record.ultimo_acceso;
        return <p>{date ? new Date(date).toLocaleString() : 'Nunca'}</p>;
      },
      sorter: (a, b) => {
        const dateA = a.ultimo_acceso ? new Date(a.ultimo_acceso).getTime() : 0;
        const dateB = b.ultimo_acceso ? new Date(b.ultimo_acceso).getTime() : 0;
        return dateA - dateB;
      },
    },
    {
      title: "Rol",
      key: "rol",
      hidden: false,
      align: "center",
      width: 140,
      render: (_, record) => {
        // Si la API retorna la vista vw_usuarios_completo, contendrá un campo 'roles' (string)
        const rolesStr = (record as unknown as Record<string, unknown>)['roles'] as string | undefined;
        if (rolesStr && rolesStr.trim().length > 0) return <p>{rolesStr}</p>;

        // Fallback: buscar en usuario_rol[0].rol_usuario.nombre
        const rolEntry = (record as unknown as Record<string, unknown>)['usuario_rol'] as
          | Array<Record<string, unknown>>
          | undefined;
        const firstRol = rolEntry?.[0] as Record<string, unknown> | undefined;
        const rolUsuarioObj = firstRol ? (firstRol['rol_usuario'] as Record<string, unknown> | undefined) : undefined;
        const rolNombre = (rolUsuarioObj && (rolUsuarioObj['nombre'] as string)) || (firstRol?.['nombre'] as string) || 'sin asignar';
        return <p>{rolNombre}</p>;
      },
    },
    {
      title: "Action",
      key: "action",
      hidden: false,
      align: "center",
      width: 180,
      render: (_, record) => {
        return (
          <div className="flex items-center justify-center gap-1">
            {/* Botón Ver - visible para todos los usuarios autenticados */}
            <IconBtn title="Ver" onClick={() => handleView(record)}>
              <MdVisibility size={18} />
            </IconBtn>

            {/* Botón Editar - solo administradores y propietarios */}
            {(permissions.isAdministrador() || permissions.isPropietario()) && (
              <IconBtn title="Editar" onClick={() => handleEdit(record)}>
                <MdEdit size={18} />
              </IconBtn>
            )}

            {/* Botón Eliminar - solo propietarios */}
            {permissions.isPropietario() && (
              <IconBtn title="Eliminar" onClick={() => handleDelete(record)}>
                <MdDelete size={18} />
              </IconBtn>
            )}
          </div>
        );
      },
    },
  ];

  const [columnsInfo, setColumnsInfo] = useState<TColumns>(columns);

  // Usar el nuevo servicio del backend (sin suscripción en tiempo real por ahora)
  const { data, isLoading } = useQuery({
    queryFn: () => getUsuarios(currentPage, pageSize, {
      estado: estadoFilter && estadoFilter !== 'todos' ? estadoFilter : filters.estado || undefined,
      telefono: filters.telefono || undefined,
      searchValue: debouncedSearchValue || undefined,
    }),
    queryKey: ["usuarios", currentPage, pageSize, estadoFilter, debouncedSearchValue], // QueryKey más estable
    staleTime: 5000, // 5 segundos
    retry: 3
  });

  const handleFilterSubmit = (filters: IFilters) => {
    setFilters(filters);
  };

  const handleSearch = (search: string) => {
    setSearchValue(search);
  };

  const handleChangeColumns = (cols: TColumns) => {
    setColumnsInfo(cols);
  };

  const handlePageCHnage = (page: number, pageSize?: number) => {
    setCurrentPage(page);
    if (pageSize) {
      setPageSize(pageSize);
    }
  };

  const usuarios: UsuarioDataType[] = useMemo(() => {
    if (!data?.data) return [];

    // Función para obtener el valor de ordenamiento
    const getValue = (usuario: UsuarioDataType, key: SortKey): string | number | null => {
      switch (key) {
        case 'id':
          return usuario.id_perfil;
        case 'estado':
          return usuario.estado;
        case 'nombreCompleto':
          return `${usuario.primer_nombre} ${usuario.segundo_nombre || ''} ${usuario.primer_apellido} ${usuario.segundo_apellido || ''}`.trim();
        case 'ultimoAcceso':
          return usuario.ultimo_acceso || '';
        case 'rol':
          return usuario.roles && usuario.roles !== 'Sin rol' ? usuario.roles : '';
        default:
          return '';
      }
    };

    // Mapear PerfilConRoles a UsuarioDataType
    const mappedUsuarios = data.data.map(perfil => ({
      id_perfil: perfil.id_perfil,
      primer_nombre: perfil.primer_nombre || '',
      segundo_nombre: perfil.segundo_nombre || null,
      primer_apellido: perfil.primer_apellido || '',
      segundo_apellido: perfil.segundo_apellido || null,
      telefono: perfil.telefono || null,
      direccion: perfil.direccion || null,
      fecha_nacimiento: perfil.fecha_nacimiento || null,
      fecha_registro: perfil.fecha_registro?.toString() || new Date().toISOString(),
      estado: perfil.estado,
      username: perfil.username || null,
      avatar_url: perfil.avatar_url || null,
      ultimo_acceso: perfil.ultimo_acceso?.toString() || null,
      email: perfil.email,
      nombre: perfil.nombre,
      roles: perfil.roles,
      nivel_permiso: perfil.nivel_permiso,
    }));

    // Aplicar ordenamiento si hay un criterio de ordenamiento activo
    if (sortBy) {
      const sortedUsuarios = [...mappedUsuarios].sort((a, b) => {
        const aValue = getValue(a, sortBy);
        const bValue = getValue(b, sortBy);

        // Manejar valores null/undefined
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortDir === 'asc' ? 1 : -1;
        if (bValue == null) return sortDir === 'asc' ? -1 : 1;

        // Comparación de strings (case insensitive)
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
          return sortDir === 'asc' ? comparison : -comparison;
        }

        // Comparación de números
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDir === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Fallback: convertir a string y comparar
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        const comparison = aStr.localeCompare(bStr);
        return sortDir === 'asc' ? comparison : -comparison;
      });
      return sortedUsuarios;
    }

    return mappedUsuarios;
  }, [data?.data, sortBy, sortDir]);
  const totalUsuarios = data?.count || 0;
  const location = useLocation();
  const [drawerUser, setDrawerUser] = useState<UsuarioDataType | null>(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const showDrawerEditParam = queryParams.get("showDrawerEdit");
    const showDrawerViewParam = queryParams.get("showDrawerView");

    if (showDrawerEditParam && showDrawerEditParam.startsWith("true-")) {
      const idFromParam = showDrawerEditParam.slice(5);
      // Si el usuario está en la página actual, usarlo directamente
      const found = usuarios.find((u) => String(u.id_perfil) === idFromParam);
      if (found) {
        setDrawerUser(found);
        return;
      }

      // Si no está en la página actual, solicitar al servidor
      getUsuario(idFromParam)
        .then((u) => setDrawerUser(u as UsuarioDataType | null))
        .catch(() => setDrawerUser(null));
      return;
    }

    if (showDrawerViewParam && showDrawerViewParam.startsWith("true-")) {
      const idFromParam = showDrawerViewParam.slice(5);
      // Si el usuario está en la página actual, usarlo directamente
      const found = usuarios.find((u) => String(u.id_perfil) === idFromParam);
      if (found) {
        setDrawerUser(found);
        return;
      }

      // Si no está en la página actual, solicitar al servidor
      getUsuario(idFromParam)
        .then((u) => setDrawerUser(u as UsuarioDataType | null))
        .catch(() => setDrawerUser(null));
      return;
    }

    setDrawerUser(null);
  }, [location.search, usuarios]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchValue(searchValue.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  return (
    <>
      <TableTitle totalUsuarios={totalUsuarios} />
      <div className="list_view ">
        <TableHeader
          columnsInfo={columnsInfo}
          handleChangeColumns={handleChangeColumns}
          handleFilterSubmit={handleFilterSubmit}
          handleSearch={handleSearch}
        />
        {isLoading ? (
          <div className="w-full h-[50vh] flex justify-center items-center">
            <Spin />
          </div>
        ) : usuarios.length === 0 ? (
          <div className="w-full h-[50vh] flex justify-center items-center">
            <div className="text-center">
              <p className="text-gray-500 text-lg">No hay usuarios</p>
            </div>
          </div>
        ) : (
          <>
            <div className="custom-scrollbar">
              <table className="users-table w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === usuarios.length && usuarios.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <Th
                      label="ID"
                      onSort={() => toggleSort('id')}
                      active={sortBy === 'id'}
                      dir={sortBy === 'id' ? sortDir : undefined}
                    />
                    <Th
                      label="Estado"
                      onSort={() => toggleSort('estado')}
                      active={sortBy === 'estado'}
                      dir={sortBy === 'estado' ? sortDir : undefined}
                    />
                    <Th
                      label="Nombre Completo"
                      onSort={() => toggleSort('nombreCompleto')}
                      active={sortBy === 'nombreCompleto'}
                      dir={sortBy === 'nombreCompleto' ? sortDir : undefined}
                    />
                    <Th
                      label="Último Acceso"
                      onSort={() => toggleSort('ultimoAcceso')}
                      active={sortBy === 'ultimoAcceso'}
                      dir={sortBy === 'ultimoAcceso' ? sortDir : undefined}
                    />
                    <Th
                      label="Rol"
                      onSort={() => toggleSort('rol')}
                      active={sortBy === 'rol'}
                      dir={sortBy === 'rol' ? sortDir : undefined}
                    />
                    <th className="p-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario, index) => (
                    <tr
                      key={usuario.id_perfil}
                      className={index % 2 === 0 ? 'bg-[#e6f4f1]' : 'bg-white border-b hover:bg-gray-50'}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(usuario.id_perfil)}
                          onChange={() => handleRowSelect(usuario.id_perfil)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex gap-6 items-center min-w-fit">
                          <img
                            src={usuario?.avatar_url || AvatarIcon}
                            alt="avatar"
                            className="min-w-16 h-16 rounded-[50%] object-cover"
                          />
                          <div className="flex flex-col">
                            <p className="font-semibold">{usuario?.primer_nombre} {usuario?.primer_apellido}</p>
                            <p>#{usuario.id_perfil}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          usuario.estado === 'activo' ? 'bg-green-100 text-green-800' :
                          usuario.estado === 'inactivo' ? 'bg-yellow-100 text-yellow-800' :
                          usuario.estado === 'suspendido' ? 'bg-orange-100 text-orange-800' :
                          usuario.estado === 'eliminado' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {usuario.estado}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <p>{usuario?.primer_nombre} {usuario?.segundo_nombre} {usuario?.primer_apellido} {usuario?.segundo_apellido}</p>
                      </td>
                      <td className="p-4 text-center">
                        {usuario.ultimo_acceso ? new Date(usuario.ultimo_acceso).toLocaleString() : 'Nunca'}
                      </td>
                      <td className="p-4 text-center">
                        {usuario.roles && usuario.roles !== 'Sin rol' ? usuario.roles : 'Sin asignar'}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Botón Ver - visible para todos los usuarios autenticados */}
                          <IconBtn title="Ver" onClick={() => handleView(usuario)}>
                            <MdVisibility size={18} />
                          </IconBtn>

                          {/* Botón Editar - solo administradores y propietarios */}
                          {(permissions.isAdministrador() || permissions.isPropietario()) && (
                            <IconBtn title="Editar" onClick={() => handleEdit(usuario)}>
                              <MdEdit size={18} />
                            </IconBtn>
                          )}

                          {/* Botón Eliminar - solo propietarios */}
                          {permissions.isPropietario() && (
                            <IconBtn title="Eliminar" onClick={() => handleDelete(usuario)}>
                              <MdDelete size={18} />
                            </IconBtn>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="list_view_pagination ">
              <Pagination
                total={totalUsuarios}
                current={currentPage}
                onChange={handlePageCHnage}
                pageSize={pageSize}
                showSizeChanger
                pageSizeOptions={["5", "10", "20"]}
                itemRender={itemRender}
              />
            </div>
          </>
        )}
      </div>
      <AddDrawer />
  {/* Drawer de edición global: se controla via query string y carga user por id */}
  <EditDrawer data={drawerUser ?? undefined} />
    </>
  );
};

function IconBtn({ title, children, onClick }: { title: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button title={title} onClick={onClick} className="p-2 rounded-lg hover:bg-gray-100 text-gray-700" type="button" aria-label={title}>
      {children}
    </button>
  );
}

function Th({ label, onSort, active, dir }: { label: string; onSort: () => void; active?: boolean; dir?: "asc" | "desc" }) {
  return (
    <th className="px-4 py-3 font-medium select-none">
      <button type="button" onClick={onSort} className="inline-flex items-center gap-1 text-left hover:underline" aria-label={`Ordenar por ${label}`}>
        <span>{label}</span>
        {active ? (dir === "asc" ? <PiArrowUpBold className="opacity-70" /> : <PiArrowDownBold className="opacity-70" />) : null}
      </button>
    </th>
  );
}

export default UsuariosTable;
