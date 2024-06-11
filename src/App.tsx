import { Routes, Route, useLocation } from "react-router-dom";
import Layout from "./views/layouts/Layout";
// import Loader from "@/components/loader";
import Staff from "./views/pages/Welcome/Staff";

function App() {
  const location = useLocation();
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setLoading(false);
  //   }, 2000); 

  //   return () => clearTimeout(timer);
  // }, []);

  // if (loading) {
  //   return (<div className='inset-0 flex items-center justify-center absolute bg-black bg-opacity-70 '> <Loader /></div>);
  // }

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Layout />}>
        <Route index element={<Staff />} />
        {/* <Route path="/validator_nodes" element={<Validator />} /> */}
        {/* <Route path="/provider_nodes" element={<Provider />} /> */}
      </Route>
    </Routes>
  );
}

export default App;
