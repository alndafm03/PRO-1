import React from 'react'
import { BookOpen,User,LayoutDashboard, UserCog, Tag, MessagesSquare, BarChart3, MessagesSquareIcon, LayoutGrid, DollarSign, Option, Settings} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const SideBar = () => {
  return (
    <div className='w-64 h-full'>
      <ul className='p-2'>
  <NavLink  to='/'> <li className='flex items-center gap-2 '>DashBoard  <LayoutDashboard size={18}/></li></NavLink>
  <NavLink to='reports'> <li  className='flex items-center gap-2'>Reports   <BarChart3 size={18}/></li></NavLink> 
  <NavLink  to='books'> <li className='flex items-center gap-2'>Books  <BookOpen size={18}/></li></NavLink>
    <NavLink  to ='employees'> <li className='flex items-center gap-2'>Employees <UserCog size={18}/></li> </NavLink>
  <NavLink  to='users'> <li  className='flex items-center gap-2'>Users <User size={18}/></li> </NavLink>
      <NavLink  to='offers'> <li className='flex items-center gap-2'>Offers   <Tag size={18}/></li></NavLink>
      <NavLink  to='authors'> <li className='flex items-center gap-2'>Authors   <Tag size={18}/></li></NavLink>
      {/* <NavLink  to='categories'> <li className='flex items-center gap-2'>Categories   <LayoutGrid size={18}/></li></NavLink> */}
      <NavLink  to='operation'> <li className='flex items-center gap-2'>Operations   <Option size={18}/></li></NavLink>
      <NavLink  to='fines'> <li className='flex items-center gap-2'>Fines   <DollarSign size={18}/></li></NavLink>
      {/* <NavLink  to='reviews'> <li className='flex items-center gap-2'>Reviews   <MessagesSquareIcon size={18}/></li></NavLink> */}
      <NavLink  to='settings'> <li className='flex items-center gap-2'>Settings   <Settings size={18}/></li></NavLink>
  {/* <NavLink to='chats'> <li className='flex items-center gap-2' >Chats <MessagesSquare size={18}/> </li></NavLink> */}
      </ul>

    </div>
  )
}

export default SideBar
