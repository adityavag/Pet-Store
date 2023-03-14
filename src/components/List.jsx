import React from 'react'
import Card from './Card'

export default function List() {
  return (
    <div className='flex flex-col items-center p-10'>
        <Card name="Pablo" breed="Poodle"/>
        <Card name="Jade" breed="Chihuahua"/>
        <Card name="Casy" breed="Siberian Husky"/>
        <Card name="Zahab" breed="Afghan Hound"/>
    </div>
  )
}
