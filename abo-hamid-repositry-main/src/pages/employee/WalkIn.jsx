import React, {
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  AlertTriangle,
  Armchair,
  BarChart3,
  BookOpen,
  CheckCircle,
  Clock3,
  RefreshCw,
  Search,
  ShoppingCart,
  Store,
  XCircle
} from 'lucide-react'

import {
  searchBooksPublic,
  createWalkInPurchase,
  createWalkInBorrowing,
  createWalkInReservation,
  getWalkInStats,
  getBorrowOptions
} from '../../api/libraryEmployeeApi'


// =====================================================
// CONSTANTS
// =====================================================

const TABS = [
  {
    key: 'purchase',
    label: 'Walk-in Sale',
    icon: ShoppingCart
  },
  {
    key: 'borrowing',
    label: 'Walk-in Borrowing',
    icon: BookOpen
  },
  {
    key: 'reservation',
    label: 'Walk-in Reservation',
    icon: Armchair
  },
  {
    key: 'stats',
    label: 'Statistics',
    icon: BarChart3
  }
]


// =====================================================
// LOCAL DATE
// =====================================================

const getToday = () => {

  const date =
    new Date()

  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, '0')

  const day =
    String(
      date.getDate()
    ).padStart(2, '0')


  return `${year}-${month}-${day}`

}


// =====================================================
// MAIN COMPONENT
// =====================================================

const WalkIn = () => {

  const [tab, setTab] =
    useState('purchase')

  const [message, setMessage] =
    useState('')

  const [messageType, setMessageType] =
    useState('success')

  const [
    statsRefreshKey,
    setStatsRefreshKey
  ] = useState(0)


  const showMessage = (
    text,
    type = 'success'
  ) => {

    setMessage(text)

    setMessageType(type)

  }


  const operationSucceeded = text => {

    showMessage(
      text,
      'success'
    )

    setStatsRefreshKey(
      previous =>
        previous + 1
    )

  }


  return (

    <div className='w-full flex flex-col gap-5 pb-10'>


      {/* =============================================
          HEADER
      ============================================== */}

      <div>

        <p className='text-sm text-[#122F21]/60 mt-1'>

          Register purchases, physical borrowings and seat reservations for visitors directly at the library.

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
          TABS
      ============================================== */}

      <div className='bg-[#AAC3AD] rounded-2xl p-2 shadow-md'>

        <div className='grid grid-cols-2 xl:grid-cols-4 gap-2'>

          {TABS.map(item => {

            const Icon =
              item.icon


            return (

              <button
                type='button'
                key={item.key}
                onClick={() => {

                  setTab(item.key)

                  setMessage('')

                }}
                className={`
                  px-4
                  py-3
                  rounded-xl
                  flex
                  justify-center
                  items-center
                  gap-2
                  cursor-pointer

                  ${
                    tab === item.key
                      ? 'bg-[#122F21] text-white'
                      : 'text-[#122F21]'
                  }
                `}
              >

                <Icon size={17} />

                {item.label}

              </button>

            )

          })}

        </div>

      </div>


      {/* =============================================
          CONTENT
      ============================================== */}

      {tab === 'purchase' && (

        <PurchaseForm
          showMessage={
            showMessage
          }
          onSuccess={
            operationSucceeded
          }
        />

      )}


      {tab === 'borrowing' && (

        <BorrowingForm
          showMessage={
            showMessage
          }
          onSuccess={
            operationSucceeded
          }
        />

      )}


      {tab === 'reservation' && (

        <ReservationForm
          showMessage={
            showMessage
          }
          onSuccess={
            operationSucceeded
          }
        />

      )}


      {tab === 'stats' && (

        <WalkInStats
          refreshKey={
            statsRefreshKey
          }
          showMessage={
            showMessage
          }
        />

      )}

    </div>

  )

}


// =====================================================
// BOOK PICKER
// IMPORTANT:
// NO FORM HERE because this component is rendered
// inside PurchaseForm and BorrowingForm.
// Nested forms cause page reload / incorrect submit.
// =====================================================

const BookPicker = ({
  selectedBook,
  onSelect,
  title
}) => {

  const [query, setQuery] =
    useState('')

  const [results, setResults] =
    useState([])

  const [loading, setLoading] =
    useState(false)

  const [searched, setSearched] =
    useState(false)


  const handleSearch =
    async () => {

      const value =
        query.trim()


      if (!value) {
        return
      }


      setLoading(true)

      setSearched(true)

      setResults([])


      try {

        const res =
          await searchBooksPublic(
            value,
            {
              per_page: 50
            }
          )


        const rows =
          res.data
            ?.data
            ?.books
            ?.data


        const physicalBooks =
          Array.isArray(rows)

            ? rows.filter(
                book =>
                  book.book_type ===
                    'physical' ||
                  book.book_type ===
                    'both'
              )

            : []


        setResults(
          physicalBooks
        )

      }

      catch (err) {

        console.error(
          'Walk-in book search:',
          err
        )

        setResults([])

      }

      finally {

        setLoading(false)

      }

    }


  const handleKeyDown =
    event => {

      if (event.key === 'Enter') {

        event.preventDefault()

        handleSearch()

      }

    }


  if (selectedBook) {

    return (

      <div className='bg-[#F6EFC5] rounded-xl p-4 flex justify-between items-center gap-4'>

        <div className='min-w-0'>

          <p className='text-xs text-[#122F21]/60'>

            Selected Book

          </p>


          <p className='font-bold text-[#122F21] mt-1'>

            {selectedBook.title}

          </p>


          <p className='text-xs text-[#122F21]/60 mt-1'>

            Book #{selectedBook.id}
            {' • '}
            {selectedBook.book_type}

          </p>

        </div>


        <button
          type='button'
          onClick={() =>
            onSelect(null)
          }
          className='bg-[#AAC3AD] px-4 py-2 rounded-lg cursor-pointer shrink-0'
        >

          Change

        </button>

      </div>

    )

  }


  return (

    <div>

      <label className='block text-sm font-bold text-[#122F21] mb-2'>

        {title || 'Select Book'}

      </label>


      {/* NO FORM HERE */}
      <div className='flex flex-col sm:flex-row gap-2'>

        <div className='relative flex-1'>

          <Search
            size={17}
            className='absolute left-3 top-1/2 -translate-y-1/2 text-[#122F21]/50'
          />


          <input
            type='text'
            value={query}
            disabled={loading}
            onChange={event =>
              setQuery(
                event.target.value
              )
            }
            onKeyDown={
              handleKeyDown
            }
            placeholder='Search physical book...'
            className='w-full bg-[#F6EFC5] rounded-xl py-3 pl-10 pr-4 outline-none disabled:opacity-60'
          />

        </div>


        <button
          type='button'
          onClick={
            handleSearch
          }
          disabled={
            loading ||
            !query.trim()
          }
          className='bg-[#122F21] text-white px-5 py-3 rounded-xl flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50'
        >

          {
            loading
              ? (
                <RefreshCw
                  size={16}
                  className='animate-spin'
                />
              )
              : (
                <Search size={16} />
              )
          }

          Search

        </button>

      </div>


      {results.length > 0 && (

        <div className='grid grid-cols-1 md:grid-cols-2 gap-2 mt-3'>

          {results.map(book => (

            <button
              type='button'
              key={book.id}
              onClick={() =>
                onSelect(book)
              }
              className='bg-[#F6EFC5] p-4 rounded-xl text-left cursor-pointer hover:ring-2 hover:ring-[#122F21]'
            >

              <p className='font-bold text-[#122F21]'>

                {book.title}

              </p>


              <p className='text-xs text-[#122F21]/60 mt-1'>

                {
                  book.author
                    ?.full_name ||
                  book.author_name ||
                  '—'
                }

              </p>


              <p className='text-xs text-[#122F21]/60 mt-2'>

                #{book.id}
                {' • '}
                {book.book_type}

              </p>

            </button>

          ))}

        </div>

      )}


      {
        searched &&
        !loading &&
        results.length === 0 &&
        (

          <p className='text-sm text-[#122F21]/60 mt-3'>

            No physical books matched this search.

          </p>

        )
      }

    </div>

  )

}


// =====================================================
// PURCHASE
// =====================================================

const PurchaseForm = ({
  showMessage,
  onSuccess
}) => {

  const [book, setBook] =
    useState(null)

  const [quantity, setQuantity] =
    useState(1)

  const [busy, setBusy] =
    useState(false)

  const [errors, setErrors] =
    useState({})


  const handleSubmit =
    async event => {

      event.preventDefault()


      if (!book) {

        showMessage(
          'Select a book first.',
          'error'
        )

        return

      }


      const quantityValue =
        Number(quantity)


      if (
        !Number.isInteger(
          quantityValue
        ) ||
        quantityValue < 1 ||
        quantityValue > 20
      ) {

        setErrors({
          quantity:
            'Quantity must be between 1 and 20.'
        })

        return

      }


      setErrors({})

      setBusy(true)


      try {

        const res =
          await createWalkInPurchase({

            book_id:
              book.id,

            quantity:
              quantityValue

          })


        onSuccess(
          res.data?.message ||
          'Walk-in purchase recorded successfully.'
        )


        setBook(null)

        setQuantity(1)

      }

      catch (err) {

        console.error(
          'Walk-in purchase:',
          err
        )


        if (
          err.response?.status === 422 &&
          err.response?.data?.errors
        ) {

          setErrors(
            err.response.data.errors
          )

        }


        showMessage(
          err.response?.data?.message ||
          'Walk-in purchase could not be created.',
          'error'
        )

      }

      finally {

        setBusy(false)

      }

    }


  return (

    <form
      onSubmit={
        handleSubmit
      }
      className='bg-[#AAC3AD] rounded-2xl p-5 shadow-md max-w-3xl flex flex-col gap-5'
    >

      <FormHeader
        icon={ShoppingCart}
        title='Walk-in Book Sale'
        description='Sell physical copies directly to a visitor.'
      />


      <BookPicker
        selectedBook={book}
        onSelect={setBook}
        title='Physical Book *'
      />


      <div>

        <label className='block text-sm font-bold text-[#122F21] mb-2'>

          Quantity *

        </label>


        <input
          type='number'
          min='1'
          max='20'
          step='1'
          value={quantity}
          disabled={busy}
          onChange={event => {

            setQuantity(
              event.target.value
            )

            setErrors({})

          }}
          className='w-full bg-[#F6EFC5] rounded-xl p-3 outline-none disabled:opacity-60'
        />


        <FieldError
          error={
            errors.quantity
          }
        />


        <p className='text-xs text-[#122F21]/60 mt-2'>

          Maximum 20 copies per request. The backend allocates available sale copies automatically.

        </p>

      </div>


      <SubmitButton
        busy={busy}
        disabled={!book}
        icon={ShoppingCart}
        label='Confirm Sale'
      />

    </form>

  )

}


// =====================================================
// BORROWING
// =====================================================

const BorrowingForm = ({
  showMessage,
  onSuccess
}) => {

  const [book, setBook] =
    useState(null)

  const [
    options,
    setOptions
  ] = useState([])

  const [
    selectedOptionId,
    setSelectedOptionId
  ] = useState('')

  const [
    loadingOptions,
    setLoadingOptions
  ] = useState(false)

  const [busy, setBusy] =
    useState(false)


  // ===================================================
  // LOAD BORROW OPTIONS
  // GET /borrowings/book/{book}/options
  // ===================================================

  useEffect(() => {

    if (!book?.id) {

      setOptions([])

      setSelectedOptionId('')

      return

    }


    const loadOptions =
      async () => {

        setLoadingOptions(true)

        setOptions([])

        setSelectedOptionId('')


        try {

          const res =
            await getBorrowOptions(
              book.id
            )


          const rows =
            res.data?.data


          const physicalOptions =
            Array.isArray(rows)

              ? rows.filter(
                  option =>
                    option.physical_price !==
                      null &&
                    option.physical_price !==
                      undefined
                )

              : []


          setOptions(
            physicalOptions
          )


          if (
            physicalOptions.length >
            0
          ) {

            setSelectedOptionId(
              String(
                physicalOptions[0].id
              )
            )

          }

        }

        catch (err) {

          console.error(
            'Borrow options:',
            err
          )


          showMessage(
            err.response?.data?.message ||
            'Borrowing options could not be loaded.',
            'error'
          )

        }

        finally {

          setLoadingOptions(false)

        }

      }


    loadOptions()

  }, [
    book,
    showMessage
  ])


  const selectedOption =
    useMemo(
      () =>
        options.find(
          option =>
            String(option.id) ===
            String(
              selectedOptionId
            )
        ) || null,
      [
        options,
        selectedOptionId
      ]
    )


  const handleSubmit =
    async event => {

      event.preventDefault()


      if (
        !book ||
        !selectedOptionId
      ) {

        showMessage(
          'Select a book and a borrowing option.',
          'error'
        )

        return

      }


      setBusy(true)


      try {

        const res =
          await createWalkInBorrowing({

            book_id:
              book.id,

            borrow_option_id:
              Number(
                selectedOptionId
              )

          })


        onSuccess(
          res.data?.message ||
          'Walk-in borrowing created successfully.'
        )


        setBook(null)

        setOptions([])

        setSelectedOptionId('')

      }

      catch (err) {

        console.error(
          'Walk-in borrowing:',
          err
        )


        showMessage(
          err.response?.data?.message ||
          'Walk-in borrowing could not be created.',
          'error'
        )

      }

      finally {

        setBusy(false)

      }

    }


  return (

    <form
      onSubmit={
        handleSubmit
      }
      className='bg-[#AAC3AD] rounded-2xl p-5 shadow-md max-w-3xl flex flex-col gap-5'
    >

      <FormHeader
        icon={BookOpen}
        title='Walk-in Physical Borrowing'
        description='Create an immediately active physical borrowing for a visitor.'
      />


      <BookPicker
        selectedBook={book}
        onSelect={setBook}
        title='Physical Book *'
      />


      {book && (

        <div>

          <label className='block text-sm font-bold text-[#122F21] mb-2'>

            Borrowing Option *

          </label>


          {loadingOptions ? (

            <div className='bg-[#F6EFC5] rounded-xl p-4 flex items-center gap-2 text-[#122F21]'>

              <RefreshCw
                size={17}
                className='animate-spin'
              />

              Loading borrowing options...

            </div>

          ) : options.length === 0 ? (

            <div className='bg-yellow-100 text-yellow-900 rounded-xl p-4'>

              This book has no physical borrowing option available.

            </div>

          ) : (

            <select
              value={
                selectedOptionId
              }
              disabled={busy}
              onChange={event =>
                setSelectedOptionId(
                  event.target.value
                )
              }
              className='w-full bg-[#F6EFC5] rounded-xl p-3 outline-none disabled:opacity-60'
            >

              {options.map(option => (

                <option
                  key={option.id}
                  value={option.id}
                >

                  {option.duration_days} days
                  {' — '}
                  {option.physical_price}

                </option>

              ))}

            </select>

          )}


          {selectedOption && (

            <div className='grid grid-cols-2 gap-3 mt-3'>

              <InfoBox
                label='Duration'
                value={`${selectedOption.duration_days} days`}
              />

              <InfoBox
                label='Borrowing Price'
                value={
                  selectedOption.physical_price
                }
              />

            </div>

          )}

        </div>

      )}


      <SubmitButton
        busy={busy}
        disabled={
          !book ||
          !selectedOptionId ||
          loadingOptions
        }
        icon={BookOpen}
        label='Confirm Borrowing'
      />

    </form>

  )

}


// =====================================================
// RESERVATION
// =====================================================

const ReservationForm = ({
  showMessage,
  onSuccess
}) => {

  const [
    reservationDate,
    setReservationDate
  ] = useState(
    getToday()
  )

  const [period, setPeriod] =
    useState('period_1')

  const [
    seatsCount,
    setSeatsCount
  ] = useState(1)

  const [busy, setBusy] =
    useState(false)

  const [errors, setErrors] =
    useState({})


  const handleSubmit =
    async event => {

      event.preventDefault()


      const count =
        Number(seatsCount)

      const validationErrors = {}


      if (!reservationDate) {

        validationErrors
          .reservation_date =
          'Reservation date is required.'

      }


      if (
        ![
          'period_1',
          'period_2'
        ].includes(period)
      ) {

        validationErrors.period =
          'Invalid reservation period.'

      }


      if (
        !Number.isInteger(count) ||
        count < 1
      ) {

        validationErrors
          .seats_count =
          'Seats count must be at least 1.'

      }


      if (
        Object.keys(
          validationErrors
        ).length > 0
      ) {

        setErrors(
          validationErrors
        )

        return

      }


      setErrors({})

      setBusy(true)


      try {

        const res =
          await createWalkInReservation({

            reservation_date:
              reservationDate,

            period,

            seats_count:
              count

          })


        onSuccess(
          res.data?.message ||
          'Walk-in reservation created successfully.'
        )


        setSeatsCount(1)

      }

      catch (err) {

        console.error(
          'Walk-in reservation:',
          err
        )


        if (
          err.response?.status === 422 &&
          err.response?.data?.errors
        ) {

          setErrors(
            err.response.data.errors
          )

        }


        showMessage(
          err.response?.data?.message ||
          'Walk-in reservation could not be created.',
          'error'
        )

      }

      finally {

        setBusy(false)

      }

    }


  return (

    <form
      onSubmit={
        handleSubmit
      }
      className='bg-[#AAC3AD] rounded-2xl p-5 shadow-md max-w-3xl flex flex-col gap-5'
    >

      <FormHeader
        icon={Armchair}
        title='Walk-in Seat Reservation'
        description='Reserve a number of library seats directly for a visitor.'
      />


      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>

        {/* DATE */}

        <div>

          <label className='block text-sm font-bold text-[#122F21] mb-2'>

            Reservation Date *

          </label>


          <input
            type='date'
            min={getToday()}
            value={
              reservationDate
            }
            disabled={busy}
            onChange={event => {

              setReservationDate(
                event.target.value
              )

              setErrors({})

            }}
            className='w-full bg-[#F6EFC5] rounded-xl p-3 outline-none disabled:opacity-60'
          />


          <FieldError
            error={
              errors.reservation_date
            }
          />

        </div>


        {/* PERIOD */}

        <div>

          <label className='block text-sm font-bold text-[#122F21] mb-2'>

            Period *

          </label>


          <select
            value={period}
            disabled={busy}
            onChange={event => {

              setPeriod(
                event.target.value
              )

              setErrors({})

            }}
            className='w-full bg-[#F6EFC5] rounded-xl p-3 outline-none'
          >

            <option value='period_1'>

              Period 1 — 00:00 to 12:00

            </option>

            <option value='period_2'>

              Period 2 — 12:00 to 24:00

            </option>

          </select>


          <FieldError
            error={
              errors.period
            }
          />

        </div>

      </div>


      {/* SEATS */}

      <div>

        <label className='block text-sm font-bold text-[#122F21] mb-2'>

          Number of Seats *

        </label>


        <input
          type='number'
          min='1'
          step='1'
          value={seatsCount}
          disabled={busy}
          onChange={event => {

            setSeatsCount(
              event.target.value
            )

            setErrors({})

          }}
          className='w-full bg-[#F6EFC5] rounded-xl p-3 outline-none disabled:opacity-60'
        />


        <FieldError
          error={
            errors.seats_count
          }
        />

      </div>


      <SubmitButton
        busy={busy}
        icon={Armchair}
        label='Confirm Reservation'
      />

    </form>

  )

}


// =====================================================
// WALK-IN STATS
// =====================================================

const WalkInStats = ({
  refreshKey,
  showMessage
}) => {

  const [stats, setStats] =
    useState({

      sales: 0,
      borrowings: 0,
      reservations: 0

    })

  const [loading, setLoading] =
    useState(true)


  const loadStats =
    async () => {

      setLoading(true)


      try {

        const res =
          await getWalkInStats()


        const data =
          res.data?.data || {}


        setStats({

          sales:
            Number(
              data.sales || 0
            ),

          borrowings:
            Number(
              data.borrowings || 0
            ),

          reservations:
            Number(
              data.reservations || 0
            )

        })

      }

      catch (err) {

        console.error(
          'Walk-in stats:',
          err
        )


        showMessage(
          err.response?.data?.message ||
          'Walk-in statistics could not be loaded.',
          'error'
        )

      }

      finally {

        setLoading(false)

      }

    }


  useEffect(() => {

    loadStats()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])


  const total =
    stats.sales +
    stats.borrowings +
    stats.reservations


  return (

    <div className='flex flex-col gap-4'>

      <div className='flex justify-end'>

        <button
          type='button'
          disabled={loading}
          onClick={loadStats}
          className='bg-[#122F21] text-white px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50'
        >

          <RefreshCw
            size={16}
            className={
              loading
                ? 'animate-spin'
                : ''
            }
          />

          Refresh Statistics

        </button>

      </div>


      {loading ? (

        <div className='bg-[#AAC3AD] rounded-2xl min-h-[250px] flex items-center justify-center gap-3 text-[#122F21]'>

          <RefreshCw
            size={28}
            className='animate-spin'
          />

          Loading statistics...

        </div>

      ) : (

        <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>

          <StatCard
            icon={ShoppingCart}
            label='Walk-in Sales'
            value={stats.sales}
          />

          <StatCard
            icon={BookOpen}
            label='Walk-in Borrowings'
            value={stats.borrowings}
          />

          <StatCard
            icon={Armchair}
            label='Walk-in Reservations'
            value={stats.reservations}
          />

          <StatCard
            icon={BarChart3}
            label='Total Operations'
            value={total}
          />

        </div>

      )}

    </div>

  )

}


// =====================================================
// FORM HEADER
// =====================================================

const FormHeader = ({
  icon: Icon,
  title,
  description
}) => {

  return (

    <div>

      <div className='flex items-center gap-3'>

        <div className='bg-[#F09A79] p-3 rounded-xl'>

          <Icon
            size={21}
            className='text-[#122F21]'
          />

        </div>


        <div>

          <h2 className='text-xl font-bold text-[#122F21]'>

            {title}

          </h2>


          <p className='text-sm text-[#122F21]/60 mt-1'>

            {description}

          </p>

        </div>

      </div>

    </div>

  )

}


// =====================================================
// SUBMIT BUTTON
// =====================================================

const SubmitButton = ({
  busy,
  disabled = false,
  icon: Icon,
  label
}) => {

  return (

    <button
      type='submit'
      disabled={
        busy ||
        disabled
      }
      className='w-fit bg-[#122F21] text-white px-6 py-3 rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
    >

      {
        busy
          ? (
            <RefreshCw
              size={17}
              className='animate-spin'
            />
          )
          : (
            <Icon size={17} />
          )
      }

      {
        busy
          ? 'Processing...'
          : label
      }

    </button>

  )

}


// =====================================================
// INFO BOX
// =====================================================

const InfoBox = ({
  label,
  value
}) => {

  return (

    <div className='bg-[#F6EFC5] rounded-xl p-3 text-[#122F21]'>

      <p className='text-xs opacity-60'>

        {label}

      </p>


      <p className='font-bold mt-1'>

        {value ?? '—'}

      </p>

    </div>

  )

}


// =====================================================
// STAT CARD
// =====================================================

const StatCard = ({
  icon: Icon,
  label,
  value
}) => {

  return (

    <div className='bg-[#A6B37D] rounded-2xl p-5 text-[#122F21] flex items-center justify-between'>

      <div>

        <p className='text-xs opacity-70'>

          {label}

        </p>


        <p className='text-3xl font-bold mt-1'>

          {value}

        </p>

      </div>


      <Icon size={27} />

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


export default WalkIn