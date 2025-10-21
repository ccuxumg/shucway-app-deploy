import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';
import { FaEye, FaEdit, FaTrash, FaPlus, FaFilter, FaColumns, FaUndo } from 'react-icons/fa';
import { Button, Spin, Table, message, Modal, Input, Select, Form, Drawer, Switch, Dropdown } from 'antd';
import { ColumnsType } from 'antd/es/table';

interface TableRecord {
  [key: string]: string | number | boolean | null | undefined;
}

interface TableColumn {
  title: string;
  dataIndex: string;
  key: string;
  hidden?: boolean;
  width?: number;
  fixed?: 'left' | 'right';
  ellipsis?: boolean;
  render?: (value: string | number | boolean | null | undefined, record: TableRecord) => React.ReactNode;
}

const Mantenimiento: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tables, setTables] = useState<string[]>([]);
  const [data, setData] = useState<TableRecord[]>([]);
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleted, setShowDeleted] = useState<boolean>(false);
  const [estadoField, setEstadoField] = useState<string | null>(null);
  const [activoField, setActivoField] = useState<string | null>(null);

  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TableRecord | null>(null);
  const [form] = Form.useForm();


  const colors = {
    primary: '#346C60',    
    secondary: '#12443D', 
    accent: '#FFD40D'      
  };

  const handleRestore = async (record: TableRecord) => {
    Modal.confirm({
      title: 'Confirmar restauración',
      content: "¿Deseas restaurar este registro a 'activo'?",
      okText: 'Restaurar a activo',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          const primaryKey = Object.keys(record).find(key => key.includes('id')) || 'id';

          if (estadoField && String(record[estadoField]) === 'eliminado') {
            const { error } = await supabase
              .from(selectedTable)
              .update({ [estadoField]: 'activo' })
              .eq(primaryKey, record[primaryKey]);

            if (error) throw error;
            message.success("Registro restaurado a 'activo' correctamente");
            await fetchData();
            return;
          }

          if (activoField && (record[activoField] === false || String(record[activoField]) === 'false')) {
            const { error } = await supabase
              .from(selectedTable)
              .update({ [activoField]: true })
              .eq(primaryKey, record[primaryKey]);

            if (error) throw error;
            message.success("Registro activado (activo = true) correctamente");
            await fetchData();
            return;
          }

          message.info('No aplica restauración para este registro');
        } catch (error) {
          console.error('Error restoring:', error);
          message.error('Error al restaurar el registro');
        }
      }
    });
  };

  useEffect(() => {
    const loadAvailableTables = async () => {
      try {
        // Usar el nuevo endpoint optimizado que devuelve todas las tablas disponibles en una sola llamada
        const response = await fetch('/api/dashboard/available-tables', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setTables(data.tables);
        } else if (response.status === 401) {
          message.error('Sesión expirada. Redirigiendo al login...');
          // Limpiar tokens y redirigir
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        } else {
          console.error('Error al obtener tablas disponibles:', response.statusText);
          message.error('Error al cargar las tablas disponibles');
        }
      } catch (error) {
        console.error('Error al cargar tablas:', error);
        message.error('Error al conectar con el servidor');
      }
    };

    loadAvailableTables();
  }, []);

  const generateColumns = useCallback((sampleData: TableRecord): TableColumn[] => {
    if (!sampleData) return [];

  return Object.keys(sampleData).map(key => ({
      title: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      dataIndex: key,
      key: key,
      hidden: false,
      width: key.includes('id') ? 80 : 
             key.includes('fecha') ? 120 : 
             key.includes('estado') || key.includes('activo') ? 100 :
             key.includes('nombre') || key.includes('descripcion') ? 200 : 150,
      ellipsis: true,
      render: (value: string | number | boolean | null | undefined) => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'boolean') return value ? 'Sí' : 'No';
        if ((key.includes('fecha') || key.includes('created_at') || key.includes('updated_at')) && value) {
          return new Date(value).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return String(value);
      }
    }));
  }, []);

  const generateColumnsFromNames = useCallback((names: string[]): TableColumn[] => {
    if (!names || names.length === 0) return [];
    return names.map(key => ({
      title: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      dataIndex: key,
      key: key,
      hidden: false,
      width: key.includes('id') ? 80 : 
             key.includes('fecha') ? 120 : 
             key.includes('estado') || key.includes('activo') ? 100 :
             key.includes('nombre') || key.includes('descripcion') ? 200 : 150,
      ellipsis: true,
      render: (value: string | number | boolean | null | undefined) => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'boolean') return value ? 'Sí' : 'No';
        if ((key.includes('fecha') || key.includes('created_at') || key.includes('updated_at')) && value) {
          return new Date(value).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
        return typeof value === 'object' ? JSON.stringify(value) : String(value);
      }
    }));
  }, []);

  const fetchColumnNames = useCallback(async (tableName: string): Promise<string[]> => {
    try {
      const response = await fetch(`/api/dashboard/table-columns/${tableName}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return (data.columns || []).map((c: { column_name: string }) => c.column_name);
      } else if (response.status === 401) {
        message.error('Sesión expirada. Redirigiendo al login...');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return [];
      } else {
        console.warn('No se pudieron obtener columnas desde el endpoint:', response.statusText);
        return [];
      }
    } catch (err) {
      console.error('Error fetchColumnNames:', err);
      return [];
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!selectedTable) return;
    setLoading(true);
    try {
      const filtersParam = Object.keys(filters).length > 0 ? `?filters=${encodeURIComponent(JSON.stringify(filters))}` : '';
      const response = await fetch(`/api/dashboard/table-data/${selectedTable}${filtersParam}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const rows = result.data || [];

        if (rows.length > 0) {
          setColumns(generateColumns(rows[0]));

          const detectedEstado = Object.keys(rows[0]).find(k => k.toLowerCase().includes('estado')) || null;
          const detectedActivo = Object.keys(rows[0]).find(k => k.toLowerCase().includes('activo')) || null;
          setEstadoField(detectedEstado);
          setActivoField(detectedActivo);

          let filtered = rows;
          if (detectedEstado) {
            if (showDeleted) {
              filtered = rows.filter((r: TableRecord) => String(r[detectedEstado]) === 'eliminado');
            } else {
              filtered = rows.filter((r: TableRecord) => String(r[detectedEstado]) !== 'eliminado');
            }
          } else if (detectedActivo) {
            if (showDeleted) {
              filtered = rows.filter((r: TableRecord) => r[detectedActivo] === false || String(r[detectedActivo]) === 'false');
            } else {
              filtered = rows.filter((r: TableRecord) => !(r[detectedActivo] === false || String(r[detectedActivo]) === 'false'));
            }
          } else {
            if (showDeleted) filtered = [];
            else filtered = rows;
          }

          setData(filtered);
        } else {
          const colNames = await fetchColumnNames(selectedTable);
          if (colNames && colNames.length > 0) {
            setColumns(generateColumnsFromNames(colNames));

            const detectedEstado = colNames.find(k => k.toLowerCase().includes('estado')) || null;
            const detectedActivo = colNames.find(k => k.toLowerCase().includes('activo')) || null;
            setEstadoField(detectedEstado);
            setActivoField(detectedActivo);

            const emptyRow: TableRecord = colNames.reduce((acc, c) => ({ ...acc, [c]: null }), {} as TableRecord);
            setData(showDeleted ? [] : [emptyRow]);
          } else {
            setColumns([]);
            setData([]);
          }
        }
      } else if (response.status === 401) {
        message.error('Sesión expirada. Redirigiendo al login...');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (response.status === 403) {
        const errorData = await response.json();
        message.error(errorData.message || 'No tienes permisos para acceder a esta tabla');
      } else {
        console.error('Error fetching data:', response.statusText);
        message.error('Error al obtener los datos');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('Error al cargar los datos');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedTable, filters, generateColumns, showDeleted, fetchColumnNames, generateColumnsFromNames]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = () => {
    setSelectedRecord(null);
    form.resetFields();
    setAddModalVisible(true);
  };

  const handleView = (record: TableRecord) => {
    setSelectedRecord(record);
    form.resetFields();
    form.setFieldsValue(record);
    setViewModalVisible(true);
  };

  const handleEdit = (record: TableRecord) => {
    setSelectedRecord(record);
    form.setFieldsValue(record);
    setEditModalVisible(true);
  };

  const handleDelete = async (record: TableRecord) => {
    Modal.confirm({
      title: 'Confirmar eliminación',
      content: '¿Estás seguro de que deseas eliminar este registro?',
      okText: 'Eliminar',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          const primaryKey = Object.keys(record).find(key => key.includes('id')) || 'id';

          const estadoKey = Object.keys(record).find(k => k.toLowerCase().includes('estado'));
          const activoKey = Object.keys(record).find(k => k.toLowerCase().includes('activo'));

          if (estadoKey) {
            const { error } = await supabase
              .from(selectedTable)
              .update({ [estadoKey]: 'eliminado' })
              .eq(primaryKey, record[primaryKey]);

            if (error) throw error;
            message.success('Registro marcado como eliminado (borrado lógico)');
            await fetchData();
            return;
          }

          if (activoKey) {
            const { error } = await supabase
              .from(selectedTable)
              .update({ [activoKey]: false })
              .eq(primaryKey, record[primaryKey]);

            if (error) throw error;
            message.success('Registro desactivado (borrado lógico)');
            await fetchData();
            return;
          }

          const { error } = await supabase
            .from(selectedTable)
            .delete()
            .eq(primaryKey, record[primaryKey]);

          if (error) throw error;
          message.success('Registro eliminado exitosamente');
          fetchData();
        } catch (error) {
          console.error('Error deleting:', error);
          message.error('Error al eliminar el registro');
        }
      }
    });
  };

  const handleSave = async (values: Record<string, string | number | boolean | null | undefined>) => {
    try {
      const processedValues = Object.entries(values).reduce<Record<string, string | number | boolean | null | undefined>>((acc, [key, value]) => {
        if (value === null || value === undefined) {
          acc[key] = value;
          return acc;
        }

        if ((key.includes('fecha') || key.includes('created_at') || key.includes('updated_at')) && value) {
          try {
            const dateStr = typeof value === 'boolean' ? '' : String(value);
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              acc[key] = date.toISOString();
            } else {
              throw new Error(`Fecha inválida para el campo ${key}`);
            }
          } catch {
            throw new Error(`Error al procesar la fecha en el campo ${key}`);
          }
          return acc;
        }

        if (typeof value === 'boolean') {
          acc[key] = value;
          return acc;
        }

        if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
          acc[key] = Number(value);
          return acc;
        }

        acc[key] = value;
        return acc;
      }, {});

      if (selectedRecord) {
        const primaryKey = Object.keys(selectedRecord).find(key => key.includes('id')) || 'id';
        const { error } = await supabase
          .from(selectedTable)
          .update(processedValues)
          .eq(primaryKey, selectedRecord[primaryKey]);

        if (error) {
          throw new Error(error.message || 'Error al actualizar el registro');
        }
        message.success('Registro actualizado exitosamente');
        setEditModalVisible(false);
      } else {
        const { error } = await supabase
          .from(selectedTable)
          .insert(processedValues);

        if (error) {
          throw new Error(error.message || 'Error al crear el registro');
        }
        message.success('Registro creado exitosamente');
        setAddModalVisible(false);
      }

      setSelectedRecord(null);
      form.resetFields();
      await fetchData();
    } catch (error) {
      console.error('Error saving:', error);
      if (error instanceof Error) {
        message.error(
          error.message.includes('duplicate key')
            ? 'Ya existe un registro con estos datos'
            : error.message
        );
      } else {
        message.error('Error al guardar el registro');
      }
    }
  };

  const handleFilterChange = (column: string, value: string) => {
    setFilters(prev => ({ ...prev, [column]: value }));
  };

  const handleColumnToggle = (key: string) => {
    setColumns(prev => prev.map(col =>
      col.key === key ? { ...col, hidden: !col.hidden } : col
    ));
  };

  const getPriorityColumns = useCallback((cols: TableColumn[]): TableColumn[] => {
    const priorityOrder = ['id', 'nombre', 'estado', 'activo', 'fecha', 'descripcion'];
    
    const sortedColumns = [...cols].sort((a, b) => {
      const aIndex = priorityOrder.findIndex(priority => a.key.toLowerCase().includes(priority));
      const bIndex = priorityOrder.findIndex(priority => b.key.toLowerCase().includes(priority));
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    return sortedColumns.slice(0, 6);
  }, []);

  const visibleColumns = getPriorityColumns(columns.filter(col => !col.hidden));

  const actionColumn: TableColumn = {
    title: 'Acciones',
    key: 'actions',
    dataIndex: 'actions',
    width: 100,
    fixed: 'right',
    render: (_, record) => (
      <div className="flex gap-2">
        <Button
          type="text"
          icon={<FaEye />}
          onClick={() => handleView(record)}
          style={{ color: colors.primary }}
        />
        <Button
          type="text"
          icon={<FaEdit />}
          onClick={() => handleEdit(record)}
          style={{ color: colors.accent }}
        />
        {/* Mostrar botón Restaurar si el registro está eliminado */}
        {((estadoField && String(record[estadoField]) === 'eliminado') || (activoField && (record[activoField] === false || String(record[activoField]) === 'false'))) && (
          <Button
            type="text"
            icon={<FaUndo />}
            onClick={() => handleRestore(record)}
            style={{ color: '#0f766e' }}
          />
        )}
        <Button
          type="text"
          icon={<FaTrash />}
          onClick={() => handleDelete(record)}
          style={{ color: '#ff4d4f' }}
        />
      </div>
    )
  };

  const tableColumns: ColumnsType<TableRecord> = [
    ...visibleColumns.map(col => ({
      ...col,
      title: col.title,
      dataIndex: col.dataIndex,
      key: col.key,
      width: col.width,
      render: col.render
    })),
    actionColumn
  ];

  const renderFormFields = (isViewMode = false) => {
    if (!columns.length) return null;

    return columns
      .filter(col => !col.hidden && col.key !== 'actions')
      .map(col => {
        let fieldComponent;
        
        if (isViewMode) {
          if (col.key.includes('activo') || col.key.includes('estado')) {
            fieldComponent = <Switch disabled />;
          } else {
            fieldComponent = <Input 
              className="view-mode-input"
              bordered={false}
              readOnly
            />;
          }
        } else {
          if (col.key.includes('activo') || col.key.includes('estado')) {
            fieldComponent = <Switch />;
          } else if (col.key.includes('fecha') || col.key.includes('created_at') || col.key.includes('updated_at')) {
            fieldComponent = <Input type="datetime-local" />;
          } else if (col.key.includes('descripcion') || col.key.includes('detalle')) {
            fieldComponent = <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />;
          } else if (col.key.includes('email')) {
            fieldComponent = <Input type="email" />;
          } else if (col.key.includes('telefono') || col.key.includes('phone')) {
            fieldComponent = <Input type="tel" />;
          } else if (typeof col.key === 'number') {
            fieldComponent = <Input type="number" />;
          } else {
            fieldComponent = <Input placeholder={`Ingrese ${col.title.toLowerCase()}`} />;
          }
        }

        return (
          <Form.Item
            key={col.key}
            name={col.key}
            label={
              <span style={{ 
                color: colors.secondary,
                fontWeight: isViewMode ? '600' : 'normal',
                fontSize: isViewMode ? '0.9rem' : 'inherit'
              }}>
                {col.title}
              </span>
            }
            rules={col.key.includes('id') ? [] : [{ required: false }]}
          >
            {fieldComponent}
          </Form.Item>
        );
      });
  };

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="max-w-full mx-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: colors.primary }}>
            Mantenimiento de Base de Datos
          </h1>
          <p className="text-gray-600">Gestiona las tablas de la base de datos de forma eficiente</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.secondary }}>
              Seleccionar Tabla
            </label>
            <Select
              value={selectedTable}
              onChange={(value) => setSelectedTable(value)}
              className="w-full"
              placeholder="Selecciona una tabla para gestionar"
            >
              {tables.map(table => (
                <Select.Option key={table} value={table}>
                  {table.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Select.Option>
              ))}
            </Select>
          </div>

          {selectedTable && (
            <>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Total de registros: <span className="font-semibold" style={{ color: colors.primary }}>{data.length}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    icon={<FaFilter />}
                    onClick={() => setShowFilters(!showFilters)}
                    style={{ borderColor: colors.primary, color: colors.primary }}
                  >
                    Filtros
                  </Button>
                  <Button
                    onClick={() => setShowDeleted(prev => !prev)}
                    style={{ borderColor: colors.secondary, color: colors.secondary }}
                  >
                    {showDeleted ? 'Ocultar eliminados' : 'Mostrar eliminados'}
                  </Button>

                  <Dropdown
                    menu={{
                      items: columns.map((col, index) => ({
                        key: index,
                        label: (
                          <div className="flex items-center justify-between w-48 py-2">
                            <span>{col.title}</span>
                            <Switch
                              checked={!col.hidden}
                              onChange={() => handleColumnToggle(col.key)}
                              size="small"
                            />
                          </div>
                        )
                      }))
                    }}
                    trigger={['click']}
                  >
                    <Button
                      icon={<FaColumns />}
                      style={{ borderColor: colors.secondary, color: colors.secondary }}
                    >
                      Columnas
                    </Button>
                  </Dropdown>

                  <Button
                    type="primary"
                    icon={<FaPlus />}
                    onClick={handleAdd}
                    style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
                  >
                    Agregar {selectedTable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Button>
                </div>
              </div>

              {showFilters && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: colors.secondary }}>
                    Filtros
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {visibleColumns.slice(0, 8).map(col => (
                      <Input
                        key={col.key}
                        placeholder={`Filtrar ${col.title}`}
                        value={filters[col.key] || ''}
                        onChange={(e) => handleFilterChange(col.key, e.target.value)}
                        allowClear
                      />
                    ))}
                  </div>
                </div>
              )}

              {loading ? (
                <div className="text-center py-12">
                  <Spin size="large" />
                  <p className="mt-4 text-gray-600">Cargando datos...</p>
                </div>
              ) : showDeleted && data.length === 0 ? (
                <div className="text-center py-12">
                  <p className="mt-4 text-gray-600">No hay datos eliminados</p>
                </div>
              ) : data.length > 0 ? (
                <Table
                  columns={tableColumns}
                  dataSource={data}
                  rowKey={(record) => Object.values(record).join('-')}
                  rowClassName={(record) => {
                    try {
                      if (estadoField && String(record[estadoField]) === 'eliminado') return 'deleted-row';
                      if (activoField && String(record[activoField]) === 'false') return 'deleted-row';
                    } catch {
                      return '';
                    }
                    return '';
                  }}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} de ${total} registros`
                  }}
                  scroll={{ x: 1200 }}
                  className="custom-table w-full"
                  size="middle"
                />
              ) : null}
            </>
          )}
        </div>

        <Drawer
          title={`Ver ${selectedTable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
          open={viewModalVisible}
          onClose={() => {
            setViewModalVisible(false);
            form.resetFields();
          }}
          width={500}
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => {
                setViewModalVisible(false);
                form.resetFields();
              }}>
                Cerrar
              </Button>
            </div>
          }
        >
          <Form
            form={form}
            layout="vertical"
            disabled={true}
          >
            {renderFormFields()}
          </Form>
        </Drawer>

        <Drawer
          title={`${selectedRecord ? 'Editar' : 'Agregar'} ${selectedTable.replace(/_/g, ' ')}`}
          open={addModalVisible || editModalVisible}
          onClose={() => {
            setAddModalVisible(false);
            setEditModalVisible(false);
            form.resetFields();
          }}
          width={500}
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => {
                setAddModalVisible(false);
                setEditModalVisible(false);
                form.resetFields();
              }}>
                Cancelar
              </Button>
              <Button
                type="primary"
                onClick={() => form.submit()}
                style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
              >
                {selectedRecord ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
          >
            {renderFormFields()}
          </Form>
        </Drawer>
      </div>
    </div>
  );
};

export default Mantenimiento;
