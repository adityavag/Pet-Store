import React from 'react'
import { useState, useEffect } from 'react'
import Card from './Card'
import Service from '../services/Service'
import { useNavigate } from 'react-router-dom'

export default function List() {

  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await Service.getPets();
        setPets(response.data);
      } catch (error) {
        console.log(error)
      }
      setLoading(false);
    }
    fetchData();
  }, [])


  return (
    <div className='flex flex-col items-center p-10 bg-[#111827]'>
      <h3 className='font-bold text-white text-4xl'>Pets</h3>
      {console.log(pets)}
      {
        !loading && (
          pets.map((pet) => (
            <Card
            props = {pet}
            />
          ))
        )
      }
    </div>
  )
}
