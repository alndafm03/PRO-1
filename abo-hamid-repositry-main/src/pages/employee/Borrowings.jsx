import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  RefreshCw,
  RotateCcw,
  Search,
  User,
  X
} from 'lucide-react'

import {
  getBorrowings,
  registerReturn
} from '../../api/libraryEmployeeApi'


// =====================================================
// FILTERS
// =====================================================

const STATUS_FILTERS = [

  {
    value: 'all',
    label: 'All Borrowings'
  },

  {
    value: 'active',
    label: 'Active'
  },

  {
    value: 'overdue',
    label: 'Overdue'
  },

  {
    value: 'pending',
    label: 'Pending'
  },

  {
    value: 'returned',
    label: 'Returned'
  },

  {
    value: 'rejected',
    label: 'Rejected'
  },

  {
    value: 'expired',
    label: 'Expired'
  }

]


// =====================================================
// COMPONENT
// =====================================================

const Borrowings = () => {

  // ===================================================
  // DATA
  // ===================================================

  const [borrowings, setBorrowings] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [busyId, setBusyId] =
    useState(null)


  // ===================================================
  // FILTERS
  // ===================================================

  const [statusFilter, setStatusFilter] =
    useState('all')

  const [searchText, setSearchText] =
    useState('')


  // ===================================================
  // MODALS
  // ===================================================

  const [
    selectedBorrowing,
    setSelectedBorrowing
  ] = useState(null)

  const [
    returnBorrowing,
    setReturnBorrowing
  ] = useState(null)

  const [
    copyCondition,
    setCopyCondition
  ] = useState('good')


  // ===================================================
  // MESSAGE
  // ===================================================

  const [message, setMessage] =
    useState('')

  const [messageType, setMessageType] =
    useState('success')


  // ===================================================
  // PAGINATION
  // ===================================================

  const [pagination, setPagination] =
    useState({

      currentPage: 1,
      lastPage: 1,
      total: 0,
      from: 0,
      to: 0,
      perPage: 20

    })


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


  const formatMoney = value => {

    const number =
      parseFloat(value ?? 0)


    if (Number.isNaN(number)) {
      return '0'
    }


    return number.toLocaleString(
      undefined,
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    )

  }


  const formatDate = value => {

    if (!value) {
      return '—'
    }


    const date =
      new Date(value)


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value
    }


    return date.toLocaleDateString()

  }


  const formatDateTime = value => {

    if (!value) {
      return '—'
    }


    const date =
      new Date(value)


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value
    }


    return date.toLocaleString()

  }


  // ===================================================
  // DATE-ONLY HELPER
  //
  // end_date is a DATE, not datetime.
  //
  // بهذه الطريقة لا نعتبر الكتاب متأخرًا
  // أثناء نفس يوم الاستحقاق.
  // ===================================================

  const parseDateOnly = value => {

    if (!value) {
      return null
    }


    const parts =
      String(value)
        .slice(0, 10)
        .split('-')
        .map(Number)


    if (parts.length !== 3) {
      return null
    }


    const [
      year,
      month,
      day
    ] = parts


    const date =
      new Date(
        year,
        month - 1,
        day
      )


    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date

  }


  // ===================================================
  // OVERDUE
  //
  // IMPORTANT:
  // "overdue" IS NOT stored in DB.
  //
  // status remains active.
  // ===================================================

  const isOverdue = borrowing => {

    if (
      borrowing?.status !==
      'active'
    ) {
      return false
    }


    const endDate =
      parseDateOnly(
        borrowing.end_date
      )


    if (!endDate) {
      return false
    }


    const today =
      new Date()


    today.setHours(
      0,
      0,
      0,
      0
    )


    return endDate < today

  }


  const getDaysOverdue = borrowing => {

    if (!isOverdue(borrowing)) {
      return 0
    }


    const endDate =
      parseDateOnly(
        borrowing.end_date
      )


    const today =
      new Date()


    today.setHours(
      0,
      0,
      0,
      0
    )


    const difference =
      today.getTime() -
      endDate.getTime()


    return Math.floor(
      difference /
      (
        1000 *
        60 *
        60 *
        24
      )
    )

  }


  const getCustomerName =
    borrowing => {

      if (
        borrowing?.is_walk_in
      ) {
        return (
          borrowing?.user
            ?.full_name ||
          'Walk-in Customer'
        )
      }


      return (
        borrowing?.user
          ?.full_name ||
        '—'
      )

    }


  const getBookTitle =
    borrowing => {

      return (
        borrowing?.book?.title ||
        `Book #${borrowing?.book_id ?? '—'}`
      )

    }


  const getCopyCode =
    borrowing => {

      return (
        borrowing
          ?.physical_copy
          ?.copy_code ||

        borrowing
          ?.physicalCopy
          ?.copy_code ||

        (
          borrowing
            ?.physical_copy_id
            ? `#${borrowing.physical_copy_id}`
            : '—'
        )
      )

    }


  // ===================================================
  // LOAD BORROWINGS
  //
  // GET /employee/library/borrowings
  //
  // Query:
  // status
  // per_page
  // page
  //
  // overdue is NOT a backend status.
  // For overdue we request status=active,
  // then calculate overdue locally.
  // ===================================================

  const loadBorrowings = useCallback(
    async (
      page = 1,
      filter = statusFilter
    ) => {

      setLoading(true)

      setMessage('')


      try {

        const params = {

          page,

          per_page: 20

        }


        if (
          filter !== 'all'
        ) {

          params.status =
            filter === 'overdue'
              ? 'active'
              : filter

        }


        const res =
          await getBorrowings(
            params
          )


        const paginator =
          res.data?.data || {}


        const rows =
          Array.isArray(
            paginator.data
          )
            ? paginator.data
            : []


        setBorrowings(rows)


        setPagination({

          currentPage:
            paginator.current_page ??
            1,

          lastPage:
            paginator.last_page ??
            1,

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
            rows.length,

          perPage:
            paginator.per_page ??
            20

        })

      }

      catch (err) {

        console.error(
          'Borrowings loading error:',
          err
        )


        setBorrowings([])


        showMessage(
          err.response?.data?.message ||
          'Borrowings could not be loaded.',
          'error'
        )

      }

      finally {

        setLoading(false)

      }

    },
    [statusFilter]
  )


  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {

    loadBorrowings(
      1,
      statusFilter
    )

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])


  // ===================================================
  // LOCAL FILTERING
  //
  // Search is local because employee borrowing
  // endpoint has no search query.
  //
  // overdue is also calculated locally.
  // ===================================================

  const filteredBorrowings =
    useMemo(() => {

      let rows = [
        ...borrowings
      ]


      if (
        statusFilter ===
        'overdue'
      ) {

        rows =
          rows.filter(
            isOverdue
          )

      }


      /*
        Active tab means currently active
        and not overdue.

        Overdue has its own tab.
      */

      if (
        statusFilter ===
        'active'
      ) {

        rows =
          rows.filter(
            borrowing =>
              !isOverdue(
                borrowing
              )
          )

      }


      const query =
        searchText
          .trim()
          .toLowerCase()


      if (!query) {
        return rows
      }


      return rows.filter(
        borrowing => {

          const values = [

            borrowing.id,

            borrowing.user_id,

            borrowing.book_id,

            borrowing
              .physical_copy_id,

            getCustomerName(
              borrowing
            ),

            borrowing?.user
              ?.email,

            getBookTitle(
              borrowing
            ),

            getCopyCode(
              borrowing
            ),

            borrowing.book_type,

            borrowing.status

          ]
            .filter(
              value =>
                value !== null &&
                value !== undefined
            )
            .join(' ')
            .toLowerCase()


          return values.includes(
            query
          )

        }
      )

    }, [
      borrowings,
      searchText,
      statusFilter
    ])


  // ===================================================
  // OPEN RETURN
  // ===================================================

  const openReturnModal =
    borrowing => {

      setReturnBorrowing(
        borrowing
      )

      setCopyCondition(
        'good'
      )

      setMessage('')

    }


  // ===================================================
  // REGISTER RETURN
  //
  // POST
  // /employee/library/borrowings/{id}/return
  //
  // Body:
  //
  // {
  //   is_damaged: boolean
  // }
  //
  // NO:
  // copy_condition
  //
  // NO:
  // lost
  // ===================================================

  const handleConfirmReturn =
    async () => {

      if (!returnBorrowing) {
        return
      }


      const id =
        returnBorrowing.id


      const isDamaged =
        copyCondition ===
        'damaged'


      const confirmed =
        window.confirm(
          isDamaged
            ? `Register borrowing #${id} as returned with a damaged copy?`
            : `Register borrowing #${id} as returned?`
        )


      if (!confirmed) {
        return
      }


      setBusyId(id)

      setMessage('')


      try {

        const res =
          await registerReturn(
            id,
            {
              is_damaged:
                isDamaged
            }
          )


        const returned =
          res.data?.data || {}


        const fine =
          parseFloat(
            returned.fine_amount ??
            0
          )


        let successMessage =

          res.data?.message ||
          `Borrowing #${id} returned successfully.`


        if (
          !Number.isNaN(fine) &&
          fine > 0
        ) {

          successMessage +=
            ` Fine: ${formatMoney(fine)}.`

        }


        showMessage(
          successMessage
        )


        setReturnBorrowing(
          null
        )


        if (
          selectedBorrowing?.id ===
          id
        ) {

          setSelectedBorrowing(
            null
          )

        }


        /*
          إعادة الجلب أفضل من تعديل
          status محليًا لأن الباك يحسب:
          returned_at
          fine_amount
          fine_days_late
          copy status
        */

        const targetPage =

          borrowings.length === 1 &&
          pagination.currentPage > 1

            ? pagination.currentPage - 1

            : pagination.currentPage


        await loadBorrowings(
          targetPage,
          statusFilter
        )

      }

      catch (err) {

        console.error(
          'Borrowing return error:',
          err
        )


        showMessage(
          err.response?.data?.message ||
          'The return could not be registered.',
          'error'
        )

      }

      finally {

        setBusyId(null)

      }

    }


  // ===================================================
  // FILTER CHANGE
  // ===================================================

  const handleStatusChange =
    value => {

      setSearchText('')

      setStatusFilter(value)

    }


  // ===================================================
  // PAGINATION
  // ===================================================

  const goToPage = page => {

    if (
      page < 1 ||
      page > pagination.lastPage ||
      page === pagination.currentPage
    ) {
      return
    }


    setSearchText('')


    loadBorrowings(
      page,
      statusFilter
    )

  }


  // ===================================================
  // SUMMARY — CURRENT SERVER PAGE
  // ===================================================

  const pageSummary =
    useMemo(() => {

      return {

        active:
          borrowings.filter(
            borrowing =>
              borrowing.status ===
                'active' &&
              !isOverdue(
                borrowing
              )
          ).length,

        overdue:
          borrowings.filter(
            isOverdue
          ).length,

        physical:
          borrowings.filter(
            borrowing =>
              borrowing.book_type ===
              'physical'
          ).length,

        digital:
          borrowings.filter(
            borrowing =>
              borrowing.book_type ===
              'digital'
          ).length

      }

    }, [borrowings])


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

            <BookOpen
              size={27}
            />

            Borrowings

          </h1> */}


          <p className='text-sm text-[#122F21]/60 mt-1'>

            Monitor borrowings and register physical book returns.

          </p>

        </div>


        <button
          type='button'
          disabled={loading}
          onClick={() =>
            loadBorrowings(
              pagination.currentPage,
              statusFilter
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
            items-center
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
                />
              )

              : (
                <CheckCircle
                  size={20}
                />
              )
          }

          {message}

        </div>

      )}


      {/* =============================================
          FILTERS
      ============================================== */}

      <div className='bg-[#AAC3AD] rounded-2xl p-4 shadow-md flex flex-col xl:flex-row gap-4'>


        <div className='relative flex-1'>

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
            placeholder='Search current page by book, customer, copy or ID...'
            className='w-full bg-[#F6EFC5] rounded-xl py-3 pl-10 pr-4 outline-none'
          />

        </div>


        <select
          value={statusFilter}
          onChange={event =>
            handleStatusChange(
              event.target.value
            )
          }
          className='bg-[#F6EFC5] rounded-xl px-4 py-3 outline-none text-[#122F21]'
        >

          {STATUS_FILTERS.map(
            option => (

              <option
                key={option.value}
                value={option.value}
              >

                {option.label}

              </option>

            )
          )}

        </select>


        <button
          type='button'
          onClick={() => {

            setSearchText('')

            handleStatusChange(
              'all'
            )

          }}
          className='bg-[#F6EFC5] text-[#122F21] rounded-xl px-4 py-3 flex items-center justify-center gap-2 cursor-pointer'
        >

          <RotateCcw size={16} />

          Clear

        </button>

      </div>


      {/* =============================================
          SUMMARY
      ============================================== */}

      <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3'>


        <SummaryCard
          title='Active On Page'
          value={
            pageSummary.active
          }
        />


        <SummaryCard
          title='Overdue On Page'
          value={
            pageSummary.overdue
          }
          warning={
            pageSummary.overdue >
            0
          }
        />


        <SummaryCard
          title='Physical On Page'
          value={
            pageSummary.physical
          }
        />


        <SummaryCard
          title='Digital On Page'
          value={
            pageSummary.digital
          }
        />

      </div>


      {/* =============================================
          TABLE
      ============================================== */}

      <div className='bg-[#AAC3AD] rounded-2xl shadow-md overflow-hidden'>


        {loading ? (

          <div className='min-h-[350px] flex flex-col justify-center items-center gap-3 text-[#122F21]'>

            <RefreshCw
              size={32}
              className='animate-spin'
            />

            Loading borrowings...

          </div>

        ) : filteredBorrowings.length ===
          0 ? (

          <div className='min-h-[300px] flex flex-col items-center justify-center text-[#122F21]/60'>

            <BookOpen
              size={45}
              className='mb-3'
            />

            No borrowings match this view.

          </div>

        ) : (

          <div className='overflow-x-auto h-full'>

            <table className='w-full min-w-[1200px] text-[#122F21]'>


              <thead className='bg-[#A6B37D]'>

                <tr>

                  <th className='p-4 text-center'>
                    ID
                  </th>

                  <th className='p-4 text-left'>
                    Book
                  </th>

                  <th className='p-4 text-left'>
                    Customer
                  </th>

                  <th className='p-4 text-center'>
                    Type
                  </th>

                  <th className='p-4 text-center'>
                    Copy
                  </th>

                  <th className='p-4 text-center'>
                    Start
                  </th>

                  <th className='p-4 text-center'>
                    Due
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

                {filteredBorrowings.map(
                  borrowing => {

                    const overdue =
                      isOverdue(
                        borrowing
                      )


                    return (

                      <tr
                        key={borrowing.id}
                        className='border-b border-[#122F21]/10 hover:bg-[#6cb474]/30 transition'
                      >


                        <td className='p-4 text-center font-bold'>

                          #{borrowing.id}

                        </td>


                        <td className='p-4'>

                          <p className='font-bold'>

                            {
                              getBookTitle(
                                borrowing
                              )
                            }

                          </p>


                          <p className='text-xs opacity-60 mt-1'>

                            Book #
                            {
                              borrowing.book_id
                            }

                          </p>

                        </td>


                        <td className='p-4'>

                          <p className='font-medium'>

                            {
                              getCustomerName(
                                borrowing
                              )
                            }

                          </p>


                          <p className='text-xs opacity-60 mt-1'>

                            {
                              borrowing
                                ?.user
                                ?.email ||
                              (
                                borrowing
                                  .is_walk_in
                                  ? 'Walk-in'
                                  : '—'
                              )
                            }

                          </p>

                        </td>


                        <td className='p-4 text-center'>

                          <span className='bg-[#F6EFC5] px-3 py-1 rounded-lg text-xs capitalize'>

                            {
                              borrowing.book_type ||
                              '—'
                            }

                          </span>

                        </td>


                        <td className='p-4 text-center'>

                          {
                            borrowing.book_type ===
                            'physical'

                              ? getCopyCode(
                                  borrowing
                                )

                              : 'Digital'
                          }

                        </td>


                        <td className='p-4 text-center'>

                          {
                            formatDate(
                              borrowing
                                .start_date
                            )
                          }

                        </td>


                        <td className='p-4 text-center'>

                          <p>

                            {
                              formatDate(
                                borrowing
                                  .end_date
                              )
                            }

                          </p>


                          {overdue && (

                            <p className='text-xs text-red-700 font-bold mt-1'>

                              {
                                getDaysOverdue(
                                  borrowing
                                )
                              }
                              {' '}
                              day(s) late

                            </p>

                          )}

                        </td>


                        <td className='p-4 text-center'>

                          <StatusBadge
                            borrowing={
                              borrowing
                            }
                            overdue={
                              overdue
                            }
                          />

                        </td>


                        <td className='p-4'>

                          <div className='flex justify-center flex-wrap gap-2'>


                            <button
                              type='button'
                              onClick={() =>
                                setSelectedBorrowing(
                                  borrowing
                                )
                              }
                              className='bg-[#122F21] text-white px-3 py-2 rounded-lg cursor-pointer flex items-center gap-1'
                            >

                              <Eye size={15} />

                              Details

                            </button>


                            {
                              borrowing.status ===
                                'active' &&
                              borrowing.book_type ===
                                'physical' &&
                              (

                                <button
                                  type='button'
                                  disabled={
                                    busyId ===
                                    borrowing.id
                                  }
                                  onClick={() =>
                                    openReturnModal(
                                      borrowing
                                    )
                                  }
                                  className='bg-[#F09A79] text-[#122F21] px-3 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                                >

                                  Register Return

                                </button>

                              )
                            }

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

          <div className='flex flex-col sm:flex-row justify-between items-center gap-3 text-[#122F21]'>


            <p className='text-sm opacity-70'>

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

            </p>


            <div className='flex items-center gap-2'>


              <button
                type='button'
                disabled={
                  pagination.currentPage <=
                  1
                }
                onClick={() =>
                  goToPage(
                    pagination.currentPage -
                    1
                  )
                }
                className='bg-[#AAC3AD] p-2 rounded-lg cursor-pointer disabled:opacity-40'
              >

                <ChevronLeft size={20} />

              </button>


              <span className='bg-[#122F21] text-white px-4 py-2 rounded-lg'>

                Page
                {' '}
                {
                  pagination.currentPage
                }
                {' '}
                /
                {' '}
                {
                  pagination.lastPage
                }

              </span>


              <button
                type='button'
                disabled={
                  pagination.currentPage >=
                  pagination.lastPage
                }
                onClick={() =>
                  goToPage(
                    pagination.currentPage +
                    1
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
          RETURN MODAL
      ============================================== */}

      {returnBorrowing && (

        <div
          className='fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4'
          onClick={() =>
            setReturnBorrowing(
              null
            )
          }
        >

          <div
            className='bg-[#F6EFC5] rounded-2xl w-full max-w-lg shadow-xl'
            onClick={event =>
              event.stopPropagation()
            }
          >


            <div className='p-5 border-b border-[#122F21]/10 flex justify-between items-center'>

              <div>

                <h2 className='text-xl font-bold text-[#122F21]'>

                  Register Return

                </h2>


                <p className='text-sm text-[#122F21]/60 mt-1'>

                  Borrowing #
                  {
                    returnBorrowing.id
                  }

                </p>

              </div>


              <button
                type='button'
                onClick={() =>
                  setReturnBorrowing(
                    null
                  )
                }
                className='bg-[#AAC3AD] p-2 rounded-lg cursor-pointer'
              >

                <X size={20} />

              </button>

            </div>


            <div className='p-5'>


              <div className='bg-[#AAC3AD] rounded-xl p-4 mb-4'>

                <p className='font-bold text-[#122F21]'>

                  {
                    getBookTitle(
                      returnBorrowing
                    )
                  }

                </p>


                <p className='text-sm text-[#122F21]/60 mt-1'>

                  Copy:
                  {' '}
                  {
                    getCopyCode(
                      returnBorrowing
                    )
                  }

                </p>


                <p className='text-sm text-[#122F21]/60 mt-1'>

                  Customer:
                  {' '}
                  {
                    getCustomerName(
                      returnBorrowing
                    )
                  }

                </p>

              </div>


              {isOverdue(
                returnBorrowing
              ) && (

                <div className='bg-red-100 text-red-800 rounded-xl p-4 mb-4 flex gap-3'>

                  <Clock3
                    size={20}
                    className='shrink-0'
                  />


                  <div>

                    <p className='font-bold'>

                      Overdue Borrowing

                    </p>


                    <p className='text-sm mt-1'>

                      {
                        getDaysOverdue(
                          returnBorrowing
                        )
                      }
                      {' '}
                      day(s) overdue. The backend will calculate the final fine automatically when the return is registered.

                    </p>

                  </div>

                </div>

              )}


              <label className='block font-bold text-sm text-[#122F21] mb-2'>

                Physical Copy Condition

              </label>


              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>


                <button
                  type='button'
                  onClick={() =>
                    setCopyCondition(
                      'good'
                    )
                  }
                  className={`
                    p-4
                    rounded-xl
                    border-2
                    text-left
                    cursor-pointer

                    ${
                      copyCondition ===
                      'good'

                        ? 'border-green-700 bg-green-100'

                        : 'border-transparent bg-[#AAC3AD]'
                    }
                  `}
                >

                  <p className='font-bold text-[#122F21]'>

                    Good Condition

                  </p>


                  <p className='text-xs text-[#122F21]/60 mt-1'>

                    The physical copy returns to available status.

                  </p>

                </button>


                <button
                  type='button'
                  onClick={() =>
                    setCopyCondition(
                      'damaged'
                    )
                  }
                  className={`
                    p-4
                    rounded-xl
                    border-2
                    text-left
                    cursor-pointer

                    ${
                      copyCondition ===
                      'damaged'

                        ? 'border-red-700 bg-red-100'

                        : 'border-transparent bg-[#AAC3AD]'
                    }
                  `}
                >

                  <p className='font-bold text-[#122F21]'>

                    Damaged

                  </p>


                  <p className='text-xs text-[#122F21]/60 mt-1'>

                    The physical copy will be marked as damaged.

                  </p>

                </button>

              </div>


              {copyCondition ===
                'damaged' && (

                <div className='mt-4 bg-yellow-100 text-yellow-900 p-4 rounded-xl flex gap-3'>

                  <AlertTriangle
                    size={20}
                    className='shrink-0'
                  />


                  <p className='text-sm leading-6'>

                    According to the current backend behavior, when
                    <strong>
                      {' '}
                      is_damaged=true
                    </strong>
                    , the return is processed as damaged and the normal late-fine calculation is not applied.

                  </p>

                </div>

              )}


              <div className='flex justify-end gap-2 mt-5'>


                <button
                  type='button'
                  disabled={
                    busyId ===
                    returnBorrowing.id
                  }
                  onClick={() =>
                    setReturnBorrowing(
                      null
                    )
                  }
                  className='bg-gray-300 px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                >

                  Cancel

                </button>


                <button
                  type='button'
                  disabled={
                    busyId ===
                    returnBorrowing.id
                  }
                  onClick={
                    handleConfirmReturn
                  }
                  className='bg-[#122F21] text-white px-5 py-2 rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-2'
                >

                  {
                    busyId ===
                    returnBorrowing.id &&
                    (

                      <RefreshCw
                        size={16}
                        className='animate-spin'
                      />

                    )
                  }

                  Confirm Return

                </button>

              </div>

            </div>

          </div>

        </div>

      )}


      {/* =============================================
          DETAILS MODAL
      ============================================== */}

      {selectedBorrowing && (

        <BorrowingDetailsModal

          borrowing={
            selectedBorrowing
          }

          overdue={
            isOverdue(
              selectedBorrowing
            )
          }

          daysOverdue={
            getDaysOverdue(
              selectedBorrowing
            )
          }

          formatMoney={
            formatMoney
          }

          formatDate={
            formatDate
          }

          formatDateTime={
            formatDateTime
          }

          getCustomerName={
            getCustomerName
          }

          getBookTitle={
            getBookTitle
          }

          getCopyCode={
            getCopyCode
          }

          onReturn={() => {

            openReturnModal(
              selectedBorrowing
            )

            setSelectedBorrowing(
              null
            )

          }}

          onClose={() =>
            setSelectedBorrowing(
              null
            )
          }

        />

      )}

    </div>

  )

}


// =====================================================
// STATUS BADGE
// =====================================================

const StatusBadge = ({
  borrowing,
  overdue
}) => {

  if (overdue) {

    return (

      <span className='bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold'>

        Overdue

      </span>

    )

  }


  const classes = {

    active:
      'bg-green-100 text-green-700',

    pending:
      'bg-yellow-100 text-yellow-800',

    returned:
      'bg-blue-100 text-blue-700',

    rejected:
      'bg-red-100 text-red-700',

    expired:
      'bg-gray-200 text-gray-700'

  }


  return (

    <span
      className={`
        px-3
        py-1
        rounded-full
        text-xs
        font-bold
        capitalize

        ${
          classes[
            borrowing.status
          ] ||
          'bg-gray-100 text-gray-700'
        }
      `}
    >

      {
        borrowing.status ||
        'unknown'
      }

    </span>

  )

}


// =====================================================
// DETAILS MODAL
// =====================================================

const BorrowingDetailsModal = ({
  borrowing,
  overdue,
  daysOverdue,
  formatMoney,
  formatDate,
  formatDateTime,
  getCustomerName,
  getBookTitle,
  getCopyCode,
  onReturn,
  onClose
}) => {

  return (

    <div
      className='fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4'
      onClick={onClose}
    >

      <div
        className='bg-[#F6EFC5] rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto'
        onClick={event =>
          event.stopPropagation()
        }
      >


        <div className='sticky top-0 bg-[#F6EFC5] p-5 border-b border-[#122F21]/10 flex justify-between items-center'>

          <div>

            <h2 className='text-xl font-bold text-[#122F21]'>

              Borrowing #{borrowing.id}

            </h2>


            <p className='text-sm text-[#122F21]/60 mt-1'>

              {
                getBookTitle(
                  borrowing
                )
              }

            </p>

          </div>


          <button
            type='button'
            onClick={onClose}
            className='bg-[#AAC3AD] p-2 rounded-lg cursor-pointer'
          >

            <X size={20} />

          </button>

        </div>


        <div className='p-5 flex flex-col gap-5'>


          <SectionTitle
            icon={User}
            title='Customer'
          />


          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>

            <DetailItem
              label='Name'
              value={
                getCustomerName(
                  borrowing
                )
              }
            />

            <DetailItem
              label='User ID'
              value={
                borrowing.user_id
                  ? `#${borrowing.user_id}`
                  : '—'
              }
            />

            <DetailItem
              label='Email'
              value={
                borrowing
                  ?.user
                  ?.email ||
                '—'
              }
            />

            <DetailItem
              label='Walk-in'
              value={
                borrowing.is_walk_in
                  ? 'Yes'
                  : 'No'
              }
            />

          </div>


          <SectionTitle
            icon={BookOpen}
            title='Borrowing Information'
          />


          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>

            <DetailItem
              label='Book'
              value={
                getBookTitle(
                  borrowing
                )
              }
            />

            <DetailItem
              label='Type'
              value={
                borrowing.book_type
              }
            />

            <DetailItem
              label='Physical Copy'
              value={
                borrowing.book_type ===
                'physical'
                  ? getCopyCode(
                      borrowing
                    )
                  : 'Digital'
              }
            />

            <DetailItem
              label='Duration'
              value={
                borrowing.duration_days
                  ? `${borrowing.duration_days} days`
                  : '—'
              }
            />

            <DetailItem
              label='Price'
              value={
                formatMoney(
                  borrowing.price
                )
              }
            />

            <DetailItem
              label='Renewed'
              value={
                borrowing.renewed
                  ? 'Yes'
                  : 'No'
              }
            />

            <DetailItem
              label='Start Date'
              value={
                formatDate(
                  borrowing.start_date
                )
              }
            />

            <DetailItem
              label='End Date'
              value={
                formatDate(
                  borrowing.end_date
                )
              }
            />

            <DetailItem
              label='Returned At'
              value={
                formatDateTime(
                  borrowing.returned_at
                )
              }
            />

            <DetailItem
              label='Status'
              value={
                overdue
                  ? `Overdue (${daysOverdue} days)`
                  : borrowing.status
              }
            />

          </div>


          <SectionTitle
            icon={Clock3}
            title='Fine Information'
          />


          <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>

            <DetailItem
              label='Fine Amount'
              value={
                borrowing.fine_amount
                  ? formatMoney(
                      borrowing
                        .fine_amount
                    )
                  : '—'
              }
            />

            <DetailItem
              label='Late Days'
              value={
                borrowing
                  .fine_days_late ??
                (
                  overdue
                    ? daysOverdue
                    : '—'
                )
              }
            />

            <DetailItem
              label='Fine Paid'
              value={
                borrowing.fine_paid
                  ? 'Yes'
                  : 'No'
              }
            />

          </div>


          {
            borrowing.status ===
              'active' &&
            borrowing.book_type ===
              'physical' &&
            (

              <div className='flex justify-end'>

                <button
                  type='button'
                  onClick={onReturn}
                  className='bg-[#122F21] text-white px-5 py-2 rounded-lg cursor-pointer'
                >

                  Register Return

                </button>

              </div>

            )
          }

        </div>

      </div>

    </div>

  )

}


// =====================================================
// SECTION TITLE
// =====================================================

const SectionTitle = ({
  icon: Icon,
  title
}) => {

  return (

    <div className='flex items-center gap-2 text-[#122F21]'>

      <Icon size={18} />

      <h3 className='font-bold'>

        {title}

      </h3>

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


      <p className='font-medium text-[#122F21] mt-1 break-words'>

        {
          value === null ||
          value === undefined ||
          value === ''
            ? '—'
            : value
        }

      </p>

    </div>

  )

}


// =====================================================
// SUMMARY
// =====================================================

const SummaryCard = ({
  title,
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
            ? 'bg-red-100'
            : 'bg-[#A6B37D]'
        }
      `}
    >

      <p className='text-xs opacity-70'>

        {title}

      </p>


      <p className='text-2xl font-bold mt-1'>

        {value}

      </p>

    </div>

  )

}


export default Borrowings