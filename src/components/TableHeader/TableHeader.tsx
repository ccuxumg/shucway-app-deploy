import React, { useState } from "react";
import { Button, Input } from "antd";
import FiltersComponent from "../FiltersComponent/FiltersComponent";
import ColumnsBtn from "../ColumnsBtn/ColumnsBtn";
import PlusIcon from "../../assets/icons/plus.svg";
import FiltersBtn from "../FiltersBtn/FiltersBtn";
import { useToggleDrawer } from "../../hooks/usetoggleDrawer";
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

  const handleOpenFilters = () => {
    setIsFiltersOpen(!isFiltersOpen);
  };

  const handleOpenDrawer = () => {
    toggleDrawer(true, "showDrawerAdd");
  };

  return (
    <>
      <div className="mt-10 flex items-center justify-between">
        <Input
          placeholder="Buscar"
          className="w-1/2 p-3"
          value={searchValue}
          onChange={handleChangeSearch}
        />

        <div className="flex gap-6">
          <ColumnsBtn
            columnsInfo={columnsInfo}
            handleChangeColumns={handleChangeColumns}
          />
          <FiltersBtn handleClick={handleOpenFilters} />

          <Button 
            onClick={handleOpenDrawer}
            className="px-10 bg-[#346d61] hover:bg-[#285249] border-none text-white flex items-center gap-2 h-11 shadow-md transition-all duration-300 hover:shadow-lg"
          >
            <img src={PlusIcon} alt="Plus" className="w-5 h-5" />
            <span className="font-medium tracking-wide text-[15px]">
              Agregar Nuevo Usuario
            </span>
          </Button>
        </div>
      </div>
      <div className="mt-10">
        {isFiltersOpen && (
          <FiltersComponent handleFilterSubmit={handleFilterSubmit} />
        )}
      </div>
    </>
  );
};

export default TableHeader;
