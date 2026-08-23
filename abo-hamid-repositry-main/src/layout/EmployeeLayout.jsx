import React from 'react'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import EmployeeSideBar from '../components/EmployeeSideBar'
import { SidebarClose, SidebarIcon, SidebarOpen, SidebarOpenIcon } from 'lucide-react'
import Header from '../components/Header'

const EmployeeLayout = () => {

  const [menu, setMenu] = useState(null)
  const [sideBarButtonIsClicked, setSideBarButtonIsClicked] = useState(false);

  return (
    <div className='flex  bg-[#F6EFC5] w-full h-screen  overflow-y-auto' onClick={()=>setMenu(null)} >

      <aside
      className={ `bg-[#AAC3AD]    transition-all duration-500 ease overflow-hidden transform-gpu will-change-[width]
        ${sideBarButtonIsClicked?'w-90':'w-0'}`}>
      <EmployeeSideBar  />
      </aside>


      <div className=' text-[#122F21] cursor-pointer h-fit w-fit text-5xl p-2 '
          onClick={()=>setSideBarButtonIsClicked(!sideBarButtonIsClicked)}
          >{(sideBarButtonIsClicked)?<SidebarClose className='mt-7  text-[#122F21]' size={28}/>:<SidebarOpen
          className='mt-7  text-[#122F21]' size={28}/>}
          </div>

      <div className='w-full mr-6 mt-1'>

        <header >
        <Header />

        </header>

        <Outlet context={{ menu,setMenu }}/>

      </div>
    </div>
  )
}

export default EmployeeLayout