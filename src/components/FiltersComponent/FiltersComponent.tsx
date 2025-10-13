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
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap  gap-x-16 gap-y-8">
        <div className="flex flex-col gap-2">
          <p className="text-gray-500 text-[1.3rem]">Teléfono</p>
          <Input
            placeholder="Buscar por teléfono"
            className="w-[16rem]"
            onChange={(e) => handleFilerChange("telefono", e.target.value)}
            value={filters.telefono || ""}
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-gray-500 text-[1.3rem]">Fecha de Nacimiento</p>
          <RangePicker
            onChange={(value) => handleFilerChange("fecha_nacimiento", value)}
            value={filters.fecha_nacimiento}
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-gray-500 text-[1.3rem]">Estado</p>
          <Select
            placeholder="Elegir estado"
            className="w-[16rem]"
            value={filters.estado}
            onChange={(value) => handleFilerChange("estado", value)}
          >
            <Select.Option value="activo">Activo</Select.Option>
            <Select.Option value="inactivo">Inactivo</Select.Option>
            <Select.Option value="eliminado">Eliminado</Select.Option>
          </Select>
        </div>
      </div>

      <div className="flex gap-6 self-end">
        <Button onClick={handleReset}>Reset</Button>
        <Button onClick={handleSubmit} type="primary">
          Submit
        </Button>
      </div>
    </div>
  );
};

export default FiltersComponent;
