import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  AlertTriangle,
  CheckCircle,
  FolderTree,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ToggleLeft,
  ToggleRight,
  X
} from 'lucide-react'

import {
  getCategoriesPublic,
  addCategory,
  updateCategory,
  toggleCategory
} from '../../api/libraryEmployeeApi'


// =====================================================
// COMPONENT
// =====================================================

const Categories = () => {

  // ===================================================
  // DATA
  // ===================================================

  const [
    categories,
    setCategories
  ] = useState([])

  const [loading, setLoading] =
    useState(true)

  const [busyId, setBusyId] =
    useState(null)


  // ===================================================
  // SEARCH
  // ===================================================

  const [searchText, setSearchText] =
    useState('')


  // ===================================================
  // ADD MODAL
  // ===================================================

  const [
    showAddModal,
    setShowAddModal
  ] = useState(false)

  const [
    adding,
    setAdding
  ] = useState(false)

  const [
    addForm,
    setAddForm
  ] = useState({

    name: '',

    sort_order: 0

  })

  const [
    addErrors,
    setAddErrors
  ] = useState({})


  // ===================================================
  // EDIT MODAL
  // ===================================================

  const [
    editingCategory,
    setEditingCategory
  ] = useState(null)

  const [
    editForm,
    setEditForm
  ] = useState({

    name: '',

    sort_order: 0

  })

  const [
    editErrors,
    setEditErrors
  ] = useState({})

  const [
    updating,
    setUpdating
  ] = useState(false)


  // ===================================================
  // MESSAGE
  // ===================================================

  const [message, setMessage] =
    useState('')

  const [
    messageType,
    setMessageType
  ] = useState('success')


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


  const normalizeSortOrder = value => {

    const number =
      Number(value)


    if (
      !Number.isInteger(number) ||
      number < 0
    ) {

      return null

    }


    return number

  }


  // ===================================================
  // LOAD
  //
  // GET /categories
  //
  // IMPORTANT:
  // Public endpoint.
  //
  // Returns active categories only.
  // Not paginated.
  //
  // {
  //   data: [
  //     {
  //       id,
  //       name,
  //       is_active,
  //       sort_order
  //     }
  //   ]
  // }
  // ===================================================

  const loadCategories =
    useCallback(async () => {

      setLoading(true)

      setMessage('')


      try {

        const res =
          await getCategoriesPublic()


        const rows =
          res.data?.data


        setCategories(
          Array.isArray(rows)
            ? rows
            : []
        )

      }

      catch (err) {

        console.error(
          'Categories loading error:',
          err
        )


        setCategories([])


        showMessage(
          err.response?.data?.message ||
          'Categories could not be loaded.',
          'error'
        )

      }

      finally {

        setLoading(false)

      }

    }, [])


  // ===================================================
  // FIRST LOAD
  // ===================================================

  useEffect(() => {

    loadCategories()

  }, [loadCategories])


  // ===================================================
  // SORT + SEARCH
  // ===================================================

  const filteredCategories =
    useMemo(() => {

      const query =
        searchText
          .trim()
          .toLowerCase()


      let rows = [
        ...categories
      ]


      if (query) {

        rows =
          rows.filter(
            category =>

              String(
                category.name || ''
              )
                .toLowerCase()
                .includes(query) ||

              String(
                category.id || ''
              ).includes(query) ||

              String(
                category.sort_order ?? ''
              ).includes(query)
          )

      }


      /*
        نعرض حسب sort_order الحقيقي
        ثم الاسم كـ fallback.
      */

      rows.sort(
        (a, b) => {

          const orderA =
            Number(
              a.sort_order ?? 0
            )

          const orderB =
            Number(
              b.sort_order ?? 0
            )


          if (orderA !== orderB) {

            return orderA - orderB

          }


          return String(
            a.name || ''
          ).localeCompare(
            String(
              b.name || ''
            )
          )

        }
      )


      return rows

    }, [
      categories,
      searchText
    ])


  // ===================================================
  // SUMMARY
  // ===================================================

  const summary =
    useMemo(() => {

      return {

        total:
          categories.length,

        active:
          categories.filter(
            category =>
              category.is_active !==
              false
          ).length,

        inactive:
          categories.filter(
            category =>
              category.is_active ===
              false
          ).length

      }

    }, [categories])


  // ===================================================
  // OPEN ADD
  // ===================================================

  const openAddModal = () => {

    setAddForm({

      name: '',

      sort_order: 0

    })


    setAddErrors({})

    setMessage('')

    setShowAddModal(true)

  }


  // ===================================================
  // ADD CATEGORY
  //
  // POST
  // /employee/library/categories
  //
  // {
  //   name: required + unique
  //   sort_order?: integer >= 0
  // }
  // ===================================================

  const handleAdd =
    async event => {

      event.preventDefault()


      const name =
        addForm.name.trim()


      const sortOrder =
        normalizeSortOrder(
          addForm.sort_order
        )


      const errors = {}


      if (!name) {

        errors.name =
          'Category name is required.'

      }


      if (sortOrder === null) {

        errors.sort_order =
          'Sort order must be a non-negative integer.'

      }


      if (
        Object.keys(errors)
          .length > 0
      ) {

        setAddErrors(errors)

        return

      }


      setAdding(true)

      setAddErrors({})

      setMessage('')


      try {

        const res =
          await addCategory({

            name,

            sort_order:
              sortOrder

          })


        const created =
          res.data?.data


        /*
          نضيف النتيجة مباشرة إذا أعادها
          الباك.

          ثم نبقي الحالة المحلية متزامنة.
        */

        if (
          created &&
          typeof created === 'object'
        ) {

          setCategories(prev => [

            ...prev,

            created

          ])

        }

        else {

          /*
            في حال لم يرجع data
            نعيد الجلب.
          */

          await loadCategories()

        }


        showMessage(
          res.data?.message ||
          'Category added successfully.'
        )


        setShowAddModal(false)


        setAddForm({

          name: '',

          sort_order: 0

        })

      }

      catch (err) {

        console.error(
          'Add category error:',
          err
        )


        if (
          err.response?.status === 422 &&
          err.response
            ?.data
            ?.errors
        ) {

          setAddErrors(
            err.response.data.errors
          )

        }


        showMessage(
          err.response?.data?.message ||
          'Category could not be added.',
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

  const openEditModal =
    category => {

      setEditingCategory(
        category
      )


      setEditForm({

        name:
          category.name || '',

        sort_order:
          category.sort_order ?? 0

      })


      setEditErrors({})

      setMessage('')

    }


  // ===================================================
  // UPDATE CATEGORY
  //
  // PUT
  // /employee/library/categories/{id}
  //
  // all fields = sometimes
  //
  // {
  //   name?,
  //   sort_order?
  // }
  // ===================================================

  const handleUpdate =
    async event => {

      event.preventDefault()


      if (!editingCategory) {
        return
      }


      const name =
        editForm.name.trim()


      const sortOrder =
        normalizeSortOrder(
          editForm.sort_order
        )


      const errors = {}


      if (!name) {

        errors.name =
          'Category name is required.'

      }


      if (sortOrder === null) {

        errors.sort_order =
          'Sort order must be a non-negative integer.'

      }


      if (
        Object.keys(errors)
          .length > 0
      ) {

        setEditErrors(errors)

        return

      }


      setUpdating(true)

      setEditErrors({})

      setMessage('')


      try {

        const res =
          await updateCategory(
            editingCategory.id,
            {

              name,

              sort_order:
                sortOrder

            }
          )


        const updated =
          res.data?.data


        setCategories(prev =>
          prev.map(category =>

            category.id ===
            editingCategory.id

              ? {
                  ...category,

                  name:
                    updated?.name ??
                    name,

                  sort_order:
                    updated?.sort_order ??
                    sortOrder,

                  ...(
                    updated &&
                    typeof updated ===
                      'object'

                      ? updated

                      : {}
                  )
                }

              : category

          )
        )


        showMessage(
          res.data?.message ||
          'Category updated successfully.'
        )


        setEditingCategory(
          null
        )

      }

      catch (err) {

        console.error(
          'Update category error:',
          err
        )


        if (
          err.response?.status === 422 &&
          err.response
            ?.data
            ?.errors
        ) {

          setEditErrors(
            err.response.data.errors
          )

        }


        showMessage(
          err.response?.data?.message ||
          'Category could not be updated.',
          'error'
        )

      }

      finally {

        setUpdating(false)

      }

    }


  // ===================================================
  // TOGGLE CATEGORY
  //
  // POST
  // /employee/library/categories/{id}/toggle
  //
  // NO BODY
  //
  // IMPORTANT:
  // GET /categories returns ACTIVE categories only.
  //
  // لذلك بعد تعطيل Category:
  // - نبقيها محليًا في الجدول الحالي.
  // - إذا تم Refresh الصفحة ستختفي لأن
  //   الـ public GET لا يعيد inactive categories.
  // ===================================================

  const handleToggle =
    async category => {

      const willActivate =
        category.is_active ===
        false


      const confirmed =
        window.confirm(
          willActivate

            ? `Activate category "${category.name}"?`

            : `Disable category "${category.name}"?\n\nAfter a page refresh, inactive categories cannot be listed by the current backend GET endpoint.`
        )


      if (!confirmed) {
        return
      }


      setBusyId(
        category.id
      )

      setMessage('')


      try {

        const res =
          await toggleCategory(
            category.id
          )


        const updated =
          res.data?.data


        const newState =
          typeof updated?.is_active ===
            'boolean'

            ? updated.is_active

            : !category.is_active


        /*
          مهم:
          لا نعيد GET /categories هنا
          بعد التعطيل.

          لأنه سيحذف Category المعطلة
          من الواجهة فورًا.
        */

        setCategories(prev =>
          prev.map(item =>

            item.id === category.id

              ? {
                  ...item,

                  ...(
                    updated &&
                    typeof updated ===
                      'object'

                      ? updated

                      : {}
                  ),

                  is_active:
                    newState
                }

              : item

          )
        )


        showMessage(
          res.data?.message ||
          (
            newState

              ? 'Category activated successfully.'

              : 'Category disabled successfully.'
          )
        )

      }

      catch (err) {

        console.error(
          'Toggle category error:',
          err
        )


        showMessage(
          err.response?.data?.message ||
          'Category status could not be changed.',
          'error'
        )

      }

      finally {

        setBusyId(null)

      }

    }


  // ===================================================
  // JSX
  // ===================================================

  return (

    <div className='w-full flex flex-col gap-5 pb-10'>


      {/* =============================================
          HEADER
      ============================================== */}

      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>


        <div>

          {/* <h1 className='text-2xl font-bold text-[#122F21] flex items-center gap-2'>

            <FolderTree
              size={28}
            />

            Categories

          </h1> */}


          <p className='text-sm text-[#122F21]/60 mt-1'>

            Manage book categories, their order and active state.

          </p>

        </div>


        <button
          type='button'
          onClick={
            openAddModal
          }
          className='bg-[#122F21] text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer'
        >

          <Plus size={17} />

          Add Category

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
            items-start
            gap-3

            ${
              messageType === 'error'

                ? 'bg-red-100 text-red-800'

                : 'bg-green-100 text-green-800'
            }
          `}
        >

          {
            messageType === 'error'

              ? (
                <AlertTriangle
                  size={20}
                  className='shrink-0 mt-0.5'
                />
              )

              : (
                <CheckCircle
                  size={20}
                  className='shrink-0 mt-0.5'
                />
              )
          }

          <span>
            {message}
          </span>

        </div>

      )}


      {/* =============================================
          BACKEND LIMITATION
      ============================================== */}
{/* 
      <div className='bg-yellow-100 text-yellow-900 rounded-2xl p-5 flex gap-3'>


        <AlertTriangle
          size={22}
          className='shrink-0 mt-0.5'
        />


        <div>

          <p className='font-bold'>

            Current backend limitation

          </p>


          <p className='text-sm leading-6 mt-1'>

            The only available category listing endpoint is the public
            <strong>
              {' '}
              GET /categories
            </strong>
            , and it returns active categories only.

          </p>


          <p className='text-sm leading-6 mt-2'>

            When you disable a category, this page keeps it visible until the page is refreshed so you can reactivate it. After a full refresh, the backend no longer returns that inactive category, so React cannot rediscover it.

          </p>

        </div>

      </div> */}


      {/* =============================================
          SUMMARY
      ============================================== */}

      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>


        <SummaryCard
          label='Loaded Categories'
          value={
            summary.total
          }
        />


        <SummaryCard
          label='Active'
          value={
            summary.active
          }
        />


        <SummaryCard
          label='Inactive In Current Session'
          value={
            summary.inactive
          }
          warning={
            summary.inactive > 0
          }
        />

      </div>


      {/* =============================================
          SEARCH + REFRESH
      ============================================== */}

      <div className='bg-[#AAC3AD] rounded-2xl p-4 shadow-md flex flex-col md:flex-row gap-3'>


        <div className='relative flex-1'>

          <Search
            size={18}
            className='absolute left-3 top-1/2 -translate-y-1/2 text-[#122F21]/60'
          />


          <input
            type='text'
            value={
              searchText
            }
            onChange={event =>
              setSearchText(
                event.target.value
              )
            }
            placeholder='Search category by name, ID or sort order...'
            className='w-full bg-[#F6EFC5] rounded-xl py-3 pl-10 pr-4 outline-none'
          />

        </div>


        <button
          type='button'
          disabled={loading}
          onClick={
            loadCategories
          }
          className='bg-[#F6EFC5] text-[#122F21] px-4 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50'
        >

          <RefreshCw
            size={16}
            className={
              loading
                ? 'animate-spin'
                : ''
            }
          />

          Refresh Active List

        </button>

      </div>


      {/* =============================================
          TABLE
      ============================================== */}

      <div className='bg-[#AAC3AD] rounded-2xl shadow-md overflow-hidden'>


        {loading ? (

          <div className='min-h-[320px] flex items-center justify-center gap-3 text-[#122F21]'>

            <RefreshCw
              size={30}
              className='animate-spin'
            />

            Loading categories...

          </div>

        ) : filteredCategories.length ===
          0 ? (

          <div className='min-h-[280px] flex flex-col justify-center items-center text-[#122F21]/60 text-center p-5'>

            <FolderTree
              size={45}
              className='mb-3'
            />

            {
              categories.length === 0

                ? 'There are no active categories.'

                : 'No category matches the current search.'
            }

          </div>

        ) : (

          <div className='overflow-x-auto h-full'>


            <table className='w-full min-w-[800px] text-[#122F21]'>


              <thead className='bg-[#A6B37D]'>

                <tr>

                  <th className='p-4 text-center'>
                    ID
                  </th>

                  <th className='p-4 text-left'>
                    Category Name
                  </th>

                  <th className='p-4 text-center'>
                    Sort Order
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

                {filteredCategories.map(
                  category => (

                    <tr
                      key={category.id}
                      className='border-b border-[#122F21]/10 hover:bg-[#6cb474]/30 transition'
                    >


                      {/* ID */}

                      <td className='p-4 text-center font-bold'>

                        #{category.id}

                      </td>


                      {/* NAME */}

                      <td className='p-4'>

                        <p className='font-bold'>

                          {category.name}

                        </p>

                      </td>


                      {/* SORT */}

                      <td className='p-4 text-center'>

                        <span className='bg-[#F6EFC5] px-3 py-1 rounded-lg text-sm font-bold'>

                          {
                            category.sort_order ??
                            0
                          }

                        </span>

                      </td>


                      {/* STATUS */}

                      <td className='p-4 text-center'>

                        <StatusBadge
                          active={
                            category.is_active !==
                            false
                          }
                        />

                      </td>


                      {/* ACTIONS */}

                      <td className='p-4'>


                        <div className='flex justify-center flex-wrap gap-2'>


                          <button
                            type='button'
                            disabled={
                              busyId ===
                              category.id
                            }
                            onClick={() =>
                              openEditModal(
                                category
                              )
                            }
                            className='bg-[#F6EFC5] text-[#122F21] px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50'
                          >

                            <Pencil
                              size={15}
                            />

                            Edit

                          </button>


                          <button
                            type='button'
                            disabled={
                              busyId ===
                              category.id
                            }
                            onClick={() =>
                              handleToggle(
                                category
                              )
                            }
                            className={`
                              px-3
                              py-2
                              rounded-lg
                              flex
                              items-center
                              gap-1
                              cursor-pointer
                              disabled:opacity-50

                              ${
                                category.is_active !==
                                false

                                  ? 'bg-red-700 text-white'

                                  : 'bg-green-700 text-white'
                              }
                            `}
                          >

                            {
                              busyId ===
                              category.id

                                ? (
                                  <RefreshCw
                                    size={15}
                                    className='animate-spin'
                                  />
                                )

                                : category.is_active !==
                                  false

                                  ? (
                                    <ToggleRight
                                      size={17}
                                    />
                                  )

                                  : (
                                    <ToggleLeft
                                      size={17}
                                    />
                                  )
                            }


                            {
                              category.is_active !==
                              false

                                ? 'Disable'

                                : 'Activate'
                            }

                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* =============================================
          ADD MODAL
      ============================================== */}

      {showAddModal && (

        <div
          className='fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4'
          onClick={() =>
            !adding &&
            setShowAddModal(false)
          }
        >

          <div
            className='bg-[#F6EFC5] rounded-2xl shadow-xl w-full max-w-md'
            onClick={event =>
              event.stopPropagation()
            }
          >


            <ModalHeader
              title='Add Category'
              subtitle='Create a new book category.'
              disabled={adding}
              onClose={() =>
                setShowAddModal(
                  false
                )
              }
            />


            <form
              onSubmit={
                handleAdd
              }
              className='p-5 flex flex-col gap-4'
            >


              <CategoryFields

                form={addForm}

                setForm={setAddForm}

                errors={addErrors}

                disabled={adding}

              />


              <div className='flex justify-end gap-2'>


                <button
                  type='button'
                  disabled={adding}
                  onClick={() =>
                    setShowAddModal(
                      false
                    )
                  }
                  className='bg-gray-300 px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                >

                  Cancel

                </button>


                <button
                  type='submit'
                  disabled={adding}
                  className='bg-[#122F21] text-white px-5 py-2 rounded-lg flex items-center gap-2 cursor-pointer disabled:opacity-50'
                >

                  {
                    adding

                      ? (
                        <RefreshCw
                          size={16}
                          className='animate-spin'
                        />
                      )

                      : (
                        <Plus size={16} />
                      )
                  }

                  Add Category

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =============================================
          EDIT MODAL
      ============================================== */}

      {editingCategory && (

        <div
          className='fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4'
          onClick={() =>
            !updating &&
            setEditingCategory(null)
          }
        >

          <div
            className='bg-[#F6EFC5] rounded-2xl shadow-xl w-full max-w-md'
            onClick={event =>
              event.stopPropagation()
            }
          >


            <ModalHeader
              title='Edit Category'
              subtitle={`Category #${editingCategory.id}`}
              disabled={updating}
              onClose={() =>
                setEditingCategory(
                  null
                )
              }
            />


            <form
              onSubmit={
                handleUpdate
              }
              className='p-5 flex flex-col gap-4'
            >


              <CategoryFields

                form={editForm}

                setForm={setEditForm}

                errors={editErrors}

                disabled={updating}

              />


              <div className='flex justify-end gap-2'>


                <button
                  type='button'
                  disabled={updating}
                  onClick={() =>
                    setEditingCategory(
                      null
                    )
                  }
                  className='bg-gray-300 px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                >

                  Cancel

                </button>


                <button
                  type='submit'
                  disabled={updating}
                  className='bg-[#122F21] text-white px-5 py-2 rounded-lg flex items-center gap-2 cursor-pointer disabled:opacity-50'
                >

                  {
                    updating &&
                    (
                      <RefreshCw
                        size={16}
                        className='animate-spin'
                      />
                    )
                  }

                  Save Changes

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  )

}


// =====================================================
// CATEGORY FIELDS
// =====================================================

const CategoryFields = ({
  form,
  setForm,
  errors,
  disabled
}) => {

  return (

    <>


      {/* NAME */}

      <div>

        <label className='block text-sm font-bold text-[#122F21] mb-2'>

          Category Name *

        </label>


        <input
          type='text'
          value={form.name}
          disabled={disabled}
          onChange={event =>
            setForm(prev => ({
              ...prev,

              name:
                event.target.value
            }))
          }
          placeholder='Example: Science'
          className='w-full bg-[#AAC3AD] rounded-xl p-3 outline-none disabled:opacity-60'
        />


        <FieldError
          error={
            errors?.name
          }
        />

      </div>


      {/* SORT ORDER */}

      <div>

        <label className='block text-sm font-bold text-[#122F21] mb-2'>

          Sort Order

        </label>


        <input
          type='number'
          min='0'
          step='1'
          value={
            form.sort_order
          }
          disabled={disabled}
          onChange={event =>
            setForm(prev => ({
              ...prev,

              sort_order:
                event.target.value
            }))
          }
          className='w-full bg-[#AAC3AD] rounded-xl p-3 outline-none disabled:opacity-60'
        />


        <FieldError
          error={
            errors?.sort_order
          }
        />


        <p className='text-xs text-[#122F21]/60 mt-2'>

          Lower numbers appear before higher numbers.

        </p>

      </div>

    </>

  )

}


// =====================================================
// MODAL HEADER
// =====================================================

const ModalHeader = ({
  title,
  subtitle,
  disabled,
  onClose
}) => {

  return (

    <div className='p-5 border-b border-[#122F21]/10 flex justify-between items-center'>


      <div>

        <h2 className='text-xl font-bold text-[#122F21]'>

          {title}

        </h2>


        <p className='text-sm text-[#122F21]/60 mt-1'>

          {subtitle}

        </p>

      </div>


      <button
        type='button'
        disabled={disabled}
        onClick={onClose}
        className='bg-[#AAC3AD] p-2 rounded-lg cursor-pointer disabled:opacity-50'
      >

        <X size={20} />

      </button>

    </div>

  )

}


// =====================================================
// STATUS BADGE
// =====================================================

const StatusBadge = ({
  active
}) => {

  return (

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
          active

            ? 'bg-green-100 text-green-700'

            : 'bg-red-100 text-red-700'
        }
      `}
    >

      {
        active
          ? 'Active'
          : 'Inactive'
      }

    </span>

  )

}


// =====================================================
// SUMMARY
// =====================================================

const SummaryCard = ({
  label,
  value,
  warning = false
}) => {

  return (

    <div
      className={`
        rounded-xl
        p-4
        text-[#122F21]

        ${
          warning
            ? 'bg-yellow-100'
            : 'bg-[#A6B37D]'
        }
      `}
    >

      <p className='text-xs opacity-70'>

        {label}

      </p>


      <p className='text-2xl font-bold mt-1'>

        {value}

      </p>

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


  return (

    <p className='text-red-700 text-xs mt-1'>

      {
        Array.isArray(error)
          ? error[0]
          : error
      }

    </p>

  )

}


export default Categories