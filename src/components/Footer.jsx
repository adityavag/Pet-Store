import React from 'react'
import {BsGithub} from 'react-icons/bs'
export default function Footer() {
  return (
    <div className='flex flex-col items-center text-white p-2'>
      <a href = "https://github.com/adityavag"><BsGithub className='text-2xl'/></a>
    </div>
  )
}
