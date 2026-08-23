import React, {
  useCallback,
  useEffect,
  useState
} from 'react'

import {
  AlertTriangle,
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Search,
  Trash2,
  User,
  Users as UsersIcon,
  X
} from 'lucide-react'

import api from '../../api/axios'


// =====================================================
// CONSTANTS
// =====================================================

const USER_ROLES = [
  {
    value: 'reader',
    label: 'Reader'
  },
  {
    value: 'author',
    label: 'Author'
  },
  {
    value: 'library_employee',
    label: 'Library Employee'
  },
  {
    value: 'author_content_employee',
    label: 'Content Employee'
  },
  {
    value: 'admin',
    label: 'Admin'
  }
]


// =====================================================
// COMPONENT
// =====================================================

const Users = () => {

  // ===================================================
  // USERS
  // ===================================================

  const [users, setUsers] = useState([])

  const [loading, setLoading] =
    useState(true)

  const [busyId, setBusyId] =
    useState(null)


  // ===================================================
  // FILTERS
  // ===================================================

  const [searchText, setSearchText] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState('all')

  const [roleFilter, setRoleFilter] =
    useState('all')


  // ===================================================
  // PAGINATION
  // ===================================================

  const [pagination, setPagination] =
    useState({
      currentPage: 1,
      lastPage: 1,
      perPage: 20,
      total: 0,
      from: 0,
      to: 0
    })


  // ===================================================
  // MESSAGE
  // ===================================================

  const [message, setMessage] =
    useState('')

  const [messageType, setMessageType] =
    useState('success')


  // ===================================================
  // USER DETAILS
  // ===================================================

  const [selectedUser, setSelectedUser] =
    useState(null)

  const [
    hasActiveObligations,
    setHasActiveObligations
  ] = useState(false)

  const [detailsLoading, setDetailsLoading] =
    useState(false)


  // ===================================================
  // HELPERS
  // ===================================================

  const showMessage = (
    text,
    type = 'success'
  ) => {

    setMessage(text)
    setMessageType(type)

  }


  const getRoleNames = (user) => {

    if (!Array.isArray(user?.roles)) {
      return []
    }


    return user.roles
      .map(role =>

        typeof role === 'string'
          ? role
          : role?.name

      )
      .filter(Boolean)

  }


  const getRoleLabel = (roleName) => {

    const role = USER_ROLES.find(
      item => item.value === roleName
    )


    return role?.label || roleName

  }


  const formatDate = (value) => {

    if (!value) {
      return '—'
    }


    const date = new Date(value)


    if (Number.isNaN(date.getTime())) {
      return value
    }


    return date.toLocaleDateString()

  }


  const formatDateTime = (value) => {

    if (!value) {
      return '—'
    }


    const date = new Date(value)


    if (Number.isNaN(date.getTime())) {
      return value
    }


    return date.toLocaleString()

  }


  // ===================================================
  // AVATAR
  //
  // Backend returns:
  // avatars/xxx.jpg
  //
  // Browser needs:
  // APP_URL/storage/avatars/xxx.jpg
  // ===================================================

  const getAvatarUrl = (path) => {

    if (!path) {
      return null
    }


    if (
      path.startsWith('http://') ||
      path.startsWith('https://')
    ) {
      return path
    }


    const apiBase =
      api.defaults.baseURL || ''


    const appBase =
      apiBase.replace(/\/api\/?$/, '')


    return (
      `${appBase}/storage/` +
      path.replace(/^\/+/, '')
    )

  }


  // ===================================================
  // GET USERS
  //
  // GET /admin/users
  //
  // Supported backend query:
  //
  // search
  // status
  // role
  // page
  // per_page
  // ===================================================

  const loadUsers = useCallback(
    async (page = 1) => {

      setLoading(true)
      setMessage('')


      try {

        const params = {
          page,
          per_page: 20
        }


        const query =
          searchText.trim()


        if (query) {
          params.search = query
        }


        if (statusFilter !== 'all') {

          params.status =
            statusFilter

        }


        if (roleFilter !== 'all') {

          params.role =
            roleFilter

        }


        const res = await api.get(
          '/admin/users',
          {
            params
          }
        )


        const paginator =
          res.data?.data || {}


        const rows =
          Array.isArray(paginator.data)
            ? paginator.data
            : []


        setUsers(rows)


        setPagination({

          currentPage:
            paginator.current_page ?? 1,

          lastPage:
            paginator.last_page ?? 1,

          perPage:
            paginator.per_page ?? 20,

          total:
            paginator.total ??
            rows.length,

          from:
            paginator.from ??
            (
              rows.length > 0
                ? 1
                : 0
            ),

          to:
            paginator.to ??
            rows.length

        })

      }

      catch (err) {

        console.error(
          'Users loading error:',
          err
        )


        setUsers([])


        showMessage(
          err.response?.data?.message ||
          'Users could not be loaded.',
          'error'
        )

      }

      finally {

        setLoading(false)

      }

    },
    [
      searchText,
      statusFilter,
      roleFilter
    ]
  )


  // ===================================================
  // SEARCH + FILTER DEBOUNCE
  // ===================================================

  useEffect(() => {

    const timeout =
      setTimeout(() => {

        loadUsers(1)

      }, 400)


    return () =>
      clearTimeout(timeout)

  }, [loadUsers])


  // ===================================================
  // GET USER DETAILS
  //
  // GET /admin/users/{user}
  //
  // Response:
  //
  // {
  //   data: {
  //     user: {...},
  //     has_active_obligations: false
  //   }
  // }
  // ===================================================

  const openUserDetails = async (user) => {

    setDetailsLoading(true)

    setSelectedUser(null)

    setHasActiveObligations(false)

    setMessage('')


    try {

      const res = await api.get(
        `/admin/users/${user.id}`
      )


      const data =
        res.data?.data || {}


      setSelectedUser(
        data.user || user
      )


      setHasActiveObligations(
        Boolean(
          data.has_active_obligations
        )
      )

    }

    catch (err) {

      console.error(
        'User details error:',
        err
      )


      showMessage(
        err.response?.data?.message ||
        'User details could not be loaded.',
        'error'
      )

    }

    finally {

      setDetailsLoading(false)

    }

  }


  // ===================================================
  // DISABLE USER
  //
  // POST /admin/users/{user}/disable
  // ===================================================

  const disableUser = async (user) => {

    const confirmed =
      window.confirm(
        `Disable "${user.full_name}"?`
      )


    if (!confirmed) {
      return
    }


    setBusyId(user.id)

    setMessage('')


    try {

      const res = await api.post(
        `/admin/users/${user.id}/disable`
      )


      setUsers(prev =>
        prev.map(item =>

          item.id === user.id

            ? {
                ...item,
                status: 'disabled'
              }

            : item

        )
      )


      if (
        selectedUser?.id === user.id
      ) {

        setSelectedUser(prev => ({
          ...prev,
          status: 'disabled'
        }))

      }


      showMessage(
        res.data?.message ||
        'User disabled successfully.'
      )

    }

    catch (err) {

      console.error(
        'Disable user error:',
        err
      )


      showMessage(
        err.response?.data?.message ||
        'User could not be disabled.',
        'error'
      )

    }

    finally {

      setBusyId(null)

    }

  }


  // ===================================================
  // ENABLE USER
  //
  // POST /admin/users/{user}/enable
  // ===================================================

  const enableUser = async (user) => {

    setBusyId(user.id)

    setMessage('')


    try {

      const res = await api.post(
        `/admin/users/${user.id}/enable`
      )


      setUsers(prev =>
        prev.map(item =>

          item.id === user.id

            ? {
                ...item,
                status: 'active'
              }

            : item

        )
      )


      if (
        selectedUser?.id === user.id
      ) {

        setSelectedUser(prev => ({
          ...prev,
          status: 'active'
        }))

      }


      showMessage(
        res.data?.message ||
        'User enabled successfully.'
      )

    }

    catch (err) {

      console.error(
        'Enable user error:',
        err
      )


      showMessage(
        err.response?.data?.message ||
        'User could not be enabled.',
        'error'
      )

    }

    finally {

      setBusyId(null)

    }

  }


  // ===================================================
  // TOGGLE STATUS
  // ===================================================

  const handleToggleUser = async (
    user
  ) => {

    if (user.status === 'active') {

      await disableUser(user)

    }

    else {

      await enableUser(user)

    }

  }


  // ===================================================
  // DELETE USER
  //
  // DELETE /admin/users/{user}
  //
  // Backend may return 422 when:
  //
  // - system account
  // - active obligations
  // ===================================================

  const handleDeleteUser = async (
    user
  ) => {

    const confirmed =
      window.confirm(
        `Delete "${user.full_name}" permanently?`
      )


    if (!confirmed) {
      return
    }


    setBusyId(user.id)

    setMessage('')


    try {

      const res = await api.delete(
        `/admin/users/${user.id}`
      )


      showMessage(
        res.data?.message ||
        'User deleted successfully.'
      )


      if (
        selectedUser?.id === user.id
      ) {

        setSelectedUser(null)

      }


      /*
        إذا حذفنا آخر عنصر من الصفحة
        نرجع للصفحة السابقة.
      */

      const targetPage =

        users.length === 1 &&
        pagination.currentPage > 1

          ? pagination.currentPage - 1

          : pagination.currentPage


      await loadUsers(targetPage)

    }

    catch (err) {

      console.error(
        'Delete user error:',
        err
      )


      /*
        Backend business rules مثل:
        لا يمكن حذف الحساب بسبب
        وجود التزامات نشطة
      */

      showMessage(
        err.response?.data?.message ||
        'User could not be deleted.',
        'error'
      )

    }

    finally {

      setBusyId(null)

    }

  }


  // ===================================================
  // PAGINATION
  // ===================================================

  const goToPage = (page) => {

    if (
      page < 1 ||
      page > pagination.lastPage ||
      page === pagination.currentPage
    ) {
      return
    }


    loadUsers(page)

  }


  // ===================================================
  // JSX
  // ===================================================

  return (

    <div className='w-full flex h-screen flex-col gap-5 pb-10'>


      {/* =============================================
          HEADER
      ============================================== */}

      <div className='flex flex-col md:flex-row gap-4 md:justify-between md:items-center'>


        <div>

          {/* <h1 className='text-2xl font-bold text-[#122F21] flex items-center gap-2'>

            <UsersIcon size={27} />

            Users Management

          </h1> */}


          <p className='text-sm text-[#122F21]/60 mt-1'>

            Search, inspect, enable,
            disable and delete user accounts.

          </p>

        </div>


        <button
          type='button'
          disabled={loading}
          onClick={() =>
            loadUsers(
              pagination.currentPage
            )
          }
          className='flex items-center justify-center gap-2 bg-[#122F21] text-white px-4 py-2 rounded-xl cursor-pointer disabled:opacity-50'
        >

          <RefreshCw
            size={17}
            className={
              loading
                ? 'animate-spin'
                : ''
            }
          />

          Refresh

        </button>

      </div>


      {/* =============================================
          MESSAGE
      ============================================== */}

      {message && (

        <div
          className={`
            rounded-xl
            p-4
            flex
            gap-3
            items-center

            ${
              messageType === 'error'

                ? 'bg-red-100 text-red-800'

                : 'bg-[#AAC3AD] text-[#122F21]'
            }
          `}
        >

          {
            messageType === 'error'

              ? (
                <AlertTriangle
                  size={20}
                />
              )

              : (
                <CheckCircle
                  size={20}
                />
              )
          }

          <span>
            {message}
          </span>

        </div>

      )}


      {/* =============================================
          SEARCH + FILTERS
      ============================================== */}

      <div className='bg-[#AAC3AD] rounded-2xl shadow-md p-4 grid grid-cols-1 md:grid-cols-3 gap-4'>


        {/* SEARCH */}

        <div>

          <label className='block text-xs text-[#122F21]/60 mb-1'>

            Search

          </label>


          <div className='relative'>

            <Search
              size={18}
              className='absolute left-3 top-1/2 -translate-y-1/2 text-[#122F21]/60'
            />


            <input
              type='text'
              value={searchText}
              onChange={event =>
                setSearchText(
                  event.target.value
                )
              }
              placeholder='Name, username, email...'
              className='w-full bg-[#F6EFC5] rounded-xl py-3 pl-10 pr-4 outline-none'
            />

          </div>

        </div>


        {/* STATUS */}

        <div>

          <label className='block text-xs text-[#122F21]/60 mb-1'>

            Status

          </label>


          <select
            value={statusFilter}
            onChange={event =>
              setStatusFilter(
                event.target.value
              )
            }
            className='w-full bg-[#F6EFC5] rounded-xl px-4 py-3 outline-none'
          >

            <option value='all'>
              All Statuses
            </option>

            <option value='active'>
              Active
            </option>

            <option value='disabled'>
              Disabled
            </option>

          </select>

        </div>


        {/* ROLE */}

        <div>

          <label className='block text-xs text-[#122F21]/60 mb-1'>

            Role

          </label>


          <select
            value={roleFilter}
            onChange={event =>
              setRoleFilter(
                event.target.value
              )
            }
            className='w-full bg-[#F6EFC5] rounded-xl px-4 py-3 outline-none'
          >

            <option value='all'>
              All Roles
            </option>


            {USER_ROLES.map(role => (

              <option
                key={role.value}
                value={role.value}
              >

                {role.label}

              </option>

            ))}

          </select>

        </div>

      </div>


      {/* =============================================
          STATISTICS
      ============================================== */}

      <div className='flex gap-3 flex-wrap'>


        <div className='bg-[#A6B37D] text-[#122F21] rounded-xl px-4 py-2'>

          Total Users:
          {' '}

          <strong>
            {pagination.total}
          </strong>

        </div>


        <div className='bg-[#A6B37D] text-[#122F21] rounded-xl px-4 py-2'>

          Current Page:
          {' '}

          <strong>
            {users.length}
          </strong>

        </div>


        <div className='bg-[#A6B37D] text-[#122F21] rounded-xl px-4 py-2'>

          Active On Page:
          {' '}

          <strong>
            {
              users.filter(
                user =>
                  user.status === 'active'
              ).length
            }
          </strong>

        </div>


        <div className='bg-[#A6B37D] text-[#122F21] rounded-xl px-4 py-2'>

          Disabled On Page:
          {' '}

          <strong>
            {
              users.filter(
                user =>
                  user.status === 'disabled'
              ).length
            }
          </strong>

        </div>

      </div>


      {/* =============================================
          TABLE
      ============================================== */}

      <div className='bg-[#AAC3AD] rounded-2xl shadow-lg overflow-hidden'>


        {loading ? (

          <div className='min-h-[350px] flex flex-col justify-center items-center gap-3 text-[#122F21]'>

            <RefreshCw
              size={32}
              className='animate-spin'
            />

            <span>
              Loading users...
            </span>

          </div>

        ) : users.length === 0 ? (

          <div className='min-h-[300px] flex flex-col justify-center items-center text-[#122F21]/70'>

            <UsersIcon
              size={45}
              className='mb-3'
            />

            <p>
              No users found.
            </p>

          </div>

        ) : (

          <div className='overflow-x-auto h-full'>

            <table className='w-full min-w-[1100px] text-[#122F21]'>


              {/* HEADER */}

              <thead className='bg-[#A6B37D]'>

                <tr>

                  <th className='p-4 text-center'>
                    User
                  </th>

                  <th className='p-4 text-left'>
                    Full Name
                  </th>

                  <th className='p-4 text-left'>
                    Username
                  </th>

                  <th className='p-4 text-left'>
                    Email
                  </th>

                  <th className='p-4 text-left'>
                    Phone
                  </th>

                  <th className='p-4 text-center'>
                    Roles
                  </th>

                  <th className='p-4 text-center'>
                    Status
                  </th>

                  <th className='p-4 text-center'>
                    Last Login
                  </th>

                  <th className='p-4 text-center'>
                    Actions
                  </th>

                </tr>

              </thead>


              {/* BODY */}

              <tbody>

                {users.map(user => {

                  const roles =
                    getRoleNames(user)

                  const avatar =
                    getAvatarUrl(
                      user.avatar
                    )


                  return (

                    <tr
                      key={user.id}
                      className='border-b border-[#122F21]/10 hover:bg-[#6cb474]/30 transition'
                    >


                      {/* AVATAR */}

                      <td className='p-3 text-center'>

                        {avatar ? (

                          <img
                            src={avatar}
                            alt={user.full_name}
                            className='w-11 h-11 rounded-full object-cover mx-auto'
                            onError={event => {

                              event.currentTarget.style.display =
                                'none'

                            }}
                          />

                        ) : (

                          <div className='w-11 h-11 mx-auto rounded-full bg-[#F6EFC5] flex justify-center items-center'>

                            <User size={20} />

                          </div>

                        )}

                      </td>


                      {/* NAME */}

                      <td className='p-4 font-bold'>

                        {
                          user.full_name ||
                          '—'
                        }

                      </td>


                      {/* USERNAME */}

                      <td className='p-4'>

                        {
                          user.username ||
                          '—'
                        }

                      </td>


                      {/* EMAIL */}

                      <td className='p-4'>

                        {
                          user.email ||
                          '—'
                        }

                      </td>


                      {/* PHONE */}

                      <td className='p-4'>

                        {
                          user.phone ||
                          '—'
                        }

                      </td>


                      {/* ROLES */}

                      <td className='p-4'>

                        <div className='flex flex-wrap justify-center gap-1'>

                          {
                            roles.length > 0

                              ? roles.map(role => (

                                  <span
                                    key={role}
                                    className='bg-[#F6EFC5] px-2 py-1 rounded-lg text-xs'
                                  >

                                    {
                                      getRoleLabel(
                                        role
                                      )
                                    }

                                  </span>

                                ))

                              : (
                                <span>
                                  —
                                </span>
                              )
                          }

                        </div>

                      </td>


                      {/* STATUS */}

                      <td className='p-4 text-center'>

                        <span
                          className={`
                            inline-flex
                            items-center
                            gap-1
                            px-3
                            py-1
                            rounded-full
                            text-xs
                            font-bold

                            ${
                              user.status ===
                              'disabled'

                                ? 'bg-red-100 text-red-700'

                                : 'bg-green-100 text-green-700'
                            }
                          `}
                        >

                          {
                            user.status ===
                            'disabled'

                              ? (
                                <Ban size={13} />
                              )

                              : (
                                <CheckCircle
                                  size={13}
                                />
                              )
                          }

                          {
                            user.status ||
                            'active'
                          }

                        </span>

                      </td>


                      {/* LAST LOGIN */}

                      <td className='p-4 text-center text-sm'>

                        {
                          formatDateTime(
                            user.last_login_at
                          )
                        }

                      </td>


                      {/* ACTIONS */}

                      <td className='p-4'>

                        <div className='flex justify-center gap-2 flex-wrap'>


                          {/* DETAILS */}

                          <button
                            type='button'
                            onClick={() =>
                              openUserDetails(
                                user
                              )
                            }
                            disabled={detailsLoading}
                            className='flex items-center gap-1 bg-[#122F21] text-white px-3 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                          >

                            <Eye size={15} />

                            Details

                          </button>


                          {/* ENABLE / DISABLE */}

                          <button
                            type='button'
                            disabled={
                              busyId ===
                              user.id
                            }
                            onClick={() =>
                              handleToggleUser(
                                user
                              )
                            }
                            className={`
                              flex
                              items-center
                              gap-1
                              px-3
                              py-2
                              rounded-lg
                              text-white
                              cursor-pointer
                              disabled:opacity-50

                              ${
                                user.status ===
                                'active'

                                  ? 'bg-orange-600'

                                  : 'bg-green-700'
                              }
                            `}
                          >

                            {
                              busyId ===
                              user.id

                                ? (
                                  <RefreshCw
                                    size={15}
                                    className='animate-spin'
                                  />
                                )

                                : user.status ===
                                  'active'

                                  ? (
                                    <Ban size={15} />
                                  )

                                  : (
                                    <CheckCircle
                                      size={15}
                                    />
                                  )
                            }

                            {
                              user.status ===
                              'active'

                                ? 'Disable'

                                : 'Enable'
                            }

                          </button>


                          {/* DELETE */}

                          <button
                            type='button'
                            disabled={
                              busyId ===
                              user.id
                            }
                            onClick={() =>
                              handleDeleteUser(
                                user
                              )
                            }
                            className='flex items-center gap-1 bg-red-700 text-white px-3 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                          >

                            <Trash2 size={15} />

                            Delete

                          </button>

                        </div>

                      </td>

                    </tr>

                  )

                })}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* =============================================
          PAGINATION
      ============================================== */}

      {
        !loading &&
        pagination.lastPage > 1 &&
        (

          <div className='flex flex-col sm:flex-row gap-3 justify-between items-center text-[#122F21]'>


            <div className='text-sm opacity-70'>

              Showing
              {' '}
              {pagination.from}
              {' '}
              to
              {' '}
              {pagination.to}
              {' '}
              of
              {' '}
              {pagination.total}
              {' '}
              users

            </div>


            <div className='flex items-center gap-2'>


              <button
                type='button'
                disabled={
                  pagination.currentPage <= 1
                }
                onClick={() =>
                  goToPage(
                    pagination.currentPage - 1
                  )
                }
                className='bg-[#AAC3AD] p-2 rounded-lg cursor-pointer disabled:opacity-40'
              >

                <ChevronLeft size={20} />

              </button>


              <div className='bg-[#122F21] text-white px-4 py-2 rounded-lg'>

                Page
                {' '}
                {pagination.currentPage}
                {' '}
                /
                {' '}
                {pagination.lastPage}

              </div>


              <button
                type='button'
                disabled={
                  pagination.currentPage >=
                  pagination.lastPage
                }
                onClick={() =>
                  goToPage(
                    pagination.currentPage + 1
                  )
                }
                className='bg-[#AAC3AD] p-2 rounded-lg cursor-pointer disabled:opacity-40'
              >

                <ChevronRight size={20} />

              </button>

            </div>

          </div>

        )
      }


      {/* =============================================
          DETAILS LOADING
      ============================================== */}

      {detailsLoading && (

        <div className='fixed inset-0 bg-black/40 z-50 flex justify-center items-center'>

          <div className='bg-[#F6EFC5] p-8 rounded-2xl flex flex-col gap-3 justify-center items-center text-[#122F21]'>

            <RefreshCw
              size={30}
              className='animate-spin'
            />

            Loading user details...

          </div>

        </div>

      )}


      {/* =============================================
          USER DETAILS MODAL
      ============================================== */}

      {selectedUser && (

        <div
          className='fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4'
          onClick={() =>
            setSelectedUser(null)
          }
        >

          <div
            className='bg-[#F6EFC5] rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'
            onClick={event =>
              event.stopPropagation()
            }
          >


            {/* HEADER */}

            <div className='sticky top-0 bg-[#F6EFC5] p-5 border-b border-[#122F21]/10 flex justify-between items-center'>

              <div>

                <h2 className='text-xl font-bold text-[#122F21]'>

                  User Details

                </h2>


                <p className='text-sm text-[#122F21]/60'>

                  #{selectedUser.id}

                </p>

              </div>


              <button
                type='button'
                onClick={() =>
                  setSelectedUser(null)
                }
                className='bg-[#AAC3AD] p-2 rounded-lg cursor-pointer'
              >

                <X size={20} />

              </button>

            </div>


            {/* CONTENT */}

            <div className='p-5 flex flex-col gap-5'>


              {/* USER */}

              <div className='flex items-center gap-4'>


                {
                  getAvatarUrl(
                    selectedUser.avatar
                  )

                    ? (

                      <img
                        src={
                          getAvatarUrl(
                            selectedUser.avatar
                          )
                        }
                        alt={
                          selectedUser.full_name
                        }
                        className='w-20 h-20 rounded-full object-cover'
                      />

                    )

                    : (

                      <div className='w-20 h-20 rounded-full bg-[#AAC3AD] flex justify-center items-center'>

                        <User size={32} />

                      </div>

                    )
                }


                <div>

                  <h3 className='text-xl font-bold text-[#122F21]'>

                    {
                      selectedUser.full_name
                    }

                  </h3>


                  <p className='text-[#122F21]/60'>

                    @
                    {
                      selectedUser.username
                    }

                  </p>

                </div>

              </div>


              {/* DETAILS */}

              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>


                <DetailItem
                  label='Email'
                  value={
                    selectedUser.email
                  }
                />


                <DetailItem
                  label='Phone'
                  value={
                    selectedUser.phone
                  }
                />


                <DetailItem
                  label='Birthday'
                  value={
                    formatDate(
                      selectedUser.birthday
                    )
                  }
                />


                <DetailItem
                  label='Status'
                  value={
                    selectedUser.status
                  }
                />


                <DetailItem
                  label='Last Login'
                  value={
                    formatDateTime(
                      selectedUser.last_login_at
                    )
                  }
                />


                <DetailItem
                  label='Created At'
                  value={
                    formatDateTime(
                      selectedUser.created_at
                    )
                  }
                />

              </div>


              {/* ROLES */}

              <div>

                <p className='font-bold text-[#122F21] mb-2'>

                  Roles

                </p>


                <div className='flex gap-2 flex-wrap'>

                  {
                    getRoleNames(
                      selectedUser
                    ).map(role => (

                      <span
                        key={role}
                        className='bg-[#AAC3AD] text-[#122F21] rounded-lg px-3 py-2 text-sm'
                      >

                        {
                          getRoleLabel(role)
                        }

                      </span>

                    ))
                  }

                </div>

              </div>


              {/* ACTIVE OBLIGATIONS */}

              <div
                className={`
                  rounded-xl
                  p-4
                  flex
                  gap-3
                  items-center

                  ${
                    hasActiveObligations

                      ? 'bg-red-100 text-red-800'

                      : 'bg-green-100 text-green-800'
                  }
                `}
              >

                {
                  hasActiveObligations

                    ? (
                      <AlertTriangle
                        size={21}
                      />
                    )

                    : (
                      <CheckCircle
                        size={21}
                      />
                    )
                }


                <div>

                  <p className='font-bold'>

                    {
                      hasActiveObligations

                        ? 'Active obligations exist'

                        : 'No active obligations'
                    }

                  </p>


                  {
                    hasActiveObligations &&
                    (

                      <p className='text-sm mt-1'>

                        The backend may prevent deletion because this account has active payments, unpaid fines, or physical books that have not been returned.

                      </p>

                    )
                  }

                </div>

              </div>


              {/* ACTIONS */}

              <div className='flex justify-end gap-2 flex-wrap'>


                <button
                  type='button'
                  disabled={
                    busyId ===
                    selectedUser.id
                  }
                  onClick={() =>
                    handleToggleUser(
                      selectedUser
                    )
                  }
                  className={`
                    px-4
                    py-2
                    rounded-lg
                    text-white
                    cursor-pointer
                    disabled:opacity-50

                    ${
                      selectedUser.status ===
                      'active'

                        ? 'bg-orange-600'

                        : 'bg-green-700'
                    }
                  `}
                >

                  {
                    selectedUser.status ===
                    'active'

                      ? 'Disable User'

                      : 'Enable User'
                  }

                </button>


                <button
                  type='button'
                  disabled={
                    busyId ===
                    selectedUser.id
                  }
                  onClick={() =>
                    handleDeleteUser(
                      selectedUser
                    )
                  }
                  className='bg-red-700 text-white px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                >

                  Delete User

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  )

}


// =====================================================
// DETAIL ITEM
// =====================================================

const DetailItem = ({
  label,
  value
}) => {

  return (

    <div className='bg-[#AAC3AD] rounded-xl p-3'>

      <p className='text-xs text-[#122F21]/60'>

        {label}

      </p>


      <p className='font-medium text-[#122F21] mt-1 break-all'>

        {value || '—'}

      </p>

    </div>

  )

}


export default Users