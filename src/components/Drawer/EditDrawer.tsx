import { Button, Drawer, Input, Spin, Upload, UploadProps, DatePicker, Select, message } from "antd";

import { CgClose } from "react-icons/cg";
import { BiPhone, BiUser, BiMap, BiUserPlus } from "react-icons/bi";
import { Controller, useForm } from "react-hook-form";
import { supabase } from "../../api/supabaseClient";
import { useEffect, useState } from "react";
import { getRoles } from "../../api/getRoles";
import { getUsuarioRoles } from "../../api/getUsuarioRoles";
import { setUsuarioRol } from "../../api/setUsuarioRol";
import { useLocation } from "react-router-dom";

import AddNewUserIcon from "../../assets/icons/AddNewUser.svg";
import ImportAvatar from "../../assets/icons/importAvatar.svg";
import UploadIcon from "../../assets/icons/uploadIcon.svg";
import { useToggleDrawer } from "../../hooks/usetoggleDrawer";
import { uploadFile } from "../../api/uploadFIle";
import { useQueryClient } from "@tanstack/react-query";
import { UsuarioDataType, UsuarioFormData } from "../../types";
import dayjs from "dayjs";

const { Dragger } = Upload;

const EditDrawer = ({ data }: { data?: UsuarioDataType | null }) => {
  const [avatar, setAvatar] = useState<string | null>(data?.avatar_url || null);
  const [isLoadingUpload, setIsLoadingUplaod] = useState<boolean>(false);
  const [editDrawer, setEditDrawer] = useState(false);
  const [roles, setRoles] = useState<Array<{ id_rol: number; nombre: string }>>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  const location = useLocation();
  const toggleDrawer = useToggleDrawer();

 const uploadProps: UploadProps = {
  name: "file",
  multiple: false,
  async onChange(info) {
    const { status } = info.file;
    setIsLoadingUplaod(true);

    if (status === "done") {
      const file = info.file.originFileObj;

      
      const fileUrl = await uploadFile(file);
      if (!fileUrl) {
        message.error("No se pudo obtener la URL del archivo");
        setIsLoadingUplaod(false);
        return;
      }

      setAvatar(fileUrl); 
      message.success(`${info.file.name} se subió correctamente`);
    } else if (status === "error") {
      message.error(`Error al subir el archivo ${info.file.name}`);
    }

    setIsLoadingUplaod(false);
  },
  customRequest: ({ onSuccess }) => {
    setTimeout(() => {
      onSuccess?.("ok");
    }, 0);
  },
};


  const queryClient = useQueryClient();

  const {
    handleSubmit,
    formState: { errors },
    control,
    reset,
  } = useForm<UsuarioFormData>({
    defaultValues: {
      email: data?.email || '',
      password: '',
      primer_nombre: data?.primer_nombre || '',
      segundo_nombre: data?.segundo_nombre || null,
      primer_apellido: data?.primer_apellido || '',
      segundo_apellido: data?.segundo_apellido || null,
      telefono: data?.telefono || null,
      direccion: data?.direccion || null,
      fecha_nacimiento: data?.fecha_nacimiento ? dayjs(data.fecha_nacimiento) : null,
      avatar_url: data?.avatar_url || '',
      estado: (data?.estado as 'activo' | 'desactivado' | 'eliminado') || 'activo',
      username: data?.username || null,
      rol: 'user'
    },
  });

  const onClose = () => {
    toggleDrawer(false, "showDrawerEdit");
  };

  const onSubmit = async (updatedData: UsuarioFormData) => {
    try {
      if (avatar) updatedData.avatar_url = avatar;

      // Preparar datos para la API convirtiendo fecha dayjs a string
      const apiData: Partial<UsuarioDataType> = {
        primer_nombre: updatedData.primer_nombre,
        segundo_nombre: updatedData.segundo_nombre,
        primer_apellido: updatedData.primer_apellido,
        segundo_apellido: updatedData.segundo_apellido,
        telefono: updatedData.telefono,
        direccion: updatedData.direccion,
        fecha_nacimiento: updatedData.fecha_nacimiento && dayjs.isDayjs(updatedData.fecha_nacimiento)
          ? updatedData.fecha_nacimiento.format('YYYY-MM-DD')
          : updatedData.fecha_nacimiento || null,
        avatar_url: updatedData.avatar_url,
        estado: updatedData.estado,
        username: updatedData.username,
      };

      // Intentar update-first; si no existe fila, insertar una nueva (campos mínimos) y fallback a update en caso de race condition
      const upsertPerfilFromAdmin = async (idPerfil: string | undefined, body: Partial<UsuarioDataType>) => {
        if (!idPerfil) throw new Error('Falta id_perfil');
        const numericId = parseInt(idPerfil);
        try {
          // intentar UPDATE
          const { data: uData, error: uErr } = await supabase
            .from('perfil_usuario')
            .update(body)
            .eq('id_perfil', idPerfil)
            .select();
          if (uErr) throw uErr;
          if (Array.isArray(uData) && uData.length > 0) return uData;

          // no se actualizó: intentar INSERT con campos obligatorios
          const base: Partial<UsuarioDataType> = {
            id_perfil: numericId,
            primer_nombre: body.primer_nombre || 'Usuario',
            primer_apellido: body.primer_apellido || 'SinApellido',
            email: (body.email as string | undefined) || undefined,
            avatar_url: body.avatar_url || null,
            telefono: body.telefono || null,
            estado: body.estado || 'activo',
          };

          const { data: insData, error: insErr } = await supabase
            .from('perfil_usuario')
            .insert(base)
            .select();
          if (insErr) {
            // si hay duplicate key, intentar update de nuevo
            if (insErr?.message && insErr.message.includes('duplicate key')) {
              const { data: retry, error: retryErr } = await supabase
                .from('perfil_usuario')
                .update(body)
                .eq('id_perfil', idPerfil)
                .select();
              if (retryErr) throw retryErr;
              return retry;
            }
            throw insErr;
          }
          return insData;
        } catch (err) {
          console.error('upsertPerfilFromAdmin error', err);
          throw err;
        }
      };
      await upsertPerfilFromAdmin(data?.id_perfil?.toString(), apiData as Partial<UsuarioDataType>);
      // invalidar cache
  queryClient.invalidateQueries({ queryKey: ['usuarios'] });

      // Actualizar rol si cambió
      if (data?.id_perfil) {
        await setUsuarioRol(data.id_perfil.toString(), selectedRoleId).catch((err) => {
          console.error('Error actualizando rol del usuario:', err);
          throw err;
        });
      }

      message.success('Usuario actualizado correctamente');
      reset();
      onClose();
    } catch (err) {
      message.error('Error al actualizar el usuario: ' + ((err as Error)?.message || String(err)));
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const showDrawerParam = queryParams.get("showDrawerEdit");

    // El parámetro viene como "true-<id>". No usar split('-') porque el id contiene '-' (UUID).
    if (showDrawerParam && showDrawerParam.startsWith("true-")) {
      const idFromParam = showDrawerParam.slice(5); // toma todo después de "true-"
      if (String(data?.id_perfil) === idFromParam) {
        setEditDrawer(true);
        return;
      }
    }
    setEditDrawer(false);
  }, [location.search, data?.id_perfil]);

  // Cuando se abre el drawer, resetear el formulario con los datos actuales
  useEffect(() => {
    if (editDrawer) {
      reset({
        email: data?.email || '',
        password: '',
        primer_nombre: data?.primer_nombre || '',
        segundo_nombre: data?.segundo_nombre || null,
        primer_apellido: data?.primer_apellido || '',
        segundo_apellido: data?.segundo_apellido || null,
        telefono: data?.telefono || null,
        direccion: data?.direccion || null,
        fecha_nacimiento: data?.fecha_nacimiento ? dayjs(data.fecha_nacimiento) : null,
        avatar_url: data?.avatar_url || '',
        estado: (data?.estado as 'activo' | 'desactivado' | 'eliminado') || 'activo',
        username: data?.username || null,
        rol: 'user'
      });
      setAvatar(data?.avatar_url || null);
    }
  }, [editDrawer, data, reset]);

  // Cargar roles y rol actual cuando se abre
  useEffect(() => {
    if (!editDrawer) return;

    let mounted = true;

    type Role = { id_rol: number; nombre: string };

    getRoles()
      .then((r: unknown) => {
        if (!mounted) return;
        const list = (r as Role[]) || [];
        setRoles(list);
      })
      .catch(() => {});

    if (data?.id_perfil) {
      getUsuarioRoles(data.id_perfil.toString())
        .then((ur: unknown) => {
          if (!mounted) return;
          const list = (ur as Array<{ id_rol?: number }>) || [];
          const first = list[0];
          const idRol = first?.id_rol;
          setSelectedRoleId(typeof idRol === 'number' ? idRol : null);
        })
        .catch(() => {
          setSelectedRoleId(null);
        });
    }

    return () => {
      mounted = false;
    };
  }, [editDrawer, data?.id_perfil]);

  return (
    <Drawer
      title={
        <div className="flex items-center gap-4">
          <img src={AddNewUserIcon} alt="add user icon" />
          <div>
            <p className="text-[1.6rem] font-semibold">Editar Usuario</p>
            <p className="text-sm text-gray-500">Modifica los datos del usuario seleccionado</p>
          </div>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={editDrawer}
      width={700}
      closeIcon={<CgClose size={20} />}
      destroyOnClose
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex-1">
          {/* Avatar Upload Section */}
          <div className="mt-6 px-6 py-4">
            <div className="flex flex-col gap-4">
              <label className="text-gray-700 font-medium">Avatar</label>
              <div className="flex items-center gap-6">
                <img
                  src={avatar || ImportAvatar}
                  alt="avatar"
                  className="w-20 h-20 rounded-full object-cover"
                />
                <Dragger {...uploadProps} className="flex-1">
                  <div className="flex items-center gap-5">
                    {isLoadingUpload ? (
                      <Spin />
                    ) : (
                      <img src={UploadIcon} alt="upload icon" />
                    )}
                    <p className="text-[1.4rem] font-extralight w-8/12">
                      <strong>Click to upload</strong> or drag and drop SVG, PNG,
                      JPG or GIF
                    </p>
                  </div>
                </Dragger>
              </div>
            </div>
          </div>
          <hr />

          <div className="mt-6 flex flex-col">
            <div
              className="p-2 pl-6 text-color-blue-2 text-[1.6rem]"
              style={{
                background:
                  "linear-gradient(90.09deg, rgba(255, 255, 255, 0.43) 6.16%, rgba(68, 143, 237, 0.43) 70.73%, rgba(8, 111, 233, 0.6) 99.98%)",
              }}
            >
              Information
            </div>

            {/* Primer Nombre Field */}
            <div className="mt-6 px-6 py-4 flex flex-col gap-4">
              <label htmlFor="primer_nombre" className="text-gray-700">
                Primer Nombre <span className="text-red-500">*</span>
              </label>
              <Controller
                name="primer_nombre"
                control={control}
                rules={{ required: 'El primer nombre es requerido' }}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    prefix={<BiUser />}
                    placeholder="Ingrese primer nombre"
                  />
                )}
              />
              {errors.primer_nombre && (
                <p className="text-red-500 text-[1.2rem]">
                  {errors.primer_nombre.message as string}
                </p>
              )}
            </div>

            {/* Segundo Nombre Field */}
            <div className="px-6 py-4 flex flex-col gap-4">
              <label htmlFor="segundo_nombre" className="text-gray-700">
                Segundo Nombre
              </label>
              <Controller
                name="segundo_nombre"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    prefix={<BiUser />}
                    placeholder="Ingrese segundo nombre"
                  />
                )}
              />
              {errors.segundo_nombre && (
                <p className="text-red-500 text-[1.2rem]">
                  {errors.segundo_nombre.message as string}
                </p>
              )}
            </div>

            {/* Primer Apellido Field */}
            <div className="px-6 py-4 flex flex-col gap-4">
              <label htmlFor="primer_apellido" className="text-gray-700">
                Primer Apellido <span className="text-red-500">*</span>
              </label>
              <Controller
                name="primer_apellido"
                control={control}
                rules={{ required: 'El primer apellido es requerido' }}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    prefix={<BiUser />}
                    placeholder="Ingrese primer apellido"
                  />
                )}
              />
              {errors.primer_apellido && (
                <p className="text-red-500 text-[1.2rem]">
                  {errors.primer_apellido.message as string}
                </p>
              )}
            </div>

            {/* Segundo Apellido Field */}
            <div className="px-6 py-4 flex flex-col gap-4">
              <label htmlFor="segundo_apellido" className="text-gray-700">
                Segundo Apellido
              </label>
              <Controller
                name="segundo_apellido"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    prefix={<BiUser />}
                    placeholder="Ingrese segundo apellido"
                  />
                )}
              />
              {errors.segundo_apellido && (
                <p className="text-red-500 text-[1.2rem]">
                  {errors.segundo_apellido.message as string}
                </p>
              )}
            </div>

            {/* Teléfono Field */}
            <div className="px-6 py-4 flex flex-col gap-4">
              <label htmlFor="telefono" className="text-gray-700">
                Teléfono
              </label>
              <Controller
                name="telefono"
                control={control}
                rules={{
                  pattern: {
                    value: /^\d{8,}$/,
                    message: "El teléfono debe tener al menos 8 dígitos",
                  },
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    prefix={<BiPhone />}
                    placeholder="Ingrese teléfono"
                  />
                )}
              />
              {errors.telefono && (
                <p className="text-red-500 text-[1.2rem]">
                  {errors.telefono.message as string}
                </p>
              )}
            </div>

            {/* Dirección Field */}
            <div className="px-6 py-4 flex flex-col gap-4">
              <label htmlFor="direccion" className="text-gray-700">
                Dirección
              </label>
              <Controller
                name="direccion"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    prefix={<BiMap />}
                    placeholder="Ingrese dirección"
                  />
                )}
              />
              {errors.direccion && (
                <p className="text-red-500 text-[1.2rem]">
                  {errors.direccion.message as string}
                </p>
              )}
            </div>

            {/* Fecha Nacimiento Field */}
            <div className="px-6 py-4 flex flex-col gap-4">
              <label htmlFor="fecha_nacimiento" className="text-gray-700">
                Fecha de Nacimiento
              </label>
              <Controller
                name="fecha_nacimiento"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    placeholder="Seleccione fecha de nacimiento"
                    format="DD/MM/YYYY"
                    style={{ width: '100%' }}
                  />
                )}
              />
              {errors.fecha_nacimiento && (
                <p className="text-red-500 text-[1.2rem]">
                  {errors.fecha_nacimiento.message as string}
                </p>
              )}
            </div>

            {/* Username Field */}
            <div className="px-6 py-4 flex flex-col gap-4">
              <label htmlFor="username" className="text-gray-700">
                Username
              </label>
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    prefix={<BiUserPlus />}
                    placeholder="Ingrese username"
                  />
                )}
              />
              {errors.username && (
                <p className="text-red-500 text-[1.2rem]">
                  {errors.username.message as string}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="px-6 py-4 flex flex-col gap-4">
              <label htmlFor="email" className="text-gray-700">
                Correo Electrónico
              </label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    prefix={<BiUser />}
                    placeholder="Ingrese correo electrónico"
                    disabled
                  />
                )}
              />
              {errors.email && (
                <p className="text-red-500 text-[1.2rem]">
                  {errors.email.message as string}
                </p>
              )}
              <p className="text-sm text-gray-500">El correo electrónico no puede modificarse</p>
            </div>

            {/* Estado Field */}
            <div className="px-6 py-4 flex flex-col gap-4">
              <label htmlFor="estado" className="text-gray-700">
                Estado
              </label>
              <Controller
                name="estado"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Seleccione estado"
                    options={[
                      { value: "activo", label: "Activo" },
                      { value: "desactivado", label: "Desactivado" },
                      { value: "eliminado", label: "Eliminado" },
                    ]}
                    disabled
                  />
                )}
              />
              {errors.estado && (
                <p className="text-red-500 text-[1.2rem]">
                  {errors.estado.message as string}
                </p>
              )}
              <p className="text-sm text-gray-500">El estado no puede modificarse desde aquí</p>
            </div>

            {/* Rol Field */}
            <div className="px-6 py-4 flex flex-col gap-4">
              <label htmlFor="rol" className="text-gray-700">
                Rol <span className="text-red-500">*</span>
              </label>
              <Select
                placeholder="Seleccione rol"
                value={selectedRoleId}
                onChange={(val: number) => setSelectedRoleId(val)}
                options={roles.map((r) => ({ value: r.id_rol, label: r.nombre }))}
              />
              <p className="text-sm text-gray-500">Asigna un rol al usuario</p>
            </div>
          </div>
        </div>
        <div className="sticky bottom-6 bg-white py-4">
          <div className="max-w-full px-6">
            <Button
              type="primary"
              className="py-3 text-[1.4rem] w-full !bg-blue-700 transition-all duration-200 hover:opacity-80"
              htmlType="submit"
            >
              Guardar cambios
            </Button>
          </div>
        </div>
      </form>
    </Drawer>
  );
};

export default EditDrawer;
