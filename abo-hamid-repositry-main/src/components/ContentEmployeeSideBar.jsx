import React from 'react'
import { BookOpen, UserPlus, FileEdit } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const ContentEmployeeSideBar = () => {
  return (
    <div className='w-64 h-full'>
      <ul className='p-2'>
        <NavLink to='/content-employee/books-pending'> <li className='flex items-center gap-2 '>Books for review <BookOpen size={18}/></li></NavLink>
        <NavLink to='/content-employee/author-requests'> <li className='flex items-center gap-2'>Authors requests <UserPlus size={18}/></li></NavLink>
        <NavLink to='/content-employee/modifications'> <li className='flex items-center gap-2'>Book editing requests <FileEdit size={18}/></li></NavLink>
      </ul>
    </div>
  )
}

export default ContentEmployeeSideBar