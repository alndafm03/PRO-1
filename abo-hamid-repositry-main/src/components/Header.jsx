import React from 'react'

import {
  LogOut,
  UserCircle2
} from 'lucide-react'

import {
  useLocation,
  useNavigate
} from 'react-router-dom'

import api from '../api/axios'


const Header = () => {

  const navigate =
    useNavigate()

  const location =
    useLocation()


  // ===============================================
  // TITLES
  // ===============================================

  const titles = {

    // Admin

    '/':
      'Admin Dashboard',

    '/books':
      'Books Management',

    '/users':
      'Users Management',

    '/employees':
      'Employees Management',

    '/offers':
      'Offers Management',

    '/reports':
      'Reports Management',

    '/authors':
      'Authors Management',

    '/operation':
      'Operations Management',

    '/fines':
      'Fines Management',

    '/settings':
      'Settings',


    // Library Employee

    '/employee':
      'Pending Payments',

    '/employee/payments':
      'Pending Payments',

    '/employee/orders':
      'Order Items Ready',

    '/employee/borrowings':
      'Borrowings & Returns',

    '/employee/copies':
      'Book Copies',

    '/employee/fines':
      'Fines Management',

    '/employee/seats':
      'Seats & Reservations',

    '/employee/categories':
      'Categories Management',

    '/employee/walk-in':
      'Walk-in Operations',

    '/employee/manual-books':
      'Add Manual Book',


    // Content Employee

    '/content-employee':
      'Books Pending Review',

    '/content-employee/books-pending':
      'Books Pending Review',

    '/content-employee/author-requests':
      'Author Requests',

    '/content-employee/modifications':
      'Modification Requests'

  }


  // ===============================================
  // LOGOUT
  // ===============================================

  const handleLogOut =
    async () => {

      try {

        await api.post(
          '/auth/logout'
        )

      }

      catch (error) {

        console.error(
          'Logout error:',
          error.response?.data ||
          error.message
        )

      }

      finally {

        sessionStorage.removeItem(
          'token'
        )

        sessionStorage.removeItem(
          'isLoggedIn'
        )

        sessionStorage.removeItem(
          'role'
        )

        sessionStorage.removeItem(
          'roles'
        )


        navigate(
          '/login',
          {
            replace: true
          }
        )

      }

    }


  const title =
    titles[location.pathname] ||
    'Library Management System'


  return (

    <header
      className='
        flex
        justify-between
        items-center
        w-full
        gap-4

        bg-[#A6B37D]
        text-[#122F21]

        p-3
        mb-4
        mt-2

        rounded-2xl

        shadow-lg
        shadow-[#7c865b]
      '
    >


      <h1
        className='
          text-xl
          md:text-3xl
          text-[#122F21]
          p-3
          font-bold
        '
      >

        {title}

      </h1>


      <div
        className='
          relative
          group
          text-[#122F21]
          cursor-pointer
        '
      >

        <UserCircle2
          size={38}
        />


        <button
          type='button'
          onClick={
            handleLogOut
          }
          className='
            hidden
            group-hover:flex

            absolute
            top-full
            right-0

            z-50

            items-center
            gap-2

            whitespace-nowrap

            bg-[#F09A79]

            px-4
            py-2

            rounded-xl

            shadow-md
            shadow-[#c67656]
          '
        >

          Log Out

          <LogOut size={18} />

        </button>

      </div>


    </header>

  )

}


export default Header
