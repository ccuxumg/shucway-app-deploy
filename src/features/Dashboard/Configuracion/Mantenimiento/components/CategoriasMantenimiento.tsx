import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../../api/supabaseClient';
import { Button, Table, message, Modal, Form, Input, Select } from 'antd';
import { FaEye, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

interface Categoria {
  id_categoria?: number;
  nombre: string;
  descripcion: string;
  estado: 'activo' | 'inactivo';
  fecha_creacion?: string;
}

const CategoriasMantenimiento: React.FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [form] = Form.useForm();

  // Colores del tema
  const colors = {
    primary: '#346C60',
    secondary: '#12443D',
    accent: '#FFD40D'
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error('Error fetching categorias:', error);
      message.error('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCategoria(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    form.setFieldsValue(categoria);
    setModalVisible(true);
  };

  const handleDelete = async (categoria: Categoria) => {
    if (!categoria.id_categoria) return;

    Modal.confirm({
      title: 'Eliminar Categoría',
      content: `¿Estás seguro de eliminar "${categoria.nombre}"? Esto puede afectar a los productos asociados.`,
      okText: 'Eliminar',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          const { error } = await supabase
            .from('categorias')
            .delete()
            .eq('id_categoria', categoria.id_categoria);

          if (error) throw error;
          message.success('Categoría eliminada exitosamente');
          fetchCategorias();
        } catch (error) {
          console.error('Error deleting categoria:', error);
          message.error('Error al eliminar categoría');
        }
      }
    });
  };

  const handleSave = async (values: Categoria) => {
    try {
      if (editingCategoria?.id_categoria) {
        // Update
        const { error } = await supabase
          .from('categorias')
          .update(values)
          .eq('id_categoria', editingCategoria.id_categoria);

        if (error) throw error;
        message.success('Categoría actualizada exitosamente');
      } else {
        // Create
        const { error } = await supabase
          .from('categorias')
          .insert(values);

        if (error) throw error;
        message.success('Categoría creada exitosamente');
      }

      setModalVisible(false);
      form.resetFields();
      fetchCategorias();
    } catch (error) {
      console.error('Error saving categoria:', error);
      message.error('Error al guardar categoría');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id_categoria',
      key: 'id_categoria',
      width: 80,
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      width: 200,
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      width: 300,
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 100,
      render: (estado: string) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {estado}
        </span>
      ),
    },
    {
      title: 'Fecha Creación',
      dataIndex: 'fecha_creacion',
      key: 'fecha_creacion',
      width: 150,
      render: (fecha: string) => fecha ? new Date(fecha).toLocaleDateString('es-ES') : '-',
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 150,
      render: (_: unknown, record: Categoria) => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<FaEye />}
            onClick={() => Modal.info({
              title: 'Detalles de la Categoría',
              content: (
                <div className="space-y-2">
                  <p><strong>Nombre:</strong> {record.nombre}</p>
                  <p><strong>Descripción:</strong> {record.descripcion}</p>
                  <p><strong>Estado:</strong> {record.estado}</p>
                  <p><strong>Fecha de Creación:</strong> {record.fecha_creacion ? new Date(record.fecha_creacion).toLocaleDateString('es-ES') : '-'}</p>
                </div>
              ),
              width: 500,
            })}
            style={{ color: colors.primary }}
          />
          <Button
            type="text"
            icon={<FaEdit />}
            onClick={() => handleEdit(record)}
            style={{ color: colors.accent }}
          />
          <Button
            type="text"
            icon={<FaTrash />}
            onClick={() => handleDelete(record)}
            style={{ color: '#ff4d4f' }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: colors.primary }}>
            Gestión de Categorías
          </h2>
          <p className="text-gray-600">
            Total de categorías: <span className="font-semibold">{categorias.length}</span>
          </p>
        </div>

        <Button
          type="primary"
          icon={<FaPlus />}
          onClick={handleAdd}
          style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
        >
          Agregar Categoría
        </Button>
      </div>

      {categorias.length === 0 && !loading ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4" style={{ color: colors.accent }}>📂</div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: colors.secondary }}>
            No hay categorías registradas
          </h3>
          <p className="text-gray-600 mb-6">
            Comienza creando tu primera categoría para organizar los productos.
          </p>
          <Button
            type="primary"
            icon={<FaPlus />}
            onClick={handleAdd}
            style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
          >
            Agregar primera categoría
          </Button>
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={categorias}
          rowKey="id_categoria"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} de ${total} categorías`
          }}
          scroll={{ x: 800 }}
        />
      )}

      <Modal
        title={editingCategoria ? 'Editar Categoría' : 'Agregar Categoría'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="nombre"
            label="Nombre de la Categoría"
            rules={[{ required: true, message: 'El nombre es requerido' }]}
          >
            <Input placeholder="Ingrese el nombre de la categoría" />
          </Form.Item>

          <Form.Item
            name="descripcion"
            label="Descripción"
            rules={[{ required: true, message: 'La descripción es requerida' }]}
          >
            <Input.TextArea
              placeholder="Ingrese la descripción de la categoría"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="estado"
            label="Estado"
            rules={[{ required: true, message: 'El estado es requerido' }]}
          >
            <Select placeholder="Seleccione el estado">
              <Select.Option value="activo">Activo</Select.Option>
              <Select.Option value="inactivo">Inactivo</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item className="flex justify-end">
            <Button
              onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}
              className="mr-2"
            >
              Cancelar
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
            >
              {editingCategoria ? 'Actualizar' : 'Crear'} Categoría
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoriasMantenimiento;
