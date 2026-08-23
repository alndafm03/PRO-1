import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  AlertTriangle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  RefreshCw,
  Search
} from 'lucide-react'

import api from '../../api/axios'


const Books = () => {

  // =====================================================
  // STATE
  // =====================================================

  const [books, setBooks] = useState([])

  const [loading, setLoading] = useState(true)

  const [busyId, setBusyId] = useState(null)

  const [message, setMessage] = useState('')

  const [messageType, setMessageType] = useState('success')

  const [searchText, setSearchText] = useState('')

  const [visibilityFilter, setVisibilityFilter] =
    useState('all')


  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 20,
    total: 0,
    from: 0,
    to: 0
  })


  // =====================================================
  // HELPERS
  // =====================================================

  const showMessage = (
    text,
    type = 'success'
  ) => {

    setMessage(text)
    setMessageType(type)
  }


  const formatMoney = (value) => {

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return '—'
    }

    const number = parseFloat(value)

    if (Number.isNaN(number)) {
      return value
    }

    return number.toLocaleString(undefined, {
      maximumFractionDigits: 2
    })
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


  // =====================================================
  // COVER IMAGE URL
  //
  // Backend returns:
  // books/covers/abc.jpg
  //
  // Browser needs:
  // http://server/storage/books/covers/abc.jpg
  // =====================================================

  const getCoverUrl = (path) => {

    if (!path) {
      return null
    }


    // إذا كان الباك رجّع URL كامل مستقبلاً
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


  // =====================================================
  // LOAD NORMAL BOOKS
  //
  // GET /books
  //
  // Response:
  //
  // {
  //   data: {
  //     current_page,
  //     data: [...]
  //   }
  // }
  // =====================================================

  const loadBooks = useCallback(
    async (page = 1) => {

      setLoading(true)
      setMessage('')

      try {

        const res = await api.get(
          '/books',
          {
            params: {
              page,
              per_page: 20
            }
          }
        )


        const paginator =
          res.data?.data || {}


        const rows =
          Array.isArray(paginator.data)
            ? paginator.data
            : []


        setBooks(rows)


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
            paginator.from ?? 0,

          to:
            paginator.to ?? rows.length
        })

      }

      catch (err) {

        console.error(
          'Books loading error:',
          err
        )

        setBooks([])

        showMessage(
          err.response?.data?.message ||
          'Books could not be loaded.',
          'error'
        )

      }

      finally {

        setLoading(false)

      }

    },
    []
  )


  // =====================================================
  // SEARCH
  //
  // GET /search?q=
  //
  // Response:
  //
  // data.books.data
  // =====================================================

  const searchBooks = useCallback(
    async (query) => {

      const value = query.trim()


      if (!value) {

        loadBooks(1)

        return
      }


      setLoading(true)
      setMessage('')

      try {

        const res = await api.get(
          '/search',
          {
            params: {
              q: value,
              per_page: 100
            }
          }
        )


        const booksPaginator =
          res.data?.data?.books || {}


        const rows =
          Array.isArray(
            booksPaginator.data
          )
            ? booksPaginator.data
            : []


        setBooks(rows)


        /*
          أثناء البحث نعتبر النتائج
          صفحة واحدة داخل واجهة الأدمن.
        */

        setPagination({
          currentPage: 1,
          lastPage: 1,
          perPage: rows.length,
          total:
            booksPaginator.total ??
            rows.length,
          from:
            rows.length > 0
              ? 1
              : 0,
          to:
            rows.length
        })

      }

      catch (err) {

        console.error(
          'Books search error:',
          err
        )

        setBooks([])

        showMessage(
          err.response?.data?.message ||
          'Book search failed.',
          'error'
        )

      }

      finally {

        setLoading(false)

      }

    },
    [loadBooks]
  )


  // =====================================================
  // FIRST LOAD
  // =====================================================

  useEffect(() => {

    loadBooks(1)

  }, [loadBooks])


  // =====================================================
  // SEARCH DEBOUNCE
  // =====================================================

  useEffect(() => {

    const timeout = setTimeout(() => {

      if (searchText.trim()) {

        searchBooks(searchText)

      }

      else {

        loadBooks(1)

      }

    }, 450)


    return () =>
      clearTimeout(timeout)

  }, [
    searchText,
    searchBooks,
    loadBooks
  ])


  // =====================================================
  // HIDE BOOK
  //
  // POST /admin/books/{book}/hide
  // =====================================================

  const handleHide = async (book) => {

    if (!book?.id) {
      return
    }


    const confirmed = window.confirm(
      `Hide "${book.title}"?`
    )


    if (!confirmed) {
      return
    }


    setBusyId(book.id)
    setMessage('')


    try {

      const res = await api.post(
        `/admin/books/${book.id}/hide`
      )


      const updated =
        res.data?.data


      /*
        إذا الباك رجّع الكتاب المعدل
        نستخدمه.

        وإلا نغيّر is_hidden محلياً.
      */

      setBooks(prev =>
        prev.map(item =>

          item.id === book.id

            ? (
              updated &&
              typeof updated === 'object'

                ? {
                    ...item,
                    ...updated,
                    is_hidden: true
                  }

                : {
                    ...item,
                    is_hidden: true
                  }
            )

            : item

        )
      )


      showMessage(
        res.data?.message ||
        'The book has been hidden successfully.'
      )

    }

    catch (err) {

      console.error(
        'Hide book error:',
        err
      )


      showMessage(
        err.response?.data?.message ||
        'The book could not be hidden.',
        'error'
      )

    }

    finally {

      setBusyId(null)

    }

  }


  // =====================================================
  // UNHIDE BOOK
  //
  // POST /admin/books/{book}/unhide
  // =====================================================

  const handleUnhide = async (book) => {

    if (!book?.id) {
      return
    }


    setBusyId(book.id)
    setMessage('')


    try {

      const res = await api.post(
        `/admin/books/${book.id}/unhide`
      )


      const updated =
        res.data?.data


      setBooks(prev =>
        prev.map(item =>

          item.id === book.id

            ? (
              updated &&
              typeof updated === 'object'

                ? {
                    ...item,
                    ...updated,
                    is_hidden: false
                  }

                : {
                    ...item,
                    is_hidden: false
                  }
            )

            : item

        )
      )


      showMessage(
        res.data?.message ||
        'The book is visible again.'
      )

    }

    catch (err) {

      console.error(
        'Unhide book error:',
        err
      )


      showMessage(
        err.response?.data?.message ||
        'The book could not be shown again.',
        'error'
      )

    }

    finally {

      setBusyId(null)

    }

  }


  // =====================================================
  // VISIBILITY FILTER
  // =====================================================

  const filteredBooks = useMemo(() => {

    if (visibilityFilter === 'visible') {

      return books.filter(
        book => !book.is_hidden
      )

    }


    if (visibilityFilter === 'hidden') {

      return books.filter(
        book => book.is_hidden
      )

    }


    return books

  }, [
    books,
    visibilityFilter
  ])


  // =====================================================
  // PAGINATION
  // =====================================================

  const goToPage = (page) => {

    if (searchText.trim()) {
      return
    }


    if (
      page < 1 ||
      page > pagination.lastPage ||
      page === pagination.currentPage
    ) {
      return
    }


    loadBooks(page)

  }


  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = () => {

    if (searchText.trim()) {

      searchBooks(searchText)

    }

    else {

      loadBooks(
        pagination.currentPage
      )

    }

  }


  // =====================================================
  // JSX
  // =====================================================

  return (

    <div className='w-full flex flex-col h-screen gap-5 pb-10'>


      {/* =============================================
          HEADER
      ============================================== */}

      <div className='flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between'>


        <div>

          {/* <h1 className='text-2xl font-bold text-[#122F21] flex items-center gap-2'>

            <BookOpen size={26} />

            Books Management

          </h1> */}


          <p className='text-sm text-[#122F21]/60 mt-1'>

            View published books and control
            their visibility.

          </p>

        </div>


        <button
          type='button'
          onClick={handleRefresh}
          disabled={loading}
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

                : 'bg-[#AAC3AD] text-[#122F21]'
            }
          `}
        >

          {messageType === 'error' && (
            <AlertTriangle size={20} />
          )}

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

        <div className='relative flex-1 max-w-xl'>

          <Search
            size={18}
            className='absolute left-3 top-1/2 -translate-y-1/2 text-[#122F21]/60'
          />

          <input
            type='text'
            value={searchText}
            onChange={e =>
              setSearchText(
                e.target.value
              )
            }
            placeholder='Search books by title, author or category...'
            className='w-full bg-[#F6EFC5] rounded-xl py-3 pl-10 pr-4 outline-none text-[#122F21]'
          />

        </div>


        {/* Visibility */}

        <div className='flex gap-2 flex-wrap'>

          {[
            {
              key: 'all',
              label: 'All'
            },

            {
              key: 'visible',
              label: 'Visible'
            },

            {
              key: 'hidden',
              label: 'Hidden'
            }

          ].map(filter => (

            <button
              type='button'
              key={filter.key}
              onClick={() =>
                setVisibilityFilter(
                  filter.key
                )
              }
              className={`
                px-4
                py-2
                rounded-xl
                cursor-pointer
                transition

                ${
                  visibilityFilter ===
                  filter.key

                    ? 'bg-[#122F21] text-white'

                    : 'bg-[#F6EFC5] text-[#122F21]'
                }
              `}
            >

              {filter.label}

            </button>

          ))}

        </div>

      </div>


      {/* =============================================
          SUMMARY
      ============================================== */}

      <div className='flex flex-wrap gap-3 text-sm text-[#122F21]'>

        <div className='bg-[#A6B37D] rounded-xl px-4 py-2'>

          Total:
          {' '}
          <strong>
            {pagination.total}
          </strong>

        </div>


        <div className='bg-[#A6B37D] rounded-xl px-4 py-2'>

          Visible on current result:
          {' '}
          <strong>
            {
              books.filter(
                book => !book.is_hidden
              ).length
            }
          </strong>

        </div>


        <div className='bg-[#A6B37D] rounded-xl px-4 py-2'>

          Hidden on current result:
          {' '}
          <strong>
            {
              books.filter(
                book => book.is_hidden
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

          <div className='min-h-[350px] flex flex-col gap-3 items-center justify-center text-[#122F21]'>

            <RefreshCw
              size={30}
              className='animate-spin'
            />

            <span>
              Loading books...
            </span>

          </div>

        ) : filteredBooks.length === 0 ? (

          <div className='min-h-[300px] flex flex-col items-center justify-center text-[#122F21]/70'>

            <BookOpen
              size={44}
              className='mb-3'
            />

            <p>
              No books found.
            </p>

          </div>

        ) : (

          <div className='overflow-x-auto h-full'>

            <table className='w-full min-w-[1150px] text-[#122F21]'>


              {/* TABLE HEADER */}

              <thead className='bg-[#A6B37D]'>

                <tr>

                  <th className='p-4 text-center'>
                    Cover
                  </th>

                  <th className='p-4 text-center'>
                    ID
                  </th>

                  <th className='p-4 text-left'>
                    Book
                  </th>

                  <th className='p-4 text-left'>
                    Author
                  </th>

                  <th className='p-4 text-center'>
                    Type
                  </th>

                  <th className='p-4 text-center'>
                    Categories
                  </th>

                  <th className='p-4 text-center'>
                    Physical Price
                  </th>

                  <th className='p-4 text-center'>
                    Digital Price
                  </th>

                  <th className='p-4 text-center'>
                    Published
                  </th>

                  <th className='p-4 text-center'>
                    Visibility
                  </th>

                  <th className='p-4 text-center'>
                    Action
                  </th>

                </tr>

              </thead>


              {/* TABLE BODY */}

              <tbody>

                {filteredBooks.map(book => {

                  const cover =
                    getCoverUrl(
                      book.cover_image
                    )


                  return (

                    <tr
                      key={book.id}
                      className='border-b border-[#122F21]/10 hover:bg-[#6cb474]/30 transition'
                    >


                      {/* COVER */}

                      <td className='p-3 text-center'>

                        {cover ? (

                          <img
                            src={cover}
                            alt={book.title}
                            className='w-12 h-16 object-cover rounded-lg mx-auto bg-[#F6EFC5]'
                            onError={e => {

                              e.currentTarget.style.display =
                                'none'
                            }}
                          />

                        ) : (

                          <div className='w-12 h-16 rounded-lg bg-[#F6EFC5] mx-auto flex items-center justify-center'>

                            <BookOpen
                              size={20}
                            />

                          </div>

                        )}

                      </td>


                      {/* ID */}

                      <td className='p-3 text-center'>

                        #{book.id}

                      </td>


                      {/* BOOK */}

                      <td className='p-3'>

                        <div className='font-bold max-w-[230px]'>

                          {book.title || '—'}

                        </div>


                        <div className='text-xs opacity-60 mt-1'>

                          {book.language || '—'}

                          {
                            book.page_count
                              ? ` • ${book.page_count} pages`
                              : ''
                          }

                        </div>

                      </td>


                      {/* AUTHOR */}

                      <td className='p-3'>

                        {
                          book.author?.full_name ||
                          book.author_name ||
                          '—'
                        }

                      </td>


                      {/* TYPE */}

                      <td className='p-3 text-center'>

                        <span className='bg-[#F6EFC5] rounded-lg px-3 py-1 text-sm'>

                          {book.book_type || '—'}

                        </span>

                      </td>


                      {/* CATEGORIES */}

                      <td className='p-3'>

                        <div className='flex gap-1 flex-wrap justify-center'>

                          {
                            Array.isArray(
                              book.categories
                            ) &&
                            book.categories.length > 0

                              ? book.categories.map(
                                  category => (

                                    <span
                                      key={category.id}
                                      className='text-xs bg-[#F6EFC5] px-2 py-1 rounded-lg'
                                    >

                                      {category.name}

                                    </span>

                                  )
                                )

                              : '—'
                          }

                        </div>

                      </td>


                      {/* PHYSICAL PRICE */}

                      <td className='p-3 text-center'>

                        {
                          formatMoney(
                            book.price_physical
                          )
                        }

                      </td>


                      {/* DIGITAL PRICE */}

                      <td className='p-3 text-center'>

                        {
                          formatMoney(
                            book.price_digital
                          )
                        }

                      </td>


                      {/* PUBLISHED DATE */}

                      <td className='p-3 text-center text-sm'>

                        {
                          formatDate(
                            book.published_at
                          )
                        }

                      </td>


                      {/* VISIBILITY */}

                      <td className='p-3 text-center'>

                        {book.is_hidden ? (

                          <span className='inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold'>

                            <EyeOff size={14} />

                            Hidden

                          </span>

                        ) : (

                          <span className='inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold'>

                            <Eye size={14} />

                            Visible

                          </span>

                        )}

                      </td>


                      {/* ACTION */}

                      <td className='p-3 text-center'>

                        {book.is_hidden ? (

                          <button
                            type='button'
                            disabled={
                              busyId === book.id
                            }
                            onClick={() =>
                              handleUnhide(book)
                            }
                            className='inline-flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                          >

                            {
                              busyId === book.id

                                ? (
                                  <RefreshCw
                                    size={15}
                                    className='animate-spin'
                                  />
                                )

                                : (
                                  <Eye size={15} />
                                )
                            }

                            Show

                          </button>

                        ) : (

                          <button
                            type='button'
                            disabled={
                              busyId === book.id
                            }
                            onClick={() =>
                              handleHide(book)
                            }
                            className='inline-flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                          >

                            {
                              busyId === book.id

                                ? (
                                  <RefreshCw
                                    size={15}
                                    className='animate-spin'
                                  />
                                )

                                : (
                                  <EyeOff size={15} />
                                )
                            }

                            Hide

                          </button>

                        )}

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

          أثناء /search نخفي Pagination لأن
          البحث نفسه يرجع نتائجه الخاصة.
      ============================================== */}

      {
        !searchText.trim() &&
        pagination.lastPage > 1 &&
        !loading && (

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
              books

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

    </div>

  )

}


export default Books