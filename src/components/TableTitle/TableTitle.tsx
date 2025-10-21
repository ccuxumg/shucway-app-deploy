const TableTitle = ({
  totalUsuarios,
  title = "Tabla de Usuarios",
  itemName = "Usuarios"
}: {
  totalUsuarios: number;
  title?: string;
  itemName?: string;
}) => {
  return (
    <div className="flex gap-10 items-center">
      <p className="text-[3.2rem] font-semibold text-[#13443c]">{title}</p>
      <div className="relative">
        <p className="text-[1.6rem] py-2 px-6 text-[#13443c] font-semibold rounded-lg bg-[#e6f4f1] border-2 border-[#13443c] relative z-10">
          {totalUsuarios} {itemName}
        </p>
        <div className="absolute top-1 left-1 w-full h-full bg-[#13443c] rounded-lg opacity-10 z-0"></div>
      </div>
    </div>
  );
};

export default TableTitle;
