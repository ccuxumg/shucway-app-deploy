import { Button, DatePicker, Input, Select } from "antd";
import { useState } from "react";
import { IFilters } from "../../types";
import { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

const FiltersComponent = ({
  handleFilterSubmit,
}: {
  handleFilterSubmit: (filters: IFilters) => void;
}) => {
  const [filters, setFilters] = useState<IFilters>({
    telefono: null,
    fecha_nacimiento: null,
    estado: null,
  });

  const handleFilerChange = (
    key: string,
    value:
      | string
      | [start: Dayjs | null | undefined, end: Dayjs | null | undefined]
      | null
  ) => {
    setFilters({
      ...filters,
      [key]: value,
    });
  };

  const handleSubmit = () => {
    handleFilterSubmit(filters);
  };

  const handleReset = () => {
    setFilters({
      telefono: null,
      fecha_nacimiento: null,
      estado: null,
    });
    handleFilterSubmit({
      telefono: null,
      fecha_nacimiento: null,
      estado: null,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-gray-500 text-sm font-medium">Teléfono</p>
          <Input
            placeholder="Buscar por teléfono"
            className="w-full"
            onChange={(e) => handleFilerChange("telefono", e.target.value)}
            value={filters.telefono || ""}
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-gray-500 text-sm font-medium">Fecha de Nacimiento</p>
          <RangePicker
            onChange={(value) => handleFilerChange("fecha_nacimiento", value)}
            value={filters.fecha_nacimiento}
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-gray-500 text-sm font-medium">Estado</p>
          <Select
            placeholder="Elegir estado"
            className="w-full"
            value={filters.estado}
            onChange={(value) => handleFilerChange("estado", value)}
          >
            <Select.Option value="activo">Activo</Select.Option>
            <Select.Option value="inactivo">Inactivo</Select.Option>
            <Select.Option value="suspendido">Suspendido</Select.Option>
            <Select.Option value="eliminado">Eliminado</Select.Option>
          </Select>
        </div>
      </div>

      <div className="flex gap-4 self-end">
        <Button onClick={handleReset} size="small">Reset</Button>
        <Button onClick={handleSubmit} type="primary" size="small">
          Aplicar Filtros
        </Button>
      </div>
    </div>
  );
};

export default FiltersComponent;
