import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'

import SideBar from '../components/ui/SideBar'
import { SidebarClose, SidebarOpen } from 'lucide-react'
import Header from '../components/Header'

const AdminLayout = () => {

  const [menu, setMenu] = useState(null)
  const [sideBarButtonIsClicked, setSideBarButtonIsClicked] = useState(false)

  return (

    <div
      className='flex bg-[#F6EFC5] w-full h-full relative'
      onClick={() => setMenu(null)}
    >

      {/* SIDEBAR */}

      <aside
        onClick={(e) => e.stopPropagation()}
        className={`
          relative z-50
          whitespace-nowrap
          bg-[#AAC3AD]
          transition-all duration-500 ease
          overflow-hidden
          transform-gpu
          will-change-[width]
          shrink-0

          ${sideBarButtonIsClicked
            ? 'w-64'
            : 'w-0'
          }
        `}
      >
        <SideBar />
      </aside>


      {/* SIDEBAR BUTTON */}

      <div
        className='relative z-50 text-[#122F21] cursor-pointer h-fit w-fit text-5xl p-2 shrink-0'

        onClick={(e) => {
          e.stopPropagation()
          setSideBarButtonIsClicked(prev => !prev)
        }}
      >

        {sideBarButtonIsClicked

          ? (
            <SidebarClose
              className='mt-7 text-[#122F21]'
              size={28}
            />
          )

          : (
            <SidebarOpen
              className='mt-7 text-[#122F21]'
              size={28}
            />
          )

        }

      </div>


      {/* MAIN CONTENT */}

      <div className='relative z-0 w-full mr-6 mt-1 min-w-0'>

        <header>
          <Header />
        </header>

        <Outlet
          context={{
            menu,
            setMenu
          }}
        />

      </div>

    </div>
  )
}

export default AdminLayout