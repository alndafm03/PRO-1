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
  FileCheck2,
  MessageSquareText,
  RefreshCw,
  Search,
  User,
  X,
  XCircle
} from 'lucide-react'

import {
  getPendingBooks,
  startBookReview,
  approveBook,
  rejectBook,
  requestBookChanges
} from '../../api/contentEmployeeApi'


// =====================================================
// HELPERS
// =====================================================

const getBookStatus = book =>
  book?.publish_status ||
  book?.status ||
  'submitted'


const getAuthorName = book => {

  return (
    book?.author?.full_name ||
    book?.author_name ||
    '—'
  )

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


const formatMoney = value => {

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—'
  }


  const number =
    parseFloat(value)


  if (Number.isNaN(number)) {
    return value
  }


  return number.toLocaleString(
    undefined,
    {
      maximumFractionDigits: 2
    }
  )

}


// =====================================================
// COMPONENT
// =====================================================

const BooksPending = () => {

  // ===================================================
  // DATA
  // ===================================================

  const [books, setBooks] =
    useState([])

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
  // DETAILS
  // ===================================================

  const [
    selectedBook,
    setSelectedBook
  ] = useState(null)


  // ===================================================
  // DECISION MODAL
  // ===================================================

  const [
    decision,
    setDecision
  ] = useState(null)

  /*
    decision:

    {
      type: 'reject' | 'changes',
      book: {...}
    }
  */

  const [
    decisionText,
    setDecisionText
  ] = useState('')


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
  // PAGINATION
  // ===================================================

  const [
    pagination,
    setPagination
  ] = useState({

    currentPage: 1,
    lastPage: 1,
    total: 0,
    from: 0,
    to: 0,
    perPage: 20

  })


  // ===================================================
  // MESSAGE
  // ===================================================

  const showMessage = (
    text,
    type = 'success'
  ) => {

    setMessage(text)

    setMessageType(type)

  }


  // ===================================================
  // LOAD BOOKS
  //
  // GET /employee/content/books/pending
  //
  // Paginated
  //
  // Only:
  // submitted
  // under_review
  // ===================================================

  const loadBooks =
    useCallback(
      async (page = 1) => {

        setLoading(true)

        setMessage('')


        try {

          const res =
            await getPendingBooks({

              page,

              per_page: 20

            })


          const paginator =
            res.data?.data || {}


          const rows =
            Array.isArray(
              paginator.data
            )
              ? paginator.data
              : []


          setBooks(rows)


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
                rows.length
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
            'Pending books loading error:',
            err
          )


          setBooks([])


          showMessage(
            err.response?.data?.message ||
            'Books waiting for review could not be loaded.',
            'error'
          )

        }

        finally {

          setLoading(false)

        }

      },
      []
    )


  // ===================================================
  // FIRST LOAD
  // ===================================================

  useEffect(() => {

    loadBooks(1)

  }, [loadBooks])


  // ===================================================
  // SEARCH CURRENT PAGE
  // ===================================================

  const filteredBooks =
    useMemo(() => {

      const query =
        searchText
          .trim()
          .toLowerCase()


      if (!query) {
        return books
      }


      return books.filter(
        book => {

          const values = [

            book.id,

            book.title,

            getAuthorName(book),

            book.publisher,

            book.language,

            book.book_type,

            getBookStatus(book)

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
      books,
      searchText
    ])


  // ===================================================
  // SUMMARY
  // ===================================================

  const summary =
    useMemo(() => {

      return {

        submitted:
          books.filter(
            book =>
              getBookStatus(book) ===
              'submitted'
          ).length,

        underReview:
          books.filter(
            book =>
              getBookStatus(book) ===
              'under_review'
          ).length

      }

    }, [books])


  // ===================================================
  // START REVIEW
  //
  // POST
  // /employee/content/books/{book}/start-review
  //
  // NO BODY
  //
  // submitted -> under_review
  // ===================================================

  const handleStartReview =
    async book => {

      if (
        getBookStatus(book) !==
        'submitted'
      ) {
        return
      }


      const confirmed =
        window.confirm(
          `Start reviewing "${book.title}"?\n\nThe backend will lock this book to the reviewing employee.`
        )


      if (!confirmed) {
        return
      }


      setBusyId(book.id)

      setMessage('')


      try {

        const res =
          await startBookReview(
            book.id
          )


        showMessage(
          res.data?.message ||
          'Book review started successfully.'
        )


        /*
          نعيد القراءة من السيرفر حتى نحصل
          على reviewed_by والحالة الحقيقية.
        */

        await loadBooks(
          pagination.currentPage
        )

      }

      catch (err) {

        console.error(
          'Start review error:',
          err
        )


        if (
          err.response?.status ===
          403
        ) {

          showMessage(
            err.response?.data?.message ||
            'This book is being reviewed by another employee.',
            'error'
          )

        }

        else {

          showMessage(
            err.response?.data?.message ||
            'The review could not be started.',
            'error'
          )

        }

      }

      finally {

        setBusyId(null)

      }

    }


  // ===================================================
  // APPROVE
  //
  // POST
  // /employee/content/books/{book}/approve
  //
  // NO BODY
  //
  // under_review -> published
  // ===================================================

  const handleApprove =
    async book => {

      if (
        getBookStatus(book) !==
        'under_review'
      ) {
        return
      }


      const confirmed =
        window.confirm(
          `Approve and publish "${book.title}"?`
        )


      if (!confirmed) {
        return
      }


      setBusyId(book.id)

      setMessage('')


      try {

        const res =
          await approveBook(
            book.id
          )


        showMessage(
          res.data?.message ||
          'Book approved and published successfully.'
        )


        setSelectedBook(null)


        const targetPage =

          books.length === 1 &&
          pagination.currentPage > 1

            ? pagination.currentPage - 1

            : pagination.currentPage


        await loadBooks(
          targetPage
        )

      }

      catch (err) {

        console.error(
          'Approve book error:',
          err
        )


        showMessage(
          err.response?.data?.message ||
          'The book could not be approved.',
          'error'
        )

      }

      finally {

        setBusyId(null)

      }

    }


  // ===================================================
  // OPEN DECISION
  // ===================================================

  const openDecision = (
    type,
    book
  ) => {

    if (
      getBookStatus(book) !==
      'under_review'
    ) {
      return
    }


    setDecision({
      type,
      book
    })


    setDecisionText('')

    setMessage('')

  }


  // ===================================================
  // REJECT / REQUEST CHANGES
  //
  // reject:
  // {
  //   rejection_reason?: string
  // }
  //
  // changes:
  // {
  //   notes?: string
  // }
  //
  // max 2000
  // ===================================================

  const handleDecision =
    async () => {

      if (!decision?.book) {
        return
      }


      if (
        decisionText.length >
        2000
      ) {

        showMessage(
          'The note may not exceed 2000 characters.',
          'error'
        )

        return

      }


      const book =
        decision.book


      setBusyId(book.id)

      setMessage('')


      try {

        let res


        if (
          decision.type ===
          'reject'
        ) {

          res =
            await rejectBook(
              book.id,
              decisionText
            )

        }

        else {

          res =
            await requestBookChanges(
              book.id,
              decisionText
            )

        }


        showMessage(
          res.data?.message ||
          (
            decision.type ===
            'reject'

              ? 'Book rejected successfully.'

              : 'Change request sent to the author.'
          )
        )


        setDecision(null)

        setDecisionText('')

        setSelectedBook(null)


        const targetPage =

          books.length === 1 &&
          pagination.currentPage > 1

            ? pagination.currentPage - 1

            : pagination.currentPage


        await loadBooks(
          targetPage
        )

      }

      catch (err) {

        console.error(
          'Book review decision error:',
          err
        )


        showMessage(
          err.response?.data?.message ||
          'The review decision could not be completed.',
          'error'
        )

      }

      finally {

        setBusyId(null)

      }

    }


  // ===================================================
  // PAGE
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

    loadBooks(page)

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

            <FileCheck2 size={28} />

            Books Review

          </h1> */}


          <p className='text-sm text-[#122F21]/60 mt-1'>

            Review books submitted by authors before publication.

          </p>

        </div>


        <button
          type='button'
          disabled={loading}
          onClick={() =>
            loadBooks(
              pagination.currentPage
            )
          }
          className='bg-[#122F21] text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50'
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

          {message}

        </div>

      )}


      {/* =============================================
          WORKFLOW
      ============================================== */}
{/* 
      <div className='bg-[#A6B37D]/50 rounded-2xl p-5 text-[#122F21]'>

        <p className='font-bold'>

          Required review workflow

        </p>


        <div className='flex flex-wrap items-center gap-2 text-sm mt-3'>

          <WorkflowItem>
            submitted
          </WorkflowItem>

          <span>→</span>

          <WorkflowItem>
            Start Review
          </WorkflowItem>

          <span>→</span>

          <WorkflowItem>
            under_review
          </WorkflowItem>

          <span>→</span>

          <WorkflowItem>
            Approve / Reject / Request Changes
          </WorkflowItem>

        </div>


        <p className='text-xs opacity-70 mt-3'>

          A book under review may be locked to another content employee. The backend enforces that lock and may return 403.

        </p>

      </div> */}


      {/* =============================================
          SUMMARY
      ============================================== */}

      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>


        <SummaryCard
          label='Total Matching'
          value={
            pagination.total
          }
        />


        <SummaryCard
          label='Submitted On Page'
          value={
            summary.submitted
          }
        />


        <SummaryCard
          label='Under Review On Page'
          value={
            summary.underReview
          }
          warning={
            summary.underReview > 0
          }
        />

      </div>


      {/* =============================================
          SEARCH
      ============================================== */}

      <div className='bg-[#AAC3AD] rounded-2xl p-4 shadow-md'>


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
            placeholder='Search current page by title, author, publisher or ID...'
            className='w-full bg-[#F6EFC5] rounded-xl py-3 pl-10 pr-4 outline-none'
          />

        </div>

      </div>


      {/* =============================================
          TABLE
      ============================================== */}

      <div className='bg-[#AAC3AD] rounded-2xl shadow-md overflow-hidden'>


        {loading ? (

          <div className='min-h-[340px] flex items-center justify-center gap-3 text-[#122F21]'>

            <RefreshCw
              size={30}
              className='animate-spin'
            />

            Loading books...

          </div>

        ) : filteredBooks.length ===
          0 ? (

          <div className='min-h-[300px] flex flex-col justify-center items-center text-[#122F21]/60 text-center p-5'>

            <BookOpen
              size={45}
              className='mb-3'
            />

            {
              books.length === 0
                ? 'There are no books waiting for review.'
                : 'No book matches the current search.'
            }

          </div>

        ) : (

          <div className='overflow-x-auto h-full'>


            <table className='w-full min-w-[1050px] text-[#122F21]'>


              <thead className='bg-[#A6B37D]'>

                <tr>

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
                    Submitted
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

                {filteredBooks.map(
                  book => {

                    const status =
                      getBookStatus(
                        book
                      )


                    return (

                      <tr
                        key={book.id}
                        className='border-b border-[#122F21]/10 hover:bg-[#6cb474]/30 transition'
                      >


                        <td className='p-4 text-center font-bold'>

                          #{book.id}

                        </td>


                        <td className='p-4'>

                          <p className='font-bold'>

                            {
                              book.title ||
                              '—'
                            }

                          </p>


                          <p className='text-xs opacity-60 mt-1'>

                            {
                              book.publisher ||
                              '—'
                            }

                          </p>

                        </td>


                        <td className='p-4'>

                          <p className='font-medium'>

                            {
                              getAuthorName(
                                book
                              )
                            }

                          </p>


                          {book.author?.username && (

                            <p className='text-xs opacity-60 mt-1'>

                              @
                              {
                                book.author
                                  .username
                              }

                            </p>

                          )}

                        </td>


                        <td className='p-4 text-center'>

                          <span className='bg-[#F6EFC5] px-3 py-1 rounded-lg text-xs capitalize'>

                            {
                              book.book_type ||
                              '—'
                            }

                          </span>

                        </td>


                        <td className='p-4 text-center text-sm'>

                          {
                            formatDateTime(
                              book.updated_at ||
                              book.created_at
                            )
                          }

                        </td>


                        <td className='p-4 text-center'>

                          <StatusBadge
                            status={status}
                          />

                        </td>


                        <td className='p-4'>


                          <div className='flex justify-center gap-2 flex-wrap'>


                            <button
                              type='button'
                              onClick={() =>
                                setSelectedBook(
                                  book
                                )
                              }
                              className='bg-[#F6EFC5] text-[#122F21] px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer'
                            >

                              <Eye size={15} />

                              Details

                            </button>


                            {
                              status ===
                              'submitted' &&
                              (

                                <button
                                  type='button'
                                  disabled={
                                    busyId ===
                                    book.id
                                  }
                                  onClick={() =>
                                    handleStartReview(
                                      book
                                    )
                                  }
                                  className='bg-[#122F21] text-white px-3 py-2 rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-1'
                                >

                                  {
                                    busyId ===
                                    book.id
                                      ? (
                                        <RefreshCw
                                          size={15}
                                          className='animate-spin'
                                        />
                                      )
                                      : (
                                        <FileCheck2
                                          size={15}
                                        />
                                      )
                                  }

                                  Start Review

                                </button>

                              )
                            }


                            {
                              status ===
                              'under_review' &&
                              (

                                <>

                                  <button
                                    type='button'
                                    disabled={
                                      busyId ===
                                      book.id
                                    }
                                    onClick={() =>
                                      handleApprove(
                                        book
                                      )
                                    }
                                    className='bg-green-700 text-white px-3 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                                  >

                                    Approve

                                  </button>


                                  <button
                                    type='button'
                                    disabled={
                                      busyId ===
                                      book.id
                                    }
                                    onClick={() =>
                                      openDecision(
                                        'changes',
                                        book
                                      )
                                    }
                                    className='bg-yellow-600 text-white px-3 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                                  >

                                    Request Changes

                                  </button>


                                  <button
                                    type='button'
                                    disabled={
                                      busyId ===
                                      book.id
                                    }
                                    onClick={() =>
                                      openDecision(
                                        'reject',
                                        book
                                      )
                                    }
                                    className='bg-red-700 text-white px-3 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                                  >

                                    Reject

                                  </button>

                                </>

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
          DETAILS MODAL
      ============================================== */}

      {selectedBook && (

        <BookDetailsModal

          book={
            selectedBook
          }

          busy={
            busyId ===
            selectedBook.id
          }

          onClose={() =>
            setSelectedBook(
              null
            )
          }

          onStartReview={() =>
            handleStartReview(
              selectedBook
            )
          }

          onApprove={() =>
            handleApprove(
              selectedBook
            )
          }

          onReject={() =>
            openDecision(
              'reject',
              selectedBook
            )
          }

          onChanges={() =>
            openDecision(
              'changes',
              selectedBook
            )
          }

        />

      )}


      {/* =============================================
          DECISION MODAL
      ============================================== */}

      {decision && (

        <div
          className='fixed inset-0 bg-black/40 z-[60] flex justify-center items-center p-4'
          onClick={() => {

            if (!busyId) {

              setDecision(null)

            }

          }}
        >

          <div
            className='bg-[#F6EFC5] rounded-2xl shadow-xl w-full max-w-lg'
            onClick={event =>
              event.stopPropagation()
            }
          >


            <div className='p-5 border-b border-[#122F21]/10 flex justify-between items-center'>


              <div>

                <h2 className='text-xl font-bold text-[#122F21]'>

                  {
                    decision.type ===
                    'reject'

                      ? 'Reject Book'

                      : 'Request Changes'
                  }

                </h2>


                <p className='text-sm text-[#122F21]/60 mt-1'>

                  {
                    decision.book.title
                  }

                </p>

              </div>


              <button
                type='button'
                disabled={
                  busyId ===
                  decision.book.id
                }
                onClick={() =>
                  setDecision(null)
                }
                className='bg-[#AAC3AD] p-2 rounded-lg cursor-pointer disabled:opacity-50'
              >

                <X size={20} />

              </button>

            </div>


            <div className='p-5'>


              <label className='block text-sm font-bold text-[#122F21] mb-2'>

                {
                  decision.type ===
                  'reject'

                    ? 'Rejection Reason'

                    : 'Changes Requested'
                }

              </label>


              <textarea
                rows={6}
                maxLength={2000}
                value={
                  decisionText
                }
                disabled={
                  busyId ===
                  decision.book.id
                }
                onChange={event =>
                  setDecisionText(
                    event.target.value
                  )
                }
                placeholder={
                  decision.type ===
                  'reject'

                    ? 'Optional reason for rejection...'

                    : 'Explain the requested changes to the author...'
                }
                className='w-full bg-[#AAC3AD] rounded-xl p-3 outline-none disabled:opacity-60'
              />


              <div className='text-right text-xs text-[#122F21]/50 mt-1'>

                {
                  decisionText.length
                }
                /2000

              </div>


              <p className='text-xs text-[#122F21]/60 mt-2'>

                This field is optional according to the current backend contract.

              </p>


              <div className='flex justify-end gap-2 mt-5'>


                <button
                  type='button'
                  disabled={
                    busyId ===
                    decision.book.id
                  }
                  onClick={() =>
                    setDecision(null)
                  }
                  className='bg-gray-300 px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                >

                  Cancel

                </button>


                <button
                  type='button'
                  disabled={
                    busyId ===
                    decision.book.id
                  }
                  onClick={
                    handleDecision
                  }
                  className={`
                    text-white
                    px-5
                    py-2
                    rounded-lg
                    cursor-pointer
                    disabled:opacity-50
                    flex
                    items-center
                    gap-2

                    ${
                      decision.type ===
                      'reject'

                        ? 'bg-red-700'

                        : 'bg-yellow-600'
                    }
                  `}
                >

                  {
                    busyId ===
                    decision.book.id &&
                    (

                      <RefreshCw
                        size={16}
                        className='animate-spin'
                      />

                    )
                  }

                  {
                    decision.type ===
                    'reject'

                      ? 'Confirm Rejection'

                      : 'Send Change Request'
                  }

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
// BOOK DETAILS
// =====================================================

const BookDetailsModal = ({
  book,
  busy,
  onClose,
  onStartReview,
  onApprove,
  onReject,
  onChanges
}) => {

  const status =
    getBookStatus(book)


  const categories =
    Array.isArray(
      book.categories
    )
      ? book.categories
      : []


  return (

    <div
      className='fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4'
      onClick={onClose}
    >

      <div
        className='bg-[#F6EFC5] rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto'
        onClick={event =>
          event.stopPropagation()
        }
      >


        <div className='sticky top-0 bg-[#F6EFC5] p-5 border-b border-[#122F21]/10 flex justify-between items-center'>


          <div>

            <h2 className='text-xl font-bold text-[#122F21]'>

              {book.title}

            </h2>


            <p className='text-sm text-[#122F21]/60 mt-1'>

              Book #{book.id}

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


          {/* AUTHOR */}

          <SectionTitle
            icon={User}
            title='Author'
          />


          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>

            <DetailItem
              label='Name'
              value={
                getAuthorName(
                  book
                )
              }
            />

            <DetailItem
              label='Author ID'
              value={
                book.author_id
                  ? `#${book.author_id}`
                  : '—'
              }
            />

            <DetailItem
              label='Username'
              value={
                book.author?.username
                  ? `@${book.author.username}`
                  : '—'
              }
            />

          </div>


          {/* BOOK */}

          <SectionTitle
            icon={BookOpen}
            title='Book Information'
          />


          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>

            <DetailItem
              label='Publisher'
              value={
                book.publisher
              }
            />

            <DetailItem
              label='Publication Year'
              value={
                book.publisher_year
              }
            />

            <DetailItem
              label='Language'
              value={
                book.language
              }
            />

            <DetailItem
              label='Book Type'
              value={
                book.book_type
              }
            />

            <DetailItem
              label='Pages'
              value={
                book.page_count
              }
            />

            <DetailItem
              label='Status'
              value={status}
            />

            <DetailItem
              label='Physical Price'
              value={
                formatMoney(
                  book.price_physical
                )
              }
            />

            <DetailItem
              label='Digital Price'
              value={
                formatMoney(
                  book.price_digital
                )
              }
            />

            <DetailItem
              label='Reviewed By'
              value={
                book.reviewed_by
                  ? `Employee #${book.reviewed_by}`
                  : '—'
              }
            />

          </div>


          {/* DESCRIPTION */}

          <div>

            <p className='font-bold text-[#122F21] mb-2'>

              Description

            </p>


            <div className='bg-[#AAC3AD] rounded-xl p-4 text-sm text-[#122F21] whitespace-pre-wrap leading-6'>

              {
                book.description ||
                '—'
              }

            </div>

          </div>


          {/* CATEGORIES */}

          <div>

            <p className='font-bold text-[#122F21] mb-2'>

              Categories

            </p>


            {categories.length > 0 ? (

              <div className='flex flex-wrap gap-2'>

                {categories.map(
                  category => (

                    <span
                      key={category.id}
                      className='bg-[#AAC3AD] px-3 py-1 rounded-full text-sm'
                    >

                      {category.name}

                    </span>

                  )
                )}

              </div>

            ) : (

              <p className='text-sm text-[#122F21]/60'>

                Category data was not included in this response.

              </p>

            )}

          </div>


          {/* DATES */}

          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>

            <DetailItem
              label='Created At'
              value={
                formatDateTime(
                  book.created_at
                )
              }
            />

            <DetailItem
              label='Last Updated'
              value={
                formatDateTime(
                  book.updated_at
                )
              }
            />

          </div>


          {/* ACTIONS */}

          <div className='border-t border-[#122F21]/10 pt-5'>


            {status ===
              'submitted' && (

              <button
                type='button'
                disabled={busy}
                onClick={
                  onStartReview
                }
                className='bg-[#122F21] text-white px-5 py-2 rounded-lg cursor-pointer disabled:opacity-50'
              >

                Start Review

              </button>

            )}


            {status ===
              'under_review' && (

              <div className='flex flex-wrap gap-2'>


                <button
                  type='button'
                  disabled={busy}
                  onClick={onApprove}
                  className='bg-green-700 text-white px-5 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                >

                  Approve & Publish

                </button>


                <button
                  type='button'
                  disabled={busy}
                  onClick={onChanges}
                  className='bg-yellow-600 text-white px-5 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                >

                  Request Changes

                </button>


                <button
                  type='button'
                  disabled={busy}
                  onClick={onReject}
                  className='bg-red-700 text-white px-5 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                >

                  Reject

                </button>

              </div>

            )}

          </div>

        </div>

      </div>

    </div>

  )

}


// =====================================================
// STATUS
// =====================================================

const StatusBadge = ({
  status
}) => {

  const classes = {

    submitted:
      'bg-yellow-100 text-yellow-800',

    under_review:
      'bg-blue-100 text-blue-700'

  }


  return (

    <span
      className={`
        px-3
        py-1
        rounded-full
        text-xs
        font-bold

        ${
          classes[status] ||
          'bg-gray-100 text-gray-700'
        }
      `}
    >

      {
        status === 'under_review'
          ? 'Under Review'
          : status === 'submitted'
            ? 'Submitted'
            : status
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
            ? 'bg-blue-100'
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
// DETAIL
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
// SECTION
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
// WORKFLOW
// =====================================================

const WorkflowItem = ({
  children
}) => {

  return (

    <span className='bg-[#F6EFC5] px-3 py-1.5 rounded-lg font-medium'>

      {children}

    </span>

  )

}


export default BooksPending