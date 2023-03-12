import React from 'react'
import Pablo from '../images/pablo.jpeg'
import {BsTrash} from 'react-icons/bs'
import {GrUp, GrUpdate} from 'react-icons/gr'
import {MdUpdate} from 'react-icons/md'
import {RxUpdate} from 'react-icons/rx'

export default function Card() {
  return (

<div class="w-full max-w-sm rounded-lg shadow bg-gray-800 border-gray-700 m-5 text-white">
    <div class="flex justify-end px-4 pt-4">
    </div>
    <div class="flex flex-col items-center pb-10">
        <img class="w-24 h-24 mb-3 rounded-full shadow-lg" src={Pablo}/>
        <h5 class="mb-1 text-xl font-medium">Pablo</h5>
        <span class="text-sm ">Pablo is a Poodle</span>
        <div class="flex mt-4 space-x-10 md:mt-6">
          <BsTrash className='hover:text-red-600 hover:cursor-pointer '/>
          <RxUpdate className='text-white hover:text-green-600 hover:cursor-pointer'/>
        </div>
    </div>
</div>

  )
}
