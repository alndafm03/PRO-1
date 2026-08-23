import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  AlertCircle,
  Eye,
  EyeOff,
  Library,
  Lock,
  LogIn,
  Mail
} from 'lucide-react'

import api from '../api/axios'


const DASHBOARD_ROUTES = [
  {
    role: 'admin',
    route: '/'
  },
  {
    role: 'library_employee',
    route: '/employee'
  },
 {
  role: 'author_content_employee',
  route: '/content-employee/books-pending'
}

]


const Login = () => {

  const [login, setLogin] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [error, setError] =
    useState('')

  const [showPassword, setShowPassword] =
    useState(false)

  const [loading, setLoading] =
    useState(false)

  const navigate = useNavigate()


  // =====================================================
  // SESSION HELPERS
  // =====================================================

  const clearAuthSession = () => {

    sessionStorage.removeItem('token')
    sessionStorage.removeItem('isLoggedIn')
    sessionStorage.removeItem('role')
    sessionStorage.removeItem('roles')

  }


  const normalizeRoles = rawRoles => {

    if (!Array.isArray(rawRoles)) {
      return []
    }


    return rawRoles
      .map(role => {

        if (typeof role === 'string') {
          return role
        }


        return role?.name

      })
      .filter(Boolean)

  }


  const getDashboardAccess = roles => {

    /*
      لا نعتمد roles[0].

      نبحث داخل جميع أدوار المستخدم.

      الأولوية هنا فقط لتحديد أي Dashboard
      نفتحه إذا امتلك الحساب أكثر من دور Dashboard.
    */

    return DASHBOARD_ROUTES.find(
      item =>
        roles.includes(item.role)
    )

  }


  // =====================================================
  // LOGIN
  //
  // POST /auth/login
  //
  // login:
  // email OR username
  // =====================================================

  const handleLogin = async () => {

    if (
      !login.trim() ||
      !password
    ) {

      setError(
        'Please enter your email or username and password.'
      )

      return

    }


    setLoading(true)

    setError('')


    /*
      إزالة أي Session قديمة قبل
      تسجيل دخول جديد.
    */

    clearAuthSession()


    try {

      const res = await api.post(
        '/auth/login',
        {
          login: login.trim(),
          password
        }
      )


      const data =
        res.data?.data || {}


      const token =
        data.token


      const user =
        data.user || {}


      const roles =
        normalizeRoles(
          user.roles
        )


      if (!token) {

        setError(
          'The server did not return an authentication token.'
        )

        return

      }


      // ===============================================
      // FIND DASHBOARD ROLE
      // ===============================================

      const dashboardAccess =
        getDashboardAccess(
          roles
        )


      if (!dashboardAccess) {

        /*
          الحساب صحيح، لكنه Reader / Author
          وليس لديه صلاحية دخول Dashboard الإدارة.

          نخزن التوكن مؤقتًا حتى نستطيع Logout
          من الباك وعدم ترك Token غير مستخدم.
        */

        sessionStorage.setItem(
          'token',
          token
        )


        try {

          await api.post(
            '/auth/logout'
          )

        }
        catch (logoutError) {

          console.error(
            'Logout after unsupported dashboard role:',
            logoutError
          )

        }


        clearAuthSession()


        setError(
          'This account does not have access to the management dashboard.'
        )

        return

      }


      // ===============================================
      // SAVE AUTH
      // ===============================================

      sessionStorage.setItem(
        'token',
        token
      )


      sessionStorage.setItem(
        'isLoggedIn',
        'true'
      )


      /*
        role:
        الدور المستخدم لتحديد Dashboard الافتراضي.
      */

      sessionStorage.setItem(
        'role',
        dashboardAccess.role
      )


      /*
        roles:
        جميع الأدوار الحقيقية للمستخدم.

        ProtectedRoute سيستخدمها بدل
        الاعتماد على Role واحد فقط.
      */

      sessionStorage.setItem(
        'roles',
        JSON.stringify(roles)
      )


      // ===============================================
      // NAVIGATE
      // ===============================================

      navigate(
        dashboardAccess.route,
        {
          replace: true
        }
      )

    }

    catch (err) {

      console.error(
        'Login error:',
        err.response?.data ||
        err.message
      )


      clearAuthSession()


      /*
        401:
        بيانات الدخول خاطئة.

        403:
        الحساب Disabled.

        نعرض رسالة الباك نفسها.
      */

      setError(
        err.response?.data?.message ||
        'Login failed. Please check your credentials.'
      )

    }

    finally {

      setLoading(false)

    }

  }


  // =====================================================
  // JSX
  // =====================================================

  return (

    <div className='min-h-screen w-full bg-[#F6EFC5] flex items-center justify-center p-6 relative overflow-hidden'>


      {/* BACKGROUND */}

      <div className='absolute -top-32 -left-32 w-80 h-80 bg-[#AAC3AD] rounded-full opacity-60' />

      <div className='absolute -bottom-40 -right-32 w-96 h-96 bg-[#F09A79] rounded-full opacity-30' />


      {/* LOGIN CARD */}

      <div className='relative z-10 w-full max-w-5xl min-h-[600px] bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-[#566e58]/30 overflow-hidden flex flex-col md:flex-row'>


        {/* LEFT */}

        <div className='md:w-[42%] bg-[#122F21] text-[#F6EFC5] p-10 flex flex-col justify-between relative overflow-hidden'>


          <div className='absolute -top-20 -right-20 w-56 h-56 rounded-full bg-[#A6B37D] opacity-30' />

          <div className='absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#F09A79] opacity-20' />


          <div className='relative z-10'>

            <div className='w-16 h-16 rounded-2xl bg-[#F09A79] flex items-center justify-center shadow-lg shadow-black/20'>

              <Library
                size={34}
                strokeWidth={2}
              />

            </div>


            <h1 className='text-4xl font-bold mt-7 leading-tight'>

              Knowledge
              <br />
              Library

            </h1>


            <p className='mt-4 text-[#AAC3AD] leading-relaxed max-w-xs'>

              Manage library operations, books,
              authors and users from one dashboard.

            </p>

          </div>


          <div className='relative z-10 text-sm text-[#AAC3AD]'>

            Library Management System

          </div>

        </div>


        {/* RIGHT */}

        <div className='flex-1 p-8 md:p-14 flex flex-col justify-center'>


          <div className='max-w-md w-full mx-auto'>


            <div className='mb-8'>

              <p className='text-sm font-semibold text-[#F09A79] uppercase tracking-widest mb-2'>

                Welcome back

              </p>


              <h2 className='text-4xl font-bold text-[#122F21]'>

                Sign in

              </h2>


              <p className='mt-2 text-[#566e58]'>

                Enter your credentials to continue.

              </p>

            </div>


            {/* ERROR */}

            {error && (

              <div className='mb-5 flex items-start gap-3 p-3 rounded-xl bg-red-100 border border-red-200 text-red-700 text-sm'>

                <AlertCircle
                  size={18}
                  className='shrink-0 mt-0.5'
                />

                <span>
                  {error}
                </span>

              </div>

            )}


            {/* LOGIN */}

            <div className='mb-5'>

              <label className='block text-sm font-semibold text-[#122F21] mb-2'>

                Email or Username

              </label>


              <div className='relative group'>

                <Mail
                  size={20}
                  className='absolute left-4 top-1/2 -translate-y-1/2 text-[#566e58]'
                />


                <input
                  type='text'
                  autoComplete='username'
                  value={login}
                  placeholder='Email or username'
                  disabled={loading}
                  onChange={event => {

                    setLogin(
                      event.target.value
                    )

                    setError('')

                  }}
                  onKeyDown={event => {

                    if (
                      event.key === 'Enter' &&
                      !loading
                    ) {

                      handleLogin()

                    }

                  }}
                  className='w-full bg-[#F6EFC5] border border-transparent focus:border-[#F09A79] outline-none rounded-xl py-4 pl-12 pr-4 text-[#122F21] disabled:opacity-60'
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div className='mb-6'>

              <label className='block text-sm font-semibold text-[#122F21] mb-2'>

                Password

              </label>


              <div className='relative group'>

                <Lock
                  size={20}
                  className='absolute left-4 top-1/2 -translate-y-1/2 text-[#566e58]'
                />


                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  autoComplete='current-password'
                  value={password}
                  placeholder='Enter your password'
                  disabled={loading}
                  onChange={event => {

                    setPassword(
                      event.target.value
                    )

                    setError('')

                  }}
                  onKeyDown={event => {

                    if (
                      event.key === 'Enter' &&
                      !loading
                    ) {

                      handleLogin()

                    }

                  }}
                  className='w-full bg-[#F6EFC5] border border-transparent focus:border-[#F09A79] outline-none rounded-xl py-4 pl-12 pr-12 text-[#122F21] disabled:opacity-60'
                />


                <button
                  type='button'
                  disabled={loading}
                  onClick={() =>
                    setShowPassword(
                      prev => !prev
                    )
                  }
                  className='absolute right-4 top-1/2 -translate-y-1/2 text-[#566e58] hover:text-[#122F21] cursor-pointer disabled:opacity-50'
                >

                  {
                    showPassword
                      ? (
                        <EyeOff
                          size={20}
                        />
                      )
                      : (
                        <Eye
                          size={20}
                        />
                      )
                  }

                </button>

              </div>

            </div>


            {/* LOGIN BUTTON */}

            <button
              type='button'
              disabled={loading}
              onClick={handleLogin}
              className='w-full bg-[#F09A79] hover:bg-[#e88968] text-[#122F21] font-bold rounded-xl py-4 flex items-center justify-center gap-3 shadow-lg shadow-[#b46f54]/30 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed'
            >

              {loading ? (

                <>

                  <span className='w-5 h-5 border-2 border-[#122F21] border-t-transparent rounded-full animate-spin' />

                  Signing in...

                </>

              ) : (

                <>

                  Sign in

                  <LogIn size={20} />

                </>

              )}

            </button>


            <p className='text-center text-xs text-[#566e58] mt-8'>

              Library Management System

            </p>

          </div>

        </div>

      </div>

    </div>

  )

}


export default Login