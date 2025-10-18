import { useState, useEffect } from "react";
import TableTitle from "../TableTitle/TableTitle";
import "./UsuariosTable.css";
import TableHeader from "../TableHeader/TableHeader";
import { Pagination, PaginationProps, Spin, Table } from "antd";
import AddDrawer from "../Drawer/AddDrawer";
import ActionDropDown from "../ActionDropDown/ActionDropDown";
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

const itemRender: PaginationProps["itemRender"] = (_, type, orginalElement) => {
  return type === "prev" ? (
    <a>Previous</a>
  ) : type === "next" ? (
    <a>Next</a>
  ) : (
    orginalElement
  );
};

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
        estado === 'desactivado' ? 'bg-red-100 text-red-800' :
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
    hidden: false,
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
      const rolNombre = (rolUsuarioObj && (rolUsuarioObj['nombre'] as string)) || (firstRol?.['nombre'] as string) || '—';
      return <p>{rolNombre}</p>;
    },
  },

  {
    title: "Action",
    key: "action",
    hidden: false,
    align: "center",
    width: 180,

    render: (_, record) => <ActionDropDown data={record} />,
  },
];

const UsuariosTable = () => {
  const [columnsInfo, setColumnsInfo] = useState<TColumns>(columns);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);
  const [searchValue, setSearchValue] = useState<string>("");

  const [filters, setFilters] = useState<IFilters>({
    telefono: null,
    fecha_nacimiento: null,
    estado: null,
  });

  // Usar el nuevo servicio del backend (sin suscripción en tiempo real por ahora)
  const { data, isLoading } = useQuery({
    queryFn: () => getUsuarios(currentPage, pageSize, {
      estado: filters.estado || undefined,
      telefono: filters.telefono || undefined,
      searchValue: searchValue || undefined,
    }),
    queryKey: ["usuarios", currentPage, pageSize, filters, searchValue],
    staleTime: 5000, // 5 segundos
    refetchOnWindowFocus: true,
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
    // Mapear PerfilConRoles a UsuarioDataType
    return data.data.map(perfil => ({
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
  }, [data?.data]);
  const totalUsuarios = data?.count || 0;
  const location = useLocation();
  const [drawerUser, setDrawerUser] = useState<UsuarioDataType | null>(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const showDrawerParam = queryParams.get("showDrawerEdit");
    if (showDrawerParam && showDrawerParam.startsWith("true-")) {
      const idFromParam = showDrawerParam.slice(5);
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
        ) : (
          <>
            <div className="custom-scrollbar">
              <Table
                rowSelection={{ type: "checkbox" }}
                dataSource={usuarios}
                columns={columnsInfo}
                pagination={false}
                rowKey="id_perfil"
                className="users-table"
                rowClassName={(_, index) => 
                  index % 2 === 0 ? 'bg-[#e6f4f1]' : 'bg-white'
                }
              />
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

export default UsuariosTable;
