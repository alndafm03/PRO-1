import React, {
  useState
} from 'react'

import {
  Outlet
} from 'react-router-dom'

import {
  SidebarClose,
  SidebarOpen
} from 'lucide-react'

import ContentEmployeeSideBar
  from '../components/ContentEmployeeSideBar'

import Header
  from '../components/Header'


const ContentEmployeeLayout = () => {

  const [
    menu,
    setMenu
  ] = useState(null)

  const [
    sidebarOpen,
    setSidebarOpen
  ] = useState(false)


  return (

    <div
      className='
        flex
        min-h-screen
        w-full
        bg-[#F6EFC5]
        overflow-x-hidden
      '
      onClick={() =>
        setMenu(null)
      }
    >


      {/* =========================================
          SIDEBAR
      ========================================== */}

      <aside
        onClick={event =>
          event.stopPropagation()
        }
        className={`
          shrink-0
          whitespace-nowrap
          bg-[#AAC3AD]
          transition-all
          duration-300
          ease-in-out
          overflow-hidden

          ${
            sidebarOpen
              ? 'w-64'
              : 'w-0'
          }
        `}
      >

        <ContentEmployeeSideBar />

      </aside>


      {/* =========================================
          SIDEBAR BUTTON
      ========================================== */}

      <div
        className='
          shrink-0
          h-fit
          p-2
          cursor-pointer
          text-[#122F21]
        '
        onClick={event => {

          event.stopPropagation()

          setSidebarOpen(
            previous =>
              !previous
          )

        }}
      >

        {
          sidebarOpen

            ? (
              <SidebarClose
                className='mt-7'
                size={28}
              />
            )

            : (
              <SidebarOpen
                className='mt-7'
                size={28}
              />
            )
        }

      </div>


      {/* =========================================
          MAIN
      ========================================== */}

      <main
        className='
          flex-1
          min-w-0
          mr-6
          mt-1
          pb-8
        '
      >


        <Header />


        <Outlet
          context={{
            menu,
            setMenu
          }}
        />


      </main>

    </div>

  )

}


export default ContentEmployeeLayout
