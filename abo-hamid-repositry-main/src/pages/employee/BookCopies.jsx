import React, {
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  AlertTriangle,
  BookCopy,
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Search,
  X
} from 'lucide-react'

import {
  searchBooksPublic,
  getBookCopies,
  addBookCopy,
  updateBookCopy
} from '../../api/libraryEmployeeApi'


// =====================================================
// CONSTANTS
// =====================================================

const PURPOSE_OPTIONS = [

  {
    value: 'sale',
    label: 'For Sale'
  },

  {
    value: 'borrowing',
    label: 'For Borrowing'
  }

]


const MANUAL_STATUS_OPTIONS = [

  {
    value: 'available',
    label: 'Available'
  },

  {
    value: 'damaged',
    label: 'Damaged'
  },

  {
    value: 'lost',
    label: 'Lost'
  }

]


// =====================================================
// COMPONENT
// =====================================================

const BookCopies = () => {

  // ===================================================
  // BOOK SEARCH
  // ===================================================

  const [query, setQuery] =
    useState('')

  const [books, setBooks] =
    useState([])

  const [searching, setSearching] =
    useState(false)

  const [hasSearched, setHasSearched] =
    useState(false)


  // ===================================================
  // SELECTED BOOK
  // ===================================================

  const [
    selectedBook,
    setSelectedBook
  ] = useState(null)


  // ===================================================
  // COPIES
  // ===================================================

  const [copies, setCopies] =
    useState([])

  const [loadingCopies, setLoadingCopies] =
    useState(false)

  const [copyPage, setCopyPage] =
    useState(1)

  const [
    purposeFilter,
    setPurposeFilter
  ] = useState('all')

  const [
    statusFilter,
    setStatusFilter
  ] = useState('all')


  // ===================================================
  // PAGINATION
  // ===================================================

  const [
    copiesPagination,
    setCopiesPagination
  ] = useState({

    currentPage: 1,
    lastPage: 1,
    total: 0,
    from: 0,
    to: 0

  })


  // ===================================================
  // ADD COPY
  // ===================================================

  const [showAddForm, setShowAddForm] =
    useState(false)

  const [savingCopy, setSavingCopy] =
    useState(false)

  const [newCopy, setNewCopy] =
    useState({

      purpose: 'sale',

      copy_code: ''

    })


  // ===================================================
  // STATUS UPDATE
  // ===================================================

  const [busyCopyId, setBusyCopyId] =
    useState(null)


  // ===================================================
  // MESSAGES
  // ===================================================

  const [message, setMessage] =
    useState('')

  const [messageType, setMessageType] =
    useState('success')

  const [fieldErrors, setFieldErrors] =
    useState({})


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


  const getAuthorName = book => {

    return (
      book?.author?.full_name ||
      book?.author_name ||
      '—'
    )

  }


  // ===================================================
  // SEARCH BOOKS
  //
  // GET /search
  //
  // Actual response:
  //
  // {
  //   data: {
  //     books: {
  //       current_page,
  //       data: [...]
  //     }
  //   }
  // }
  // ===================================================

  const handleSearch =
    async event => {

      event.preventDefault()


      const searchValue =
        query.trim()


      if (!searchValue) {

        setBooks([])

        setHasSearched(false)

        showMessage(
          'Enter a book title or search term.',
          'error'
        )

        return

      }


      setSearching(true)

      setMessage('')

      setHasSearched(true)


      try {

        const res =
          await searchBooksPublic(
            searchValue,
            {
              per_page: 100
            }
          )


        const booksPaginator =
          res.data
            ?.data
            ?.books


        const rows =
          Array.isArray(
            booksPaginator?.data
          )
            ? booksPaginator.data
            : []


        /*
          إدارة النسخ الفيزيائية لا معنى لها
          للكتاب الرقمي فقط.

          لذلك نعرض physical أو both.
        */

        const physicalBooks =
          rows.filter(
            book =>
              book.book_type ===
                'physical' ||
              book.book_type ===
                'both'
          )


        setBooks(
          physicalBooks
        )

      }

      catch (err) {

        console.error(
          'Book search error:',
          err
        )


        setBooks([])


        showMessage(
          err.response?.data?.message ||
          'Books could not be searched.',
          'error'
        )

      }

      finally {

        setSearching(false)

      }

    }


  // ===================================================
  // LOAD COPIES
  //
  // GET
  // /employee/library/books/{book}/copies
  //
  // Query:
  // purpose
  // status
  // per_page
  // page
  // ===================================================

  const loadCopies =
    async (
      bookId,
      page = 1
    ) => {

      if (!bookId) {
        return
      }


      setLoadingCopies(true)

      setMessage('')


      try {

        const params = {

          page,

          per_page: 20

        }


        if (
          purposeFilter !==
          'all'
        ) {

          params.purpose =
            purposeFilter

        }


        if (
          statusFilter !==
          'all'
        ) {

          params.status =
            statusFilter

        }


        const res =
          await getBookCopies(
            bookId,
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


        setCopies(rows)


        setCopiesPagination({

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
            rows.length

        })

      }

      catch (err) {

        console.error(
          'Copies loading error:',
          err
        )


        setCopies([])


        showMessage(
          err.response?.data?.message ||
          'Physical copies could not be loaded.',
          'error'
        )

      }

      finally {

        setLoadingCopies(false)

      }

    }


  // ===================================================
  // RELOAD WHEN COPY VIEW CHANGES
  // ===================================================

  useEffect(() => {

    if (!selectedBook?.id) {
      return
    }


    loadCopies(
      selectedBook.id,
      copyPage
    )

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedBook?.id,
    copyPage,
    purposeFilter,
    statusFilter
  ])


  // ===================================================
  // SELECT BOOK
  // ===================================================

  const selectBook = book => {

    setSelectedBook(book)

    setCopies([])

    setCopyPage(1)

    setPurposeFilter('all')

    setStatusFilter('all')

    setShowAddForm(false)

    setMessage('')

  }


  // ===================================================
  // BACK TO SEARCH
  // ===================================================

  const handleBack = () => {

    setSelectedBook(null)

    setCopies([])

    setShowAddForm(false)

    setPurposeFilter('all')

    setStatusFilter('all')

    setCopyPage(1)

    setMessage('')

  }


  // ===================================================
  // ADD COPY
  //
  // POST
  // /employee/library/books/{book}/copies
  //
  // Body:
  //
  // {
  //   purpose: sale | borrowing,
  //   copy_code?: string
  // }
  //
  // NO shelf_location.
  // ===================================================

  const handleAddCopy =
    async event => {

      event.preventDefault()


      if (!selectedBook) {
        return
      }


      setFieldErrors({})

      setMessage('')


      const code =
        newCopy.copy_code.trim()


      if (
        code.length > 100
      ) {

        setFieldErrors({
          copy_code:
            'Copy code may not exceed 100 characters.'
        })

        return

      }


      const payload = {

        purpose:
          newCopy.purpose

      }


      /*
        copy_code اختياري.
        لا نرسل String فارغ بلا داعٍ.
      */

      if (code) {

        payload.copy_code =
          code

      }


      setSavingCopy(true)


      try {

        const res =
          await addBookCopy(
            selectedBook.id,
            payload
          )


        showMessage(
          res.data?.message ||
          'Physical copy added successfully.'
        )


        setShowAddForm(false)


        setNewCopy({

          purpose: 'sale',

          copy_code: ''

        })


        /*
          نعيد الجلب من الباك بدل
          اختراع شكل النسخة محليًا.
        */

        setCopyPage(1)


        await loadCopies(
          selectedBook.id,
          1
        )

      }

      catch (err) {

        console.error(
          'Add copy error:',
          err
        )


        if (
          err.response?.status ===
            422 &&
          err.response
            ?.data
            ?.errors
        ) {

          setFieldErrors(
            err.response
              .data
              .errors
          )

        }


        showMessage(
          err.response?.data?.message ||
          'The physical copy could not be added.',
          'error'
        )

      }

      finally {

        setSavingCopy(false)

      }

    }


  // ===================================================
  // UPDATE STATUS
  //
  // PUT
  // /employee/library/copies/{copy}
  //
  // Body:
  //
  // {
  //   status:
  //     available |
  //     damaged |
  //     lost
  // }
  //
  // borrowed/sold are system-managed.
  // ===================================================

  const handleUpdateStatus =
    async (
      copy,
      nextStatus
    ) => {

      if (
        copy.status ===
        nextStatus
      ) {
        return
      }


      if (
        ![
          'available',
          'damaged',
          'lost'
        ].includes(
          nextStatus
        )
      ) {

        showMessage(
          'This status cannot be set manually.',
          'error'
        )

        return

      }


      const confirmed =
        window.confirm(
          `Change copy ${copy.copy_code || `#${copy.id}`} from "${copy.status}" to "${nextStatus}"?`
        )


      if (!confirmed) {
        return
      }


      setBusyCopyId(
        copy.id
      )

      setMessage('')


      try {

        const res =
          await updateBookCopy(
            copy.id,
            {
              status:
                nextStatus
            }
          )


        const updated =
          res.data?.data


        setCopies(prev =>
          prev.map(item =>

            item.id ===
            copy.id

              ? {
                  ...item,

                  ...(
                    updated &&
                    typeof updated ===
                      'object'

                      ? updated

                      : {}
                  ),

                  status:
                    updated?.status ||
                    nextStatus
                }

              : item

          )
        )


        showMessage(
          res.data?.message ||
          'Copy status updated successfully.'
        )

      }

      catch (err) {

        console.error(
          'Copy status update error:',
          err
        )


        showMessage(
          err.response?.data?.message ||
          'Copy status could not be updated.',
          'error'
        )

      }

      finally {

        setBusyCopyId(null)

      }

    }


  // ===================================================
  // FILTER CHANGES
  // ===================================================

  const handlePurposeFilter =
    value => {

      setCopyPage(1)

      setPurposeFilter(
        value
      )

    }


  const handleStatusFilter =
    value => {

      setCopyPage(1)

      setStatusFilter(
        value
      )

    }


  // ===================================================
  // COPY SUMMARY — CURRENT PAGE
  // ===================================================

  const copySummary =
    useMemo(() => {

      const result = {

        available: 0,
        borrowed: 0,
        sold: 0,
        unavailable: 0

      }


      copies.forEach(copy => {

        if (
          copy.status ===
          'available'
        ) {

          result.available += 1

        }


        else if (
          copy.status ===
          'borrowed'
        ) {

          result.borrowed += 1

        }


        else if (
          copy.status ===
          'sold'
        ) {

          result.sold += 1

        }


        else {

          result.unavailable += 1

        }

      })


      return result

    }, [copies])


  // ===================================================
  // JSX
  // ===================================================

  return (

    <div className='w-full flex flex-col gap-5 pb-10'>


      {/* =============================================
          HEADER
      ============================================== */}

      <div>

        {/* <h1 className='text-2xl font-bold text-[#122F21] flex items-center gap-2'>

          <BookCopy size={28} />

          Physical Book Copies

        </h1> */}


        <p className='text-sm text-[#122F21]/60 mt-1'>

          Search published physical books and manage their inventory copies.

        </p>

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
          BOOK SEARCH
      ============================================== */}

      {!selectedBook && (

        <div className='bg-[#AAC3AD] rounded-2xl shadow-md p-5'>


          <form
            onSubmit={
              handleSearch
            }
            className='flex flex-col md:flex-row gap-3'
          >


            <div className='relative flex-1'>

              <Search
                size={18}
                className='absolute left-3 top-1/2 -translate-y-1/2 text-[#122F21]/60'
              />


              <input
                type='text'
                value={query}
                disabled={searching}
                onChange={event =>
                  setQuery(
                    event.target.value
                  )
                }
                placeholder='Search for a physical book...'
                className='w-full bg-[#F6EFC5] rounded-xl py-3 pl-10 pr-4 outline-none disabled:opacity-60'
              />

            </div>


            <button
              type='submit'
              disabled={
                searching ||
                !query.trim()
              }
              className='bg-[#122F21] text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50'
            >

              {
                searching

                  ? (
                    <RefreshCw
                      size={17}
                      className='animate-spin'
                    />
                  )

                  : (
                    <Search
                      size={17}
                    />
                  )
              }

              Search

            </button>

          </form>


          {/* RESULTS */}

          {searching ? (

            <div className='py-12 flex justify-center items-center gap-3 text-[#122F21]'>

              <RefreshCw
                className='animate-spin'
                size={24}
              />

              Searching...

            </div>

          ) : books.length > 0 ? (

            <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-5'>


              {books.map(book => (

                <button
                  type='button'
                  key={book.id}
                  onClick={() =>
                    selectBook(book)
                  }
                  className='bg-[#F6EFC5] rounded-xl p-4 text-left cursor-pointer hover:ring-2 hover:ring-[#122F21] transition'
                >

                  <div className='flex items-start gap-3'>


                    <div className='bg-[#A6B37D] p-3 rounded-xl shrink-0'>

                      <BookOpen
                        size={21}
                      />

                    </div>


                    <div className='min-w-0'>

                      <p className='font-bold text-[#122F21] truncate'>

                        {
                          book.title ||
                          `Book #${book.id}`
                        }

                      </p>


                      <p className='text-xs text-[#122F21]/60 mt-1'>

                        {
                          getAuthorName(
                            book
                          )
                        }

                      </p>


                      <div className='flex gap-2 mt-3'>

                        <span className='bg-[#AAC3AD] text-[#122F21] text-xs px-2 py-1 rounded-lg'>

                          #{book.id}

                        </span>


                        <span className='bg-[#AAC3AD] text-[#122F21] text-xs px-2 py-1 rounded-lg capitalize'>

                          {
                            book.book_type
                          }

                        </span>

                      </div>

                    </div>

                  </div>

                </button>

              ))}

            </div>

          ) : hasSearched ? (

            <div className='text-center py-10 text-[#122F21]/60'>

              No physical or hybrid books matched this search.

            </div>

          ) : (

            <div className='text-center py-10 text-[#122F21]/60'>

              Search for a book to manage its physical copies.

            </div>

          )}

        </div>

      )}


      {/* =============================================
          SELECTED BOOK
      ============================================== */}

      {selectedBook && (

        <>


          {/* BOOK HEADER */}

          <div className='bg-[#AAC3AD] rounded-2xl shadow-md p-5'>


            <div className='flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4'>


              <div>

                <p className='text-xs text-[#122F21]/60'>

                  Managing Copies

                </p>


                <h2 className='text-xl font-bold text-[#122F21] mt-1'>

                  {selectedBook.title}

                </h2>


                <p className='text-sm text-[#122F21]/60 mt-1'>

                  {getAuthorName(selectedBook)}
                  {' • '}
                  Book #{selectedBook.id}
                  {' • '}
                  {selectedBook.book_type}

                </p>

              </div>


              <div className='flex flex-wrap gap-2'>


                <button
                  type='button'
                  onClick={() => {

                    setFieldErrors({})

                    setNewCopy({
                      purpose: 'sale',
                      copy_code: ''
                    })

                    setShowAddForm(true)

                  }}
                  className='bg-[#122F21] text-white px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer'
                >

                  <Plus size={17} />

                  Add Copy

                </button>


                <button
                  type='button'
                  onClick={handleBack}
                  className='bg-[#F6EFC5] text-[#122F21] px-4 py-2 rounded-xl cursor-pointer'
                >

                  Back to Search

                </button>

              </div>

            </div>

          </div>


          {/* =========================================
              COPY FILTERS
          ========================================== */}

          <div className='bg-[#AAC3AD] rounded-2xl p-4 flex flex-col md:flex-row gap-3'>


            <select
              value={purposeFilter}
              onChange={event =>
                handlePurposeFilter(
                  event.target.value
                )
              }
              className='bg-[#F6EFC5] rounded-xl px-4 py-3 outline-none'
            >

              <option value='all'>
                All Purposes
              </option>

              <option value='sale'>
                For Sale
              </option>

              <option value='borrowing'>
                For Borrowing
              </option>

            </select>


            <select
              value={statusFilter}
              onChange={event =>
                handleStatusFilter(
                  event.target.value
                )
              }
              className='bg-[#F6EFC5] rounded-xl px-4 py-3 outline-none'
            >

              <option value='all'>
                All Statuses
              </option>

              <option value='available'>
                Available
              </option>

              <option value='borrowed'>
                Borrowed
              </option>

              <option value='sold'>
                Sold
              </option>

              <option value='damaged'>
                Damaged
              </option>

              <option value='lost'>
                Lost
              </option>

            </select>


            <button
              type='button'
              disabled={loadingCopies}
              onClick={() =>
                loadCopies(
                  selectedBook.id,
                  copyPage
                )
              }
              className='md:ml-auto bg-[#F6EFC5] px-4 py-3 rounded-xl flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50'
            >

              <RefreshCw
                size={16}
                className={
                  loadingCopies
                    ? 'animate-spin'
                    : ''
                }
              />

              Refresh

            </button>

          </div>


          {/* =========================================
              SUMMARY
          ========================================== */}

          <div className='grid grid-cols-2 xl:grid-cols-4 gap-3'>


            <SummaryCard
              label='Available On Page'
              value={
                copySummary.available
              }
            />


            <SummaryCard
              label='Borrowed On Page'
              value={
                copySummary.borrowed
              }
            />


            <SummaryCard
              label='Sold On Page'
              value={
                copySummary.sold
              }
            />


            <SummaryCard
              label='Damaged / Lost'
              value={
                copySummary.unavailable
              }
            />

          </div>


          {/* =========================================
              COPIES TABLE
          ========================================== */}

          <div className='bg-[#AAC3AD] rounded-2xl shadow-md overflow-hidden'>


            {loadingCopies ? (

              <div className='min-h-[320px] flex justify-center items-center gap-3 text-[#122F21]'>

                <RefreshCw
                  size={30}
                  className='animate-spin'
                />

                Loading copies...

              </div>

            ) : copies.length === 0 ? (

              <div className='min-h-[280px] flex flex-col items-center justify-center text-[#122F21]/60'>

                <BookCopy
                  size={44}
                  className='mb-3'
                />

                No copies match the current filters.

              </div>

            ) : (

              <div className='overflow-x-auto h-full'>


                <table className='w-full min-w-[900px] text-[#122F21]'>


                  <thead className='bg-[#A6B37D]'>

                    <tr>

                      <th className='p-4 text-center'>
                        ID
                      </th>

                      <th className='p-4 text-left'>
                        Copy Code
                      </th>

                      <th className='p-4 text-center'>
                        Purpose
                      </th>

                      <th className='p-4 text-center'>
                        Status
                      </th>

                      <th className='p-4 text-center'>
                        Status Changed
                      </th>

                      <th className='p-4 text-center'>
                        Management
                      </th>

                    </tr>

                  </thead>


                  <tbody>


                    {copies.map(copy => {

                      const systemManaged =

                        copy.status ===
                          'borrowed' ||

                        copy.status ===
                          'sold'


                      return (

                        <tr
                          key={copy.id}
                          className='border-b border-[#122F21]/10 hover:bg-[#6cb474]/30 transition'
                        >


                          <td className='p-4 text-center font-bold'>

                            #{copy.id}

                          </td>


                          <td className='p-4'>

                            <p className='font-bold'>

                              {
                                copy.copy_code ||
                                'No code'
                              }

                            </p>

                          </td>


                          <td className='p-4 text-center'>

                            <PurposeBadge
                              purpose={
                                copy.purpose
                              }
                            />

                          </td>


                          <td className='p-4 text-center'>

                            <StatusBadge
                              status={
                                copy.status
                              }
                            />

                          </td>


                          <td className='p-4 text-center text-sm'>

                            {
                              formatDateTime(
                                copy.status_changed_at
                              )
                            }

                          </td>


                          <td className='p-4 text-center'>


                            {systemManaged ? (

                              <div>

                                <span className='text-xs text-[#122F21]/60'>

                                  Managed automatically by the system

                                </span>

                              </div>

                            ) : (

                              <select
                                value={
                                  copy.status
                                }
                                disabled={
                                  busyCopyId ===
                                  copy.id
                                }
                                onChange={event =>
                                  handleUpdateStatus(
                                    copy,
                                    event.target.value
                                  )
                                }
                                className='bg-[#F6EFC5] rounded-lg px-3 py-2 outline-none disabled:opacity-50'
                              >

                                {
                                  MANUAL_STATUS_OPTIONS.map(
                                    option => (

                                      <option
                                        key={
                                          option.value
                                        }
                                        value={
                                          option.value
                                        }
                                      >

                                        {
                                          option.label
                                        }

                                      </option>

                                    )
                                  )
                                }

                              </select>

                            )}


                            {
                              busyCopyId ===
                                copy.id &&
                              (

                                <RefreshCw
                                  size={15}
                                  className='animate-spin mx-auto mt-2'
                                />

                              )
                            }

                          </td>

                        </tr>

                      )

                    })}

                  </tbody>

                </table>

              </div>

            )}

          </div>


          {/* =========================================
              PAGINATION
          ========================================== */}

          {
            !loadingCopies &&
            copiesPagination.lastPage >
              1 &&
            (

              <div className='flex flex-col sm:flex-row justify-between items-center gap-3 text-[#122F21]'>


                <p className='text-sm opacity-70'>

                  Showing
                  {' '}
                  {
                    copiesPagination.from
                  }
                  {' '}
                  to
                  {' '}
                  {
                    copiesPagination.to
                  }
                  {' '}
                  of
                  {' '}
                  {
                    copiesPagination.total
                  }
                  {' '}
                  copies

                </p>


                <div className='flex gap-2 items-center'>


                  <button
                    type='button'
                    disabled={
                      copiesPagination
                        .currentPage <= 1
                    }
                    onClick={() =>
                      setCopyPage(
                        copiesPagination
                          .currentPage - 1
                      )
                    }
                    className='bg-[#AAC3AD] p-2 rounded-lg cursor-pointer disabled:opacity-40'
                  >

                    <ChevronLeft
                      size={20}
                    />

                  </button>


                  <span className='bg-[#122F21] text-white px-4 py-2 rounded-lg'>

                    Page
                    {' '}
                    {
                      copiesPagination
                        .currentPage
                    }
                    {' '}
                    /
                    {' '}
                    {
                      copiesPagination
                        .lastPage
                    }

                  </span>


                  <button
                    type='button'
                    disabled={
                      copiesPagination
                        .currentPage >=
                      copiesPagination
                        .lastPage
                    }
                    onClick={() =>
                      setCopyPage(
                        copiesPagination
                          .currentPage + 1
                      )
                    }
                    className='bg-[#AAC3AD] p-2 rounded-lg cursor-pointer disabled:opacity-40'
                  >

                    <ChevronRight
                      size={20}
                    />

                  </button>

                </div>

              </div>

            )
          }


          {/* =========================================
              SYSTEM NOTE
          ========================================== */}


        </>

      )}


      {/* =============================================
          ADD COPY MODAL
      ============================================== */}

      {showAddForm && selectedBook && (

        <div
          className='fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4'
          onClick={() =>
            !savingCopy &&
            setShowAddForm(false)
          }
        >

          <div
            className='bg-[#F6EFC5] rounded-2xl shadow-xl w-full max-w-lg'
            onClick={event =>
              event.stopPropagation()
            }
          >


            {/* HEADER */}

            <div className='p-5 border-b border-[#122F21]/10 flex justify-between items-center'>


              <div>

                <h2 className='text-xl font-bold text-[#122F21]'>

                  Add Physical Copy

                </h2>


                <p className='text-sm text-[#122F21]/60 mt-1'>

                  {selectedBook.title}

                </p>

              </div>


              <button
                type='button'
                disabled={savingCopy}
                onClick={() =>
                  setShowAddForm(false)
                }
                className='bg-[#AAC3AD] p-2 rounded-lg cursor-pointer disabled:opacity-50'
              >

                <X size={20} />

              </button>

            </div>


            {/* FORM */}

            <form
              onSubmit={
                handleAddCopy
              }
              className='p-5 flex flex-col gap-5'
            >


              {/* PURPOSE */}

              <div>

                <label className='block text-sm font-bold text-[#122F21] mb-2'>

                  Copy Purpose *

                </label>


                <select
                  value={
                    newCopy.purpose
                  }
                  disabled={savingCopy}
                  onChange={event =>
                    setNewCopy(prev => ({
                      ...prev,

                      purpose:
                        event.target.value
                    }))
                  }
                  className='w-full bg-[#AAC3AD] rounded-xl p-3 outline-none disabled:opacity-60'
                >

                  {
                    PURPOSE_OPTIONS.map(
                      option => (

                        <option
                          key={option.value}
                          value={option.value}
                        >

                          {option.label}

                        </option>

                      )
                    )
                  }

                </select>


                <FieldError
                  error={
                    fieldErrors.purpose
                  }
                />

              </div>


              {/* COPY CODE */}

              <div>

                <label className='block text-sm font-bold text-[#122F21] mb-2'>

                  Copy Code

                </label>


                <input
                  type='text'
                  maxLength={100}
                  value={
                    newCopy.copy_code
                  }
                  disabled={savingCopy}
                  onChange={event => {

                    setNewCopy(prev => ({
                      ...prev,

                      copy_code:
                        event.target.value
                    }))


                    setFieldErrors(prev => ({
                      ...prev,

                      copy_code:
                        undefined
                    }))

                  }}
                  placeholder='Example: BK-001-A'
                  className='w-full bg-[#AAC3AD] rounded-xl p-3 outline-none disabled:opacity-60'
                />


                <div className='flex justify-between mt-1'>

                  <FieldError
                    error={
                      fieldErrors
                        .copy_code
                    }
                  />


                  <span className='text-xs text-[#122F21]/50 ml-auto'>

                    {
                      newCopy
                        .copy_code
                        .length
                    }
                    /100

                  </span>

                </div>


                <p className='text-xs text-[#122F21]/60 mt-2'>

                  Optional. If provided, the code must be unique.

                </p>

              </div>


              {/* IMPORTANT */}

              <div className='bg-[#A6B37D]/50 rounded-xl p-4 text-sm text-[#122F21]'>

                New copies are created as available. Their purpose is permanently assigned to either sale or borrowing by this creation request.

              </div>


              {/* ACTIONS */}

              <div className='flex justify-end gap-2'>


                <button
                  type='button'
                  disabled={savingCopy}
                  onClick={() =>
                    setShowAddForm(
                      false
                    )
                  }
                  className='bg-gray-300 px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                >

                  Cancel

                </button>


                <button
                  type='submit'
                  disabled={savingCopy}
                  className='bg-[#122F21] text-white px-5 py-2 rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-2'
                >

                  {
                    savingCopy

                      ? (
                        <RefreshCw
                          size={16}
                          className='animate-spin'
                        />
                      )

                      : (
                        <Plus
                          size={16}
                        />
                      )
                  }

                  Add Copy

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
// PURPOSE BADGE
// =====================================================

const PurposeBadge = ({
  purpose
}) => {

  return (

    <span className='inline-flex bg-[#F6EFC5] px-3 py-1 rounded-full text-xs font-bold'>

      {
        purpose === 'sale'
          ? 'For Sale'

          : purpose ===
            'borrowing'
            ? 'For Borrowing'

            : purpose || '—'
      }

    </span>

  )

}


// =====================================================
// STATUS BADGE
// =====================================================

const StatusBadge = ({
  status
}) => {

  const classes = {

    available:
      'bg-green-100 text-green-700',

    borrowed:
      'bg-blue-100 text-blue-700',

    sold:
      'bg-gray-200 text-gray-700',

    damaged:
      'bg-orange-100 text-orange-800',

    lost:
      'bg-red-100 text-red-700'

  }


  return (

    <span
      className={`
        inline-flex
        px-3
        py-1
        rounded-full
        text-xs
        font-bold
        capitalize

        ${
          classes[status] ||
          'bg-gray-100 text-gray-700'
        }
      `}
    >

      {status || 'unknown'}

    </span>

  )

}


// =====================================================
// SUMMARY
// =====================================================

const SummaryCard = ({
  label,
  value
}) => {

  return (

    <div className='bg-[#A6B37D] rounded-xl p-4 text-[#122F21]'>

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


export default BookCopies