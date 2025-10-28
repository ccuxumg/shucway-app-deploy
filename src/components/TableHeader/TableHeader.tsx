import React, { useState } from "react";
import { Button } from "antd";
import ColumnsBtn from "../ColumnsBtn/ColumnsBtn";
import PlusIcon from "../../assets/icons/plus.svg";
import { useToggleDrawer } from "../../hooks/usetoggleDrawer";
import { useNavigate } from "react-router-dom";
import { ITableHeaderProps } from "../../types";
import { MdAdminPanelSettings } from "react-icons/md";

const TableHeader = ({
  columnsInfo,
  handleChangeColumns,
  handleSearch,
}: ITableHeaderProps) => {
  const [searchValue, setSearchValue] = useState("");

  const handleChangeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    handleSearch(e.target.value);
  };

  const toggleDrawer = useToggleDrawer();
  const navigate = useNavigate();

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
              className="h-12 w-96 rounded-lg border border-gray-200 bg-white pl-4 pr-4 text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <ColumnsBtn
            columnsInfo={columnsInfo}
            handleChangeColumns={handleChangeColumns}
          />

          <Button
            onClick={handleOpenDrawer}
            className="h-12 rounded-lg bg-emerald-500 px-6 text-base font-semibold text-white hover:bg-emerald-600 flex items-center gap-2"
          >
            <img src={PlusIcon} alt="Plus" className="w-5 h-5" />
            Agregar Nuevo Usuario
          </Button>

          <Button
            onClick={handleNavigateToRoles}
            className="h-12 rounded-lg bg-gray-700 px-6 text-base font-semibold text-white hover:bg-gray-800 ml-3 flex items-center gap-2"
          >
            <MdAdminPanelSettings size={20} />
            Gestión de Roles
          </Button>
        </div>
      </div>
    </>
  );
};

export default TableHeader;
