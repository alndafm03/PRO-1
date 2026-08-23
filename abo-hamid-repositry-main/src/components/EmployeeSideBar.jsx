import React from 'react'
import { CreditCard, PackageCheck, BookOpen, Layers, DollarSign, Armchair, Tag, Users, PlusCircle } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const EmployeeSideBar = () => {
  return (
    <div className='w-full h-full'>
      <ul className='p-2'>
        <NavLink to='/employee/payments'> <li className='flex items-center gap-2 '>Pending Payments <CreditCard size={18}/></li></NavLink>
        <NavLink to='/employee/orders'> <li className='flex items-center gap-2'>Requests To Purchase Paper Books  <PackageCheck size={18}/></li></NavLink>
        <NavLink to='/employee/borrowings'> <li className='flex items-center gap-2'>Loan And Return Book <BookOpen size={18}/></li></NavLink>
        <NavLink to='/employee/copies'> <li className='flex items-center gap-2'>Paper Copies  <Layers size={18}/></li></NavLink>
        <NavLink to='/employee/fines'> <li className='flex items-center gap-2'>Fines  <DollarSign size={18}/></li></NavLink>
        <NavLink to='/employee/seats'> <li className='flex items-center gap-2'>Seats and reservations  <Armchair size={18}/></li></NavLink>
        <NavLink to='/employee/categories'> <li className='flex items-center gap-2'>Departments  <Tag size={18}/></li></NavLink>
        <NavLink to='/employee/walk-in'> <li className='flex items-center gap-2'>Visitor Operations  <Users size={18}/></li></NavLink>
        <NavLink to='/employee/manual-books'> <li className='flex items-center gap-2'>Add Book  <PlusCircle size={18}/></li></NavLink>
      </ul>
    </div>
  )
}

export default EmployeeSideBar