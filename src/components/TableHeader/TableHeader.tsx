import React, { useState } from "react";
import { Button } from "antd";
import FiltersComponent from "../FiltersComponent/FiltersComponent";
import ColumnsBtn from "../ColumnsBtn/ColumnsBtn";
import PlusIcon from "../../assets/icons/plus.svg";
import FiltersBtn from "../FiltersBtn/FiltersBtn";
import { useToggleDrawer } from "../../hooks/usetoggleDrawer";
import { useNavigate } from "react-router-dom";
import { ITableHeaderProps } from "../../types";

const TableHeader = ({
  columnsInfo,
  handleChangeColumns,
  handleFilterSubmit,
  handleSearch,
}: ITableHeaderProps) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const handleChangeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    handleSearch(e.target.value);
  };

  const toggleDrawer = useToggleDrawer();
  const navigate = useNavigate();

  const handleOpenFilters = () => {
    setIsFiltersOpen(!isFiltersOpen);
  };

  const handleOpenDrawer = () => {
    toggleDrawer(true, "showDrawerAdd");
  };

  const handleNavigateToRoles = () => {
    navigate('/administracion/roles');
  };

  return (
    <>
      {/* Filtros y acciones */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1" />

          <div className="relative">
            <label className="sr-only" htmlFor="search">Buscar</label>
            <input
              id="search"
              value={searchValue}
              onChange={handleChangeSearch}
              placeholder="Buscar usuarios…"
              className="h-10 w-80 rounded-lg border border-gray-200 bg-white pl-3 pr-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <ColumnsBtn
            columnsInfo={columnsInfo}
            handleChangeColumns={handleChangeColumns}
          />
          <FiltersBtn handleClick={handleOpenFilters} />

          <Button
            onClick={handleOpenDrawer}
            className="h-10 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            <img src={PlusIcon} alt="Plus" className="w-5 h-5 mr-2" />
            Agregar Nuevo Usuario
          </Button>

          <Button
            onClick={handleNavigateToRoles}
            className="h-10 rounded-lg bg-gray-700 px-4 text-sm font-semibold text-white hover:bg-gray-800 ml-3"
          >
            Gestión de Roles
          </Button>
        </div>
      </div>

      <div className="mt-4">
        {isFiltersOpen && (
          <FiltersComponent handleFilterSubmit={handleFilterSubmit} />
        )}
      </div>
    </>
  );
};

export default TableHeader;
