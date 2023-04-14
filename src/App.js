import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import List from "./components/List";
import AddPet from "./components/AddPet"
import UpdatePet from "./components/UpdatePet"
import { BrowserRouter, Routes, Route } from "react-router-dom";
function App() { 
  return (
    <>
    <BrowserRouter>
    <Routes>
      <Route index element = {<List/>} />
      <Route path="/" element = {<List/>} ></Route>
      <Route path="/addPet" element = {<AddPet/>} ></Route>
      <Route path="/editPet/:id" element = {<UpdatePet/>} ></Route>
    </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
