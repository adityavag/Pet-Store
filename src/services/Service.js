import axios from "axios";

const API_BASE_URL = 'http://localhost:8080/pets';

class Service {
    savePet(pet){
        return axios.post(API_BASE_URL,pet)
    }
    getPet(){
        return axios.get(API_BASE_URL);
    }
    getPetById(id){
        return axios.get(API_BASE_URL + "/" + id);
    }
    deletePet(id){
        return axios.delete(API_BASE_URL + "/" + id);
    }
    updatePet(pet, id){
        return axios.put(API_BASE_URL + "/" + id);
    }
}

export default new Service();
