import React from 'react'

import {
  Navigate,
  Outlet
} from 'react-router-dom'


// =====================================================
// NORMALIZE ROLE
// =====================================================

const normalizeRole = role => {

  if (
    typeof role === 'string'
  ) {

    return role

  }


  if (
    role &&
    typeof role === 'object'
  ) {

    return role.name || null

  }


  return null

}


// =====================================================
// GET STORED ROLES
// =====================================================

const getStoredRoles = () => {

  const roles = []


  // ===============================================
  // roles[]
  // ===============================================

  try {

    const stored =
      sessionStorage.getItem(
        'roles'
      )


    if (stored) {

      const parsed =
        JSON.parse(stored)


      if (
        Array.isArray(parsed)
      ) {

        parsed.forEach(role => {

          const normalized =
            normalizeRole(role)


          if (
            normalized &&
            !roles.includes(
              normalized
            )
          ) {

            roles.push(
              normalized
            )

          }

        })

      }

    }

  }

  catch (error) {

    console.error(
      'Invalid roles in session:',
      error
    )

  }


  // ===============================================
  // LEGACY / SELECTED ROLE
  // ===============================================

  const selectedRole =
    sessionStorage.getItem(
      'role'
    )


  if (
    selectedRole &&
    !roles.includes(
      selectedRole
    )
  ) {

    roles.push(
      selectedRole
    )

  }


  return roles

}


// =====================================================
// HOME
// =====================================================

const getHomeRoute = roles => {

  const selectedRole =
    sessionStorage.getItem(
      'role'
    )


  if (
    selectedRole === 'admin' &&
    roles.includes('admin')
  ) {

    return '/'

  }


  if (
    selectedRole ===
      'library_employee' &&
    roles.includes(
      'library_employee'
    )
  ) {

    return '/employee'

  }


  if (
    selectedRole ===
      'author_content_employee' &&
    roles.includes(
      'author_content_employee'
    )
  ) {

    return '/content-employee/books-pending'

  }


  if (
    roles.includes('admin')
  ) {

    return '/'

  }


  if (
    roles.includes(
      'library_employee'
    )
  ) {

    return '/employee'

  }


  if (
    roles.includes(
      'author_content_employee'
    )
  ) {

    return '/content-employee/books-pending'

  }


  return '/login'

}


// =====================================================
// PROTECTED ROUTE
// =====================================================

const ProtectedRoute = ({
  allowedRoles = []
}) => {

  const token =
    sessionStorage.getItem(
      'token'
    )


  const loginFlag =
    sessionStorage.getItem(
      'isLoggedIn'
    )


  const roles =
    getStoredRoles()


  // ===============================================
  // AUTH
  // ===============================================

  if (
    !token ||
    loginFlag === 'false'
  ) {

    return (
      <Navigate
        to='/login'
        replace
      />
    )

  }


  // ===============================================
  // ROLE
  // ===============================================

  if (
    allowedRoles.length > 0
  ) {

    const authorized =
      allowedRoles.some(
        allowedRole =>
          roles.includes(
            allowedRole
          )
      )


    if (!authorized) {

      const destination =
        getHomeRoute(roles)


      return (
        <Navigate
          to={destination}
          replace
        />
      )

    }

  }


  return <Outlet />

}


export default ProtectedRoute
