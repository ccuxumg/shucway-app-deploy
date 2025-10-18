import { renderRoutes, routes } from "./routes/routes";
// import { DebugAuth } from "./components/DebugAuth/DebugAuth"; // Debug desactivado

const App = () => {
  return (
    <div>
      {renderRoutes(routes)}
      {/* <DebugAuth /> */}
    </div>
  );
};

export default App;
