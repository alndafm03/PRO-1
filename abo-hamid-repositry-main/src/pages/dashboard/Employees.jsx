import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCog,
  Users,
  X
} from 'lucide-react'

import api from '../../api/axios'


// =====================================================
// CONSTANTS
// =====================================================

const EMPLOYEE_TYPES = [
  'library_employee',
  'author_content_employee'
]


const EMPTY_ADD_FORM = {
  full_name: '',
  username: '',
  phone: '',
  email: '',
  password: '',
  birthday: '',
  employee_type: 'library_employee'
}


const EMPTY_EDIT_FORM = {
  full_name: '',
  phone: '',
  email: '',
  employee_type: 'library_employee'
}


// =====================================================
// COMPONENT
// =====================================================

const Employees = () => {

  // ===================================================
  // DATA STATE
  // ===================================================

  const [employees, setEmployees] = useState([])

  const [loading, setLoading] = useState(true)

  const [busyId, setBusyId] = useState(null)


  // ===================================================
  // FILTER STATE
  // ===================================================

  const [searchText, setSearchText] = useState('')

  const [typeFilter, setTypeFilter] = useState('all')


  // ===================================================
  // PAGINATION
  // ===================================================

  const [pagination, setPagination] = useState({
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

  const [message, setMessage] = useState('')

  const [messageType, setMessageType] =
    useState('success')


  // ===================================================
  // ADD EMPLOYEE
  // ===================================================

  const [showAddModal, setShowAddModal] =
    useState(false)

  const [addForm, setAddForm] =
    useState(EMPTY_ADD_FORM)

  const [addErrors, setAddErrors] =
    useState({})

  const [adding, setAdding] =
    useState(false)


  // ===================================================
  // EDIT EMPLOYEE
  // ===================================================

  const [editingEmployee, setEditingEmployee] =
    useState(null)

  const [editForm, setEditForm] =
    useState(EMPTY_EDIT_FORM)

  const [editErrors, setEditErrors] =
    useState({})

  const [savingEdit, setSavingEdit] =
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


  const getEmployeeType = (employee) => {

    if (employee?.employee_type) {
      return employee.employee_type
    }


    const roles =
      Array.isArray(employee?.roles)
        ? employee.roles
        : []


    const role = roles.find(item => {

      const name =
        typeof item === 'string'
          ? item
          : item?.name

      return EMPLOYEE_TYPES.includes(name)

    })


    if (!role) {
      return '—'
    }


    return (
      typeof role === 'string'
        ? role
        : role.name
    )

  }


  const employeeTypeLabel = (type) => {

    if (type === 'library_employee') {
      return 'Library Employee'
    }

    if (
      type ===
      'author_content_employee'
    ) {
      return 'Content Employee'
    }

    return type || '—'

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


  // ===================================================
  // GET EMPLOYEES
  //
  // GET /admin/employees
  //
  // Query:
  // page
  // per_page
  // type
  //
  // Response:
  //
  // {
  //   data: {
  //     current_page: 1,
  //     data: [...]
  //   }
  // }
  // ===================================================

  const loadEmployees = useCallback(
    async (page = 1) => {

      setLoading(true)
      setMessage('')


      try {

        const params = {
          page,
          per_page: 20
        }


        if (typeFilter !== 'all') {

          params.type = typeFilter

        }


        const res = await api.get(
          '/admin/employees',
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


        setEmployees(rows)


        setPagination({
          currentPage:
            paginator.current_page ?? 1,

          lastPage:
            paginator.last_page ?? 1,

          perPage:
            paginator.per_page ?? 20,

          total:
            paginator.total ?? rows.length,

          from:
            paginator.from ??
            (rows.length > 0 ? 1 : 0),

          to:
            paginator.to ?? rows.length
        })

      }

      catch (err) {

        console.error(
          'Employees loading error:',
          err
        )


        setEmployees([])


        showMessage(
          err.response?.data?.message ||
          'Employees could not be loaded.',
          'error'
        )

      }

      finally {

        setLoading(false)

      }

    },
    [typeFilter]
  )


  // ===================================================
  // FIRST LOAD / TYPE CHANGE
  // ===================================================

  useEffect(() => {

    loadEmployees(1)

  }, [loadEmployees])


  // ===================================================
  // LOCAL SEARCH
  //
  // Backend employee endpoint does not expose
  // a search parameter in the current contract.
  // ===================================================

  const filteredEmployees = useMemo(() => {

    const query =
      searchText
        .trim()
        .toLowerCase()


    if (!query) {
      return employees
    }


    return employees.filter(employee => {

      const values = [
        employee.full_name,
        employee.username,
        employee.phone,
        employee.email,
        getEmployeeType(employee)
      ]


      return values.some(value =>

        String(value ?? '')
          .toLowerCase()
          .includes(query)

      )

    })

  }, [
    employees,
    searchText
  ])


  // ===================================================
  // ADD FORM CHANGE
  // ===================================================

  const handleAddChange = (event) => {

    const {
      name,
      value
    } = event.target


    setAddForm(prev => ({
      ...prev,
      [name]: value
    }))


    if (addErrors[name]) {

      setAddErrors(prev => ({
        ...prev,
        [name]: undefined
      }))

    }

  }


  // ===================================================
  // VALIDATE ADD FORM
  // ===================================================

  const validateAddForm = () => {

    const errors = {}


    if (!addForm.full_name.trim()) {
      errors.full_name = [
        'Full name is required.'
      ]
    }


    if (!addForm.username.trim()) {
      errors.username = [
        'Username is required.'
      ]
    }


    if (!addForm.phone.trim()) {
      errors.phone = [
        'Phone is required.'
      ]
    }


    if (!addForm.email.trim()) {
      errors.email = [
        'Email is required.'
      ]
    }


    if (!addForm.password) {

      errors.password = [
        'Password is required.'
      ]

    }

    else if (
      addForm.password.length < 8
    ) {

      errors.password = [
        'Password must contain at least 8 characters.'
      ]

    }


    if (!addForm.birthday) {

      errors.birthday = [
        'Birthday is required.'
      ]

    }


    if (
      !EMPLOYEE_TYPES.includes(
        addForm.employee_type
      )
    ) {

      errors.employee_type = [
        'Invalid employee type.'
      ]

    }


    setAddErrors(errors)


    return (
      Object.keys(errors).length === 0
    )

  }


  // ===================================================
  // CREATE EMPLOYEE
  //
  // POST /admin/employees
  //
  // Required:
  // full_name
  // username
  // phone
  // email
  // password
  // birthday
  // employee_type
  // ===================================================

  const handleAddEmployee = async (
    event
  ) => {

    event.preventDefault()


    if (!validateAddForm()) {
      return
    }


    setAdding(true)
    setAddErrors({})
    setMessage('')


    try {

      const payload = {

        full_name:
          addForm.full_name.trim(),

        username:
          addForm.username.trim(),

        phone:
          addForm.phone.trim(),

        email:
          addForm.email.trim(),

        password:
          addForm.password,

        birthday:
          addForm.birthday,

        employee_type:
          addForm.employee_type

      }


      const res = await api.post(
        '/admin/employees',
        payload
      )


      showMessage(
        res.data?.message ||
        'Employee created successfully.'
      )


      setShowAddModal(false)

      setAddForm(EMPTY_ADD_FORM)

      setAddErrors({})


      /*
        نعيد الجلب لأن القائمة Pagination
        ولضمان ظهور الاستجابة الحقيقية من الباك.
      */

      await loadEmployees(1)

    }

    catch (err) {

      console.error(
        'Create employee error:',
        err
      )


      if (
        err.response?.status === 422 &&
        err.response?.data?.errors
      ) {

        setAddErrors(
          err.response.data.errors
        )

      }


      showMessage(
        err.response?.data?.message ||
        'Employee could not be created.',
        'error'
      )

    }

    finally {

      setAdding(false)

    }

  }


  // ===================================================
  // OPEN EDIT
  // ===================================================

  const openEditModal = (employee) => {

    setEditingEmployee(employee)

    setEditErrors({})


    const type =
      getEmployeeType(employee)


    setEditForm({

      full_name:
        employee.full_name ?? '',

      phone:
        employee.phone ?? '',

      email:
        employee.email ?? '',

      employee_type:
        EMPLOYEE_TYPES.includes(type)
          ? type
          : 'library_employee'

    })

  }


  // ===================================================
  // EDIT FORM CHANGE
  // ===================================================

  const handleEditChange = (event) => {

    const {
      name,
      value
    } = event.target


    setEditForm(prev => ({
      ...prev,
      [name]: value
    }))


    if (editErrors[name]) {

      setEditErrors(prev => ({
        ...prev,
        [name]: undefined
      }))

    }

  }


  // ===================================================
  // UPDATE EMPLOYEE
  //
  // IMPORTANT:
  //
  // Backend PUT only accepts:
  //
  // full_name
  // phone
  // email
  // employee_type
  //
  // Do NOT send:
  // username
  // password
  // birthday
  // id
  // roles
  // status
  // ===================================================

  const handleUpdateEmployee = async (
    event
  ) => {

    event.preventDefault()


    if (!editingEmployee?.id) {
      return
    }


    const errors = {}


    if (!editForm.full_name.trim()) {

      errors.full_name = [
        'Full name is required.'
      ]

    }


    if (!editForm.phone.trim()) {

      errors.phone = [
        'Phone is required.'
      ]

    }


    if (!editForm.email.trim()) {

      errors.email = [
        'Email is required.'
      ]

    }


    if (
      !EMPLOYEE_TYPES.includes(
        editForm.employee_type
      )
    ) {

      errors.employee_type = [
        'Invalid employee type.'
      ]

    }


    if (
      Object.keys(errors).length > 0
    ) {

      setEditErrors(errors)

      return

    }


    setSavingEdit(true)

    setEditErrors({})

    setMessage('')


    try {

      /*
        نرسل فقط الحقول التي يسمح بها
        Backend Update Employee Request.
      */

      const payload = {

        full_name:
          editForm.full_name.trim(),

        phone:
          editForm.phone.trim(),

        email:
          editForm.email.trim(),

        employee_type:
          editForm.employee_type

      }


      const res = await api.put(
        `/admin/employees/${editingEmployee.id}`,
        payload
      )


      showMessage(
        res.data?.message ||
        'Employee updated successfully.'
      )


      setEditingEmployee(null)


      /*
        إذا تم تغيير employee_type والفلتر
        الحالي يعتمد على النوع، يجب إعادة
        جلب الصفحة من الباك.
      */

      await loadEmployees(
        pagination.currentPage
      )

    }

    catch (err) {

      console.error(
        'Update employee error:',
        err
      )


      if (
        err.response?.status === 422 &&
        err.response?.data?.errors
      ) {

        setEditErrors(
          err.response.data.errors
        )

      }


      showMessage(
        err.response?.data?.message ||
        'Employee could not be updated.',
        'error'
      )

    }

    finally {

      setSavingEdit(false)

    }

  }


  // ===================================================
  // DELETE EMPLOYEE
  //
  // DELETE /admin/employees/{user}
  // ===================================================

  const handleDeleteEmployee = async (
    employee
  ) => {

    const confirmed =
      window.confirm(
        `Delete employee "${employee.full_name}"?`
      )


    if (!confirmed) {
      return
    }


    setBusyId(employee.id)
    setMessage('')


    try {

      const res = await api.delete(
        `/admin/employees/${employee.id}`
      )


      showMessage(
        res.data?.message ||
        'Employee deleted successfully.'
      )


      /*
        إذا كان هذا آخر عنصر في الصفحة
        نرجع للصفحة السابقة.
      */

      const targetPage =

        employees.length === 1 &&
        pagination.currentPage > 1

          ? pagination.currentPage - 1

          : pagination.currentPage


      await loadEmployees(targetPage)

    }

    catch (err) {

      console.error(
        'Delete employee error:',
        err
      )


      showMessage(
        err.response?.data?.message ||
        'Employee could not be deleted.',
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


    loadEmployees(page)

  }


  // ===================================================
  // UI
  // ===================================================

  return (

    <div className='w-full flex flex-col h-screen gap-5 pb-10'>


      {/* =============================================
          HEADER
      ============================================== */}

      <div className='flex flex-col md:flex-row gap-4 md:items-center md:justify-between'>


        <div>

          {/* <h1 className='text-2xl font-bold text-[#122F21] flex items-center gap-2'>

            <UserCog size={27} />

            Employees Management

          </h1> */}


          <p className='text-sm text-[#122F21]/60 mt-1'>

            Manage library and content employees.

          </p>

        </div>


        <div className='flex gap-2'>


          <button
            type='button'
            disabled={loading}
            onClick={() =>
              loadEmployees(
                pagination.currentPage
              )
            }
            className='flex items-center gap-2 bg-[#AAC3AD] text-[#122F21] px-4 py-2 rounded-xl cursor-pointer disabled:opacity-50'
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


          <button
            type='button'
            onClick={() => {

              setAddForm(
                EMPTY_ADD_FORM
              )

              setAddErrors({})

              setShowAddModal(true)

            }}
            className='flex items-center gap-2 bg-[#122F21] text-white px-4 py-2 rounded-xl cursor-pointer active:scale-95'
          >

            <Plus size={18} />

            Add Employee

          </button>

        </div>

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
            items-center
            gap-3

            ${
              messageType === 'error'

                ? 'bg-red-100 text-red-800'

                : 'bg-[#AAC3AD] text-[#122F21]'
            }
          `}
        >

          {
            messageType === 'error' &&
            (
              <AlertTriangle
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
          SEARCH + FILTER
      ============================================== */}

      <div className='bg-[#AAC3AD] rounded-2xl p-4 shadow-md flex flex-col md:flex-row gap-4 justify-between'>


        {/* Search */}

        <div className='flex-1 max-w-xl'>

          <label className='text-xs text-[#122F21]/60 mb-1 block'>

            Search in current page

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
              placeholder='Name, username, email or phone...'
              className='w-full bg-[#F6EFC5] rounded-xl py-3 pl-10 pr-4 outline-none'
            />

          </div>

        </div>


        {/* Employee Type */}

        <div>

          <label className='text-xs text-[#122F21]/60 mb-1 block'>

            Employee Type

          </label>


          <select
            value={typeFilter}
            onChange={event => {

              setTypeFilter(
                event.target.value
              )

              setSearchText('')

            }}
            className='bg-[#F6EFC5] text-[#122F21] rounded-xl px-4 py-3 outline-none'
          >

            <option value='all'>
              All Employees
            </option>

            <option value='library_employee'>
              Library Employees
            </option>

            <option value='author_content_employee'>
              Content Employees
            </option>

          </select>

        </div>

      </div>


      {/* =============================================
          SUMMARY
      ============================================== */}

      <div className='flex gap-3 flex-wrap'>


        <div className='bg-[#A6B37D] rounded-xl px-4 py-2 text-[#122F21]'>

          Total:
          {' '}

          <strong>
            {pagination.total}
          </strong>

        </div>


        <div className='bg-[#A6B37D] rounded-xl px-4 py-2 text-[#122F21]'>

          Current page:
          {' '}

          <strong>
            {employees.length}
          </strong>

        </div>

      </div>


      {/* =============================================
          TABLE
      ============================================== */}

      <div className='bg-[#AAC3AD] rounded-2xl shadow-lg overflow-hidden'>


        {loading ? (

          <div className='min-h-[350px] flex flex-col gap-3 justify-center items-center text-[#122F21]'>

            <RefreshCw
              size={32}
              className='animate-spin'
            />

            <span>
              Loading employees...
            </span>

          </div>

        ) : filteredEmployees.length === 0 ? (

          <div className='min-h-[300px] flex flex-col justify-center items-center text-[#122F21]/70'>

            <Users
              size={45}
              className='mb-3'
            />

            <p>
              No employees found.
            </p>

          </div>

        ) : (

          <div className='overflow-x-auto h-full'>

            <table className='w-full min-w-[1000px] text-[#122F21]'>


              <thead className='bg-[#A6B37D]'>

                <tr>

                  <th className='p-4 text-center'>
                    ID
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
                    Type
                  </th>

                  <th className='p-4 text-center'>
                    Birthday
                  </th>

                  <th className='p-4 text-center'>
                    Status
                  </th>

                  <th className='p-4 text-center'>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredEmployees.map(
                  employee => {

                    const employeeType =
                      getEmployeeType(
                        employee
                      )


                    return (

                      <tr
                        key={employee.id}
                        className='border-b border-[#122F21]/10 hover:bg-[#6cb474]/30 transition'
                      >


                        <td className='p-4 text-center'>

                          #{employee.id}

                        </td>


                        <td className='p-4 font-bold'>

                          {
                            employee.full_name ||
                            '—'
                          }

                        </td>


                        <td className='p-4'>

                          {
                            employee.username ||
                            '—'
                          }

                        </td>


                        <td className='p-4'>

                          {
                            employee.email ||
                            '—'
                          }

                        </td>


                        <td className='p-4'>

                          {
                            employee.phone ||
                            '—'
                          }

                        </td>


                        <td className='p-4 text-center'>

                          <span className='bg-[#F6EFC5] px-3 py-1 rounded-lg text-xs font-medium'>

                            {
                              employeeTypeLabel(
                                employeeType
                              )
                            }

                          </span>

                        </td>


                        <td className='p-4 text-center'>

                          {
                            formatDate(
                              employee.birthday
                            )
                          }

                        </td>


                        <td className='p-4 text-center'>

                          <span
                            className={`
                              px-3
                              py-1
                              rounded-full
                              text-xs
                              font-bold

                              ${
                                employee.status ===
                                'disabled'

                                  ? 'bg-red-100 text-red-700'

                                  : 'bg-green-100 text-green-700'
                              }
                            `}
                          >

                            {
                              employee.status ||
                              'active'
                            }

                          </span>

                        </td>


                        <td className='p-4'>

                          <div className='flex justify-center gap-2'>


                            {/* EDIT */}

                            <button
                              type='button'
                              onClick={() =>
                                openEditModal(
                                  employee
                                )
                              }
                              className='flex items-center gap-1 bg-[#122F21] text-white px-3 py-2 rounded-lg cursor-pointer active:scale-95'
                            >

                              <Edit3 size={15} />

                              Edit

                            </button>


                            {/* DELETE */}

                            <button
                              type='button'
                              disabled={
                                busyId ===
                                employee.id
                              }
                              onClick={() =>
                                handleDeleteEmployee(
                                  employee
                                )
                              }
                              className='flex items-center gap-1 bg-red-700 text-white px-3 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                            >

                              {
                                busyId ===
                                employee.id

                                  ? (
                                    <RefreshCw
                                      size={15}
                                      className='animate-spin'
                                    />
                                  )

                                  : (
                                    <Trash2
                                      size={15}
                                    />
                                  )
                              }

                              Delete

                            </button>

                          </div>

                        </td>

                      </tr>

                    )

                  }
                )}

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
              employees

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
          ADD EMPLOYEE MODAL
      ============================================== */}

      {showAddModal && (

        <Modal
          title='Add Employee'
          onClose={() => {

            if (!adding) {

              setShowAddModal(false)

            }

          }}
        >

          <form
            onSubmit={handleAddEmployee}
            className='flex flex-col gap-4'
          >


            <FormField
              label='Full Name'
              name='full_name'
              value={addForm.full_name}
              onChange={handleAddChange}
              error={addErrors.full_name}
              required
            />


            <FormField
              label='Username'
              name='username'
              value={addForm.username}
              onChange={handleAddChange}
              error={addErrors.username}
              required
            />


            <FormField
              label='Phone'
              name='phone'
              value={addForm.phone}
              onChange={handleAddChange}
              error={addErrors.phone}
              required
            />


            <FormField
              label='Email'
              name='email'
              type='email'
              value={addForm.email}
              onChange={handleAddChange}
              error={addErrors.email}
              required
            />


            <FormField
              label='Password'
              name='password'
              type='password'
              value={addForm.password}
              onChange={handleAddChange}
              error={addErrors.password}
              required
            />


            <FormField
              label='Birthday'
              name='birthday'
              type='date'
              value={addForm.birthday}
              onChange={handleAddChange}
              error={addErrors.birthday}
              required
            />


            <div>

              <label className='block text-sm font-bold text-[#122F21] mb-1'>

                Employee Type *

              </label>


              <select
                name='employee_type'
                value={
                  addForm.employee_type
                }
                onChange={
                  handleAddChange
                }
                className='w-full bg-[#AAC3AD] p-3 rounded-xl outline-none'
              >

                <option value='library_employee'>

                  Library Employee

                </option>

                <option value='author_content_employee'>

                  Content Employee

                </option>

              </select>


              <FieldError
                error={
                  addErrors.employee_type
                }
              />

            </div>


            <div className='flex justify-end gap-2 mt-2'>


              <button
                type='button'
                disabled={adding}
                onClick={() =>
                  setShowAddModal(false)
                }
                className='bg-gray-300 px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50'
              >

                Cancel

              </button>


              <button
                type='submit'
                disabled={adding}
                className='bg-[#122F21] text-white px-5 py-2 rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-2'
              >

                {
                  adding &&
                  (
                    <RefreshCw
                      size={16}
                      className='animate-spin'
                    />
                  )
                }

                {
                  adding
                    ? 'Creating...'
                    : 'Create Employee'
                }

              </button>

            </div>

          </form>

        </Modal>

      )}


      {/* =============================================
          EDIT EMPLOYEE MODAL
      ============================================== */}

      {editingEmployee && (

        <Modal
          title='Edit Employee'
          onClose={() => {

            if (!savingEdit) {

              setEditingEmployee(null)

            }

          }}
        >

          <form
            onSubmit={handleUpdateEmployee}
            className='flex flex-col gap-4'
          >


            {/* USERNAME READ ONLY */}

            <div>

              <label className='block text-sm font-bold text-[#122F21] mb-1'>

                Username

              </label>


              <input
                value={
                  editingEmployee.username ||
                  ''
                }
                disabled
                className='w-full bg-gray-200 text-gray-500 p-3 rounded-xl cursor-not-allowed'
              />


              <p className='text-xs text-[#122F21]/50 mt-1'>

                Username cannot be changed by the current backend endpoint.

              </p>

            </div>


            <FormField
              label='Full Name'
              name='full_name'
              value={
                editForm.full_name
              }
              onChange={
                handleEditChange
              }
              error={
                editErrors.full_name
              }
              required
            />


            <FormField
              label='Phone'
              name='phone'
              value={
                editForm.phone
              }
              onChange={
                handleEditChange
              }
              error={
                editErrors.phone
              }
              required
            />


            <FormField
              label='Email'
              name='email'
              type='email'
              value={
                editForm.email
              }
              onChange={
                handleEditChange
              }
              error={
                editErrors.email
              }
              required
            />


            <div>

              <label className='block text-sm font-bold text-[#122F21] mb-1'>

                Employee Type *

              </label>


              <select
                name='employee_type'
                value={
                  editForm.employee_type
                }
                onChange={
                  handleEditChange
                }
                className='w-full bg-[#AAC3AD] p-3 rounded-xl outline-none'
              >

                <option value='library_employee'>

                  Library Employee

                </option>

                <option value='author_content_employee'>

                  Content Employee

                </option>

              </select>


              <FieldError
                error={
                  editErrors.employee_type
                }
              />

            </div>

{/* 
            <div className='bg-[#A6B37D]/40 rounded-xl p-3 text-sm text-[#122F21]'>

              Password, username and birthday are not editable from this endpoint because the current backend only allows changing the full name, phone, email and employee type.

            </div> */}


            <div className='flex justify-end gap-2'>


              <button
                type='button'
                disabled={savingEdit}
                onClick={() =>
                  setEditingEmployee(null)
                }
                className='bg-gray-300 px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50'
              >

                Cancel

              </button>


              <button
                type='submit'
                disabled={savingEdit}
                className='bg-[#122F21] text-white px-5 py-2 rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-2'
              >

                {
                  savingEdit &&
                  (
                    <RefreshCw
                      size={16}
                      className='animate-spin'
                    />
                  )
                }

                {
                  savingEdit
                    ? 'Saving...'
                    : 'Save Changes'
                }

              </button>

            </div>

          </form>

        </Modal>

      )}

    </div>

  )

}


// =====================================================
// MODAL
// =====================================================

const Modal = ({
  title,
  children,
  onClose
}) => {

  return (

    <div
      className='fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4'
      onClick={onClose}
    >

      <div
        className='bg-[#F6EFC5] rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto'
        onClick={event =>
          event.stopPropagation()
        }
      >


        <div className='sticky top-0 bg-[#F6EFC5] flex justify-between items-center p-5 border-b border-[#122F21]/10 z-10'>

          <h2 className='font-bold text-xl text-[#122F21]'>

            {title}

          </h2>


          <button
            type='button'
            onClick={onClose}
            className='bg-[#AAC3AD] p-2 rounded-lg cursor-pointer'
          >

            <X size={20} />

          </button>

        </div>


        <div className='p-5'>

          {children}

        </div>

      </div>

    </div>

  )

}


// =====================================================
// FORM FIELD
// =====================================================

const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false
}) => {

  return (

    <div>

      <label className='block text-sm font-bold text-[#122F21] mb-1'>

        {label}

        {
          required
            ? ' *'
            : ''
        }

      </label>


      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className='w-full bg-[#AAC3AD] p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#122F21]'
      />


      <FieldError error={error} />

    </div>

  )

}


// =====================================================
// FIELD ERROR
// =====================================================

const FieldError = ({
  error
}) => {

  if (!error) {
    return null
  }


  const text =
    Array.isArray(error)
      ? error[0]
      : error


  return (

    <p className='text-red-700 text-xs mt-1'>

      {text}

    </p>

  )

}


export default Employees