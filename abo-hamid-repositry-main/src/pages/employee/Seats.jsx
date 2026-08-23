import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  AlertTriangle,
  Armchair,
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X
} from 'lucide-react'

import {
  getSeats,
  addSeat,
  deleteSeat,
  getReservations
} from '../../api/libraryEmployeeApi'


// =====================================================
// CONSTANTS
// =====================================================

const STATUS_OPTIONS = [
  {
    value: 'all',
    label: 'All Statuses'
  },
  {
    value: 'pending',
    label: 'Pending'
  },
  {
    value: 'confirmed',
    label: 'Confirmed'
  },
  {
    value: 'rejected',
    label: 'Rejected'
  }
]


// =====================================================
// LOCAL DATE
// =====================================================

const getLocalDateString = () => {

  const now = new Date()

  const year =
    now.getFullYear()

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, '0')

  const day =
    String(
      now.getDate()
    ).padStart(2, '0')


  return `${year}-${month}-${day}`

}


// =====================================================
// COMPONENT
// =====================================================

const Seats = () => {

  // ===================================================
  // TAB
  // ===================================================

  const [tab, setTab] =
    useState('seats')


  // ===================================================
  // SEATS
  // ===================================================

  const [seats, setSeats] =
    useState([])

  const [
    seatsLoading,
    setSeatsLoading
  ] = useState(true)

  const [
    seatPage,
    setSeatPage
  ] = useState(1)

  const [
    seatSearch,
    setSeatSearch
  ] = useState('')

  const [
    seatsPagination,
    setSeatsPagination
  ] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    from: 0,
    to: 0
  })


  // ===================================================
  // ADD SEAT
  // ===================================================

  const [
    showAddSeat,
    setShowAddSeat
  ] = useState(false)

  const [
    newSeatCode,
    setNewSeatCode
  ] = useState('')

  const [
    addingSeat,
    setAddingSeat
  ] = useState(false)

  const [
    deletingSeatId,
    setDeletingSeatId
  ] = useState(null)

  const [
    seatFieldError,
    setSeatFieldError
  ] = useState('')


  // ===================================================
  // RESERVATIONS
  // ===================================================

  const [
    reservations,
    setReservations
  ] = useState([])

  const [
    reservationsLoading,
    setReservationsLoading
  ] = useState(true)

  const [
    reservationPage,
    setReservationPage
  ] = useState(1)

  const [
    reservationDate,
    setReservationDate
  ] = useState(
    getLocalDateString()
  )

  const [
    reservationStatus,
    setReservationStatus
  ] = useState('all')

  const [
    reservationSearch,
    setReservationSearch
  ] = useState('')

  const [
    reservationsPagination,
    setReservationsPagination
  ] = useState({
    currentPage: 1,
    lastPage: 1,
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
        maximumFractionDigits: 2
      }
    )

  }


  const formatDate = value => {

    if (!value) {
      return '—'
    }


    /*
      reservation_date قد يرجع ISO
      رغم أنه Date في DB.

      نعرض YYYY-MM-DD مباشرة لتجنب
      مشاكل timezone.
    */

    return String(value)
      .slice(0, 10)

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


  const getPeriodLabel = period => {

    if (period === 'period_1') {

      return '00:00 - 12:00'

    }


    if (period === 'period_2') {

      return '12:00 - 24:00'

    }


    return period || '—'

  }


  const getCustomerName =
    reservation => {

      if (
        reservation?.is_walk_in
      ) {

        return (
          reservation
            ?.user
            ?.full_name ||
          'Walk-in Customer'
        )

      }


      return (
        reservation
          ?.user
          ?.full_name ||
        '—'
      )

    }


  // ===================================================
  // LOAD SEATS
  //
  // GET /employee/library/seats
  //
  // Query:
  // page
  // per_page
  //
  // default per_page = 50
  // ===================================================

  const loadSeats =
    useCallback(
      async (page = 1) => {

        setSeatsLoading(true)


        try {

          const res =
            await getSeats({
              page,
              per_page: 50
            })


          const paginator =
            res.data?.data || {}


          const rows =
            Array.isArray(
              paginator.data
            )
              ? paginator.data
              : []


          setSeats(rows)


          setSeatsPagination({

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
              rows.length

          })

        }

        catch (err) {

          console.error(
            'Seats loading error:',
            err
          )


          setSeats([])


          showMessage(
            err.response?.data?.message ||
            'Seats could not be loaded.',
            'error'
          )

        }

        finally {

          setSeatsLoading(false)

        }

      },
      []
    )


  // ===================================================
  // LOAD RESERVATIONS
  //
  // GET /employee/library/reservations
  //
  // Query:
  // date
  // status
  // per_page
  // page
  // ===================================================

  const loadReservations =
    useCallback(
      async (
        page = 1,
        date = reservationDate,
        status = reservationStatus
      ) => {

        setReservationsLoading(true)


        try {

          const params = {
            page,
            per_page: 20
          }


          if (date) {

            params.date = date

          }


          if (status !== 'all') {

            params.status = status

          }


          const res =
            await getReservations(
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


          setReservations(rows)


          setReservationsPagination({

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
              rows.length

          })

        }

        catch (err) {

          console.error(
            'Reservations loading error:',
            err
          )


          setReservations([])


          showMessage(
            err.response?.data?.message ||
            'Reservations could not be loaded.',
            'error'
          )

        }

        finally {

          setReservationsLoading(
            false
          )

        }

      },
      [
        reservationDate,
        reservationStatus
      ]
    )


  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {

    loadSeats(1)

  }, [loadSeats])


  useEffect(() => {

    loadReservations(
      1,
      reservationDate,
      reservationStatus
    )

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    reservationDate,
    reservationStatus
  ])


  // ===================================================
  // ADD SEAT
  //
  // POST /employee/library/seats
  //
  // {
  //   code: string
  // }
  //
  // code:
  // required
  // max 50
  // unique
  // ===================================================

  const handleAddSeat =
    async event => {

      event.preventDefault()


      const code =
        newSeatCode.trim()


      setSeatFieldError('')


      if (!code) {

        setSeatFieldError(
          'Seat code is required.'
        )

        return

      }


      if (code.length > 50) {

        setSeatFieldError(
          'Seat code may not exceed 50 characters.'
        )

        return

      }


      setAddingSeat(true)

      setMessage('')


      try {

        const res =
          await addSeat({
            code
          })


        showMessage(
          res.data?.message ||
          `Seat ${code} added successfully.`
        )


        setShowAddSeat(false)

        setNewSeatCode('')


        setSeatPage(1)


        await loadSeats(1)

      }

      catch (err) {

        console.error(
          'Add seat error:',
          err
        )


        const validationError =
          err.response
            ?.data
            ?.errors
            ?.code?.[0]


        if (validationError) {

          setSeatFieldError(
            validationError
          )

        }


        showMessage(
          err.response?.data?.message ||
          'Seat could not be added.',
          'error'
        )

      }

      finally {

        setAddingSeat(false)

      }

    }


  // ===================================================
  // DELETE SEAT
  //
  // DELETE
  // /employee/library/seats/{seat}
  // ===================================================

  const handleDeleteSeat =
    async seat => {

      const confirmed =
        window.confirm(
          `Delete seat "${seat.code}"?`
        )


      if (!confirmed) {
        return
      }


      setDeletingSeatId(
        seat.id
      )

      setMessage('')


      try {

        const res =
          await deleteSeat(
            seat.id
          )


        showMessage(
          res.data?.message ||
          `Seat ${seat.code} deleted successfully.`
        )


        const targetPage =

          seats.length === 1 &&
          seatsPagination.currentPage > 1

            ? seatsPagination.currentPage - 1

            : seatsPagination.currentPage


        setSeatPage(
          targetPage
        )


        await loadSeats(
          targetPage
        )

      }

      catch (err) {

        console.error(
          'Delete seat error:',
          err
        )


        showMessage(
          err.response?.data?.message ||
          'Seat could not be deleted.',
          'error'
        )

      }

      finally {

        setDeletingSeatId(null)

      }

    }


  // ===================================================
  // LOCAL SEAT SEARCH
  //
  // Backend has no search query for seats.
  // ===================================================

  const filteredSeats =
    useMemo(() => {

      const query =
        seatSearch
          .trim()
          .toLowerCase()


      if (!query) {
        return seats
      }


      return seats.filter(
        seat =>
          String(
            seat.code || ''
          )
            .toLowerCase()
            .includes(query) ||

          String(
            seat.id || ''
          ).includes(query)
      )

    }, [
      seats,
      seatSearch
    ])


  // ===================================================
  // LOCAL RESERVATION SEARCH
  // ===================================================

  const filteredReservations =
    useMemo(() => {

      const query =
        reservationSearch
          .trim()
          .toLowerCase()


      if (!query) {
        return reservations
      }


      return reservations.filter(
        reservation => {

          const values = [

            reservation.id,

            reservation.user_id,

            getCustomerName(
              reservation
            ),

            reservation
              ?.user
              ?.email,

            reservation.period,

            reservation.status,

            reservation.seats_count

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
      reservations,
      reservationSearch
    ])


  // ===================================================
  // RESERVATION SUMMARY
  //
  // current server page only for seat counts.
  // ===================================================

  const reservationSummary =
    useMemo(() => {

      return reservations.reduce(
        (
          result,
          reservation
        ) => {

          const seatsCount =
            Number(
              reservation.seats_count ||
              0
            )


          if (
            reservation.status ===
            'confirmed'
          ) {

            result.confirmedReservations +=
              1

            result.confirmedSeats +=
              seatsCount

          }


          if (
            reservation.status ===
            'pending'
          ) {

            result.pendingReservations +=
              1

          }


          if (
            reservation.is_walk_in
          ) {

            result.walkIn += 1

          }


          return result

        },
        {
          confirmedReservations: 0,
          confirmedSeats: 0,
          pendingReservations: 0,
          walkIn: 0
        }
      )

    }, [reservations])


  // ===================================================
  // TAB CHANGE
  // ===================================================

  const changeTab = value => {

    setTab(value)

    setMessage('')

  }


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

          <Armchair size={28} />

          Seats & Reservations

        </h1> */}


        <p className='text-sm text-[#122F21]/60 mt-1'>

          Manage library seats and review customer reservations.

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

          {message}

        </div>

      )}


      {/* =============================================
          TABS
      ============================================== */}

      <div className='bg-[#AAC3AD] rounded-2xl p-2 flex gap-2 w-fit'>


        <button
          type='button'
          onClick={() =>
            changeTab('seats')
          }
          className={`
            px-5
            py-2.5
            rounded-xl
            cursor-pointer
            flex
            items-center
            gap-2

            ${
              tab === 'seats'

                ? 'bg-[#122F21] text-white'

                : 'text-[#122F21]'
            }
          `}
        >

          <Armchair size={17} />

          Seats

        </button>


        <button
          type='button'
          onClick={() =>
            changeTab(
              'reservations'
            )
          }
          className={`
            px-5
            py-2.5
            rounded-xl
            cursor-pointer
            flex
            items-center
            gap-2

            ${
              tab ===
              'reservations'

                ? 'bg-[#122F21] text-white'

                : 'text-[#122F21]'
            }
          `}
        >

          <CalendarDays
            size={17}
          />

          Reservations

        </button>

      </div>


      {/* =============================================
          SEATS TAB
      ============================================== */}

      {tab === 'seats' && (

        <>


          {/* SUMMARY */}

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>


            <SummaryCard
              label='Total Seats'
              value={
                seatsPagination.total
              }
              icon={Armchair}
            />


            <SummaryCard
              label='Seats On This Page'
              value={
                seats.length
              }
              icon={Users}
            />

          </div>


          {/* ACTION BAR */}

          <div className='bg-[#AAC3AD] rounded-2xl p-4 shadow-md flex flex-col md:flex-row gap-3'>


            <div className='relative flex-1'>

              <Search
                size={18}
                className='absolute left-3 top-1/2 -translate-y-1/2 text-[#122F21]/60'
              />


              <input
                type='text'
                value={seatSearch}
                onChange={event =>
                  setSeatSearch(
                    event.target.value
                  )
                }
                placeholder='Search current page by seat code...'
                className='w-full bg-[#F6EFC5] rounded-xl py-3 pl-10 pr-4 outline-none'
              />

            </div>


            <button
              type='button'
              disabled={seatsLoading}
              onClick={() =>
                loadSeats(
                  seatsPagination
                    .currentPage
                )
              }
              className='bg-[#F6EFC5] px-4 py-3 rounded-xl flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50'
            >

              <RefreshCw
                size={16}
                className={
                  seatsLoading
                    ? 'animate-spin'
                    : ''
                }
              />

              Refresh

            </button>


            <button
              type='button'
              onClick={() => {

                setNewSeatCode('')

                setSeatFieldError('')

                setShowAddSeat(true)

              }}
              className='bg-[#122F21] text-white px-5 py-3 rounded-xl flex justify-center items-center gap-2 cursor-pointer'
            >

              <Plus size={17} />

              Add Seat

            </button>

          </div>


          {/* TABLE */}

          <div className='bg-[#AAC3AD] rounded-2xl shadow-md overflow-hidden'>


            {seatsLoading ? (

              <LoadingBlock
                text='Loading seats...'
              />

            ) : filteredSeats.length === 0 ? (

              <EmptyBlock
                icon={Armchair}
                text={
                  seats.length === 0
                    ? 'There are no seats yet.'
                    : 'No seats match the current search.'
                }
              />

            ) : (

              <div className='overflow-x-auto h-full'>


                <table className='w-full min-w-[650px] text-[#122F21]'>


                  <thead className='bg-[#A6B37D]'>

                    <tr>

                      <th className='p-4 text-center'>
                        ID
                      </th>

                      <th className='p-4 text-left'>
                        Seat Code
                      </th>

                      <th className='p-4 text-center'>
                        Created
                      </th>

                      <th className='p-4 text-center'>
                        Action
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {filteredSeats.map(
                      seat => (

                        <tr
                          key={seat.id}
                          className='border-b border-[#122F21]/10 hover:bg-[#6cb474]/30 transition'
                        >


                          <td className='p-4 text-center font-bold'>

                            #{seat.id}

                          </td>


                          <td className='p-4 font-bold'>

                            {seat.code}

                          </td>


                          <td className='p-4 text-center text-sm'>

                            {
                              formatDateTime(
                                seat.created_at
                              )
                            }

                          </td>


                          <td className='p-4 text-center'>

                            <button
                              type='button'
                              disabled={
                                deletingSeatId ===
                                seat.id
                              }
                              onClick={() =>
                                handleDeleteSeat(
                                  seat
                                )
                              }
                              className='bg-red-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 cursor-pointer disabled:opacity-50'
                            >

                              {
                                deletingSeatId ===
                                seat.id

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

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>


          {/* SEAT PAGINATION */}

          {
            !seatsLoading &&
            seatsPagination.lastPage >
              1 &&
            (

              <Pagination
                pagination={
                  seatsPagination
                }
                onPage={page => {

                  setSeatSearch('')

                  setSeatPage(page)

                  loadSeats(page)

                }}
              />

            )
          }

        </>

      )}


      {/* =============================================
          RESERVATIONS TAB
      ============================================== */}

      {tab === 'reservations' && (

        <>


          {/* FILTERS */}

          <div className='bg-[#AAC3AD] rounded-2xl p-4 shadow-md flex flex-col xl:flex-row gap-3'>


            <div>

              <label className='block text-xs font-bold text-[#122F21] mb-1'>

                Reservation Date

              </label>


              <input
                type='date'
                value={
                  reservationDate
                }
                onChange={event => {

                  setReservationPage(1)

                  setReservationSearch('')

                  setReservationDate(
                    event.target.value
                  )

                }}
                className='bg-[#F6EFC5] rounded-xl px-4 py-3 outline-none'
              />

            </div>


            <div>

              <label className='block text-xs font-bold text-[#122F21] mb-1'>

                Status

              </label>


              <select
                value={
                  reservationStatus
                }
                onChange={event => {

                  setReservationPage(1)

                  setReservationSearch('')

                  setReservationStatus(
                    event.target.value
                  )

                }}
                className='bg-[#F6EFC5] rounded-xl px-4 py-3 outline-none'
              >

                {STATUS_OPTIONS.map(
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

            </div>


            <div className='relative flex-1 xl:self-end'>

              <Search
                size={18}
                className='absolute left-3 top-1/2 -translate-y-1/2 text-[#122F21]/60'
              />


              <input
                type='text'
                value={
                  reservationSearch
                }
                onChange={event =>
                  setReservationSearch(
                    event.target.value
                  )
                }
                placeholder='Search current page by customer or reservation ID...'
                className='w-full bg-[#F6EFC5] rounded-xl py-3 pl-10 pr-4 outline-none'
              />

            </div>


            <button
              type='button'
              disabled={
                reservationsLoading
              }
              onClick={() =>
                loadReservations(
                  reservationsPagination
                    .currentPage,
                  reservationDate,
                  reservationStatus
                )
              }
              className='xl:self-end bg-[#122F21] text-white px-4 py-3 rounded-xl flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50'
            >

              <RefreshCw
                size={16}
                className={
                  reservationsLoading
                    ? 'animate-spin'
                    : ''
                }
              />

              Refresh

            </button>

          </div>


          {/* RESERVATION SUMMARY */}

          <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3'>


            <SummaryCard
              label='Matching Reservations'
              value={
                reservationsPagination
                  .total
              }
              icon={CalendarDays}
            />


            <SummaryCard
              label='Confirmed On Page'
              value={
                reservationSummary
                  .confirmedReservations
              }
              icon={CheckCircle}
            />


            <SummaryCard
              label='Confirmed Seats On Page'
              value={
                reservationSummary
                  .confirmedSeats
              }
              icon={Armchair}
            />


            <SummaryCard
              label='Pending On Page'
              value={
                reservationSummary
                  .pendingReservations
              }
              icon={Clock3}
            />

          </div>


          {/* IMPORTANT NOTE */}

          {/* <div className='bg-[#A6B37D]/50 rounded-xl p-4 text-[#122F21] flex gap-3'>

            <AlertTriangle
              size={20}
              className='shrink-0 mt-0.5'
            />


            <p className='text-sm leading-6'>

              A reservation stores a
              <strong>
                {' '}
                number of seats
              </strong>
              , not specific seat codes. The individual seat records managed in the Seats tab represent the library's total seat inventory.

            </p>

          </div> */}


          {/* RESERVATIONS TABLE */}

          <div className='bg-[#AAC3AD] rounded-2xl shadow-md overflow-hidden'>


            {reservationsLoading ? (

              <LoadingBlock
                text='Loading reservations...'
              />

            ) : filteredReservations.length ===
              0 ? (

              <EmptyBlock
                icon={CalendarDays}
                text='No reservations match the selected filters.'
              />

            ) : (

              <div className='overflow-x-auto'>


                <table className='w-full min-w-[1050px] text-[#122F21]'>


                  <thead className='bg-[#A6B37D]'>

                    <tr>

                      <th className='p-4 text-center'>
                        ID
                      </th>

                      <th className='p-4 text-left'>
                        Customer
                      </th>

                      <th className='p-4 text-center'>
                        Date
                      </th>

                      <th className='p-4 text-center'>
                        Period
                      </th>

                      <th className='p-4 text-center'>
                        Seats
                      </th>

                      <th className='p-4 text-center'>
                        Price
                      </th>

                      <th className='p-4 text-center'>
                        Source
                      </th>

                      <th className='p-4 text-center'>
                        Status
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {filteredReservations.map(
                      reservation => (

                        <tr
                          key={reservation.id}
                          className='border-b border-[#122F21]/10 hover:bg-[#6cb474]/30 transition'
                        >


                          <td className='p-4 text-center font-bold'>

                            #{reservation.id}

                          </td>


                          <td className='p-4'>

                            <p className='font-bold'>

                              {
                                getCustomerName(
                                  reservation
                                )
                              }

                            </p>


                            <p className='text-xs opacity-60 mt-1'>

                              {
                                reservation
                                  ?.user
                                  ?.email ||
                                (
                                  reservation
                                    .is_walk_in
                                    ? 'Walk-in'
                                    : '—'
                                )
                              }

                            </p>

                          </td>


                          <td className='p-4 text-center'>

                            {
                              formatDate(
                                reservation
                                  .reservation_date
                              )
                            }

                          </td>


                          <td className='p-4 text-center'>

                            <span className='bg-[#F6EFC5] px-3 py-1 rounded-lg text-sm'>

                              {
                                getPeriodLabel(
                                  reservation
                                    .period
                                )
                              }

                            </span>

                          </td>


                          <td className='p-4 text-center font-bold'>

                            {
                              reservation
                                .seats_count ??
                              '—'
                            }

                          </td>


                          <td className='p-4 text-center font-bold'>

                            {
                              formatMoney(
                                reservation
                                  .price
                              )
                            }

                          </td>


                          <td className='p-4 text-center'>

                            {
                              reservation
                                .is_walk_in

                                ? (
                                  <span className='bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold'>

                                    Walk-in

                                  </span>
                                )

                                : (
                                  <span className='bg-[#F6EFC5] px-3 py-1 rounded-full text-xs font-bold'>

                                    Registered

                                  </span>
                                )
                            }

                          </td>


                          <td className='p-4 text-center'>

                            <ReservationStatusBadge
                              status={
                                reservation
                                  .status
                              }
                            />

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>


          {/* RESERVATION PAGINATION */}

          {
            !reservationsLoading &&
            reservationsPagination.lastPage >
              1 &&
            (

              <Pagination
                pagination={
                  reservationsPagination
                }
                onPage={page => {

                  setReservationSearch('')

                  setReservationPage(
                    page
                  )

                  loadReservations(
                    page,
                    reservationDate,
                    reservationStatus
                  )

                }}
              />

            )
          }

        </>

      )}


      {/* =============================================
          ADD SEAT MODAL
      ============================================== */}

      {showAddSeat && (

        <div
          className='fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4'
          onClick={() =>
            !addingSeat &&
            setShowAddSeat(false)
          }
        >

          <div
            className='bg-[#F6EFC5] rounded-2xl shadow-xl w-full max-w-md'
            onClick={event =>
              event.stopPropagation()
            }
          >


            <div className='p-5 border-b border-[#122F21]/10 flex justify-between items-center'>


              <div>

                <h2 className='text-xl font-bold text-[#122F21]'>

                  Add Seat

                </h2>


                <p className='text-sm text-[#122F21]/60 mt-1'>

                  Enter a unique seat code.

                </p>

              </div>


              <button
                type='button'
                disabled={addingSeat}
                onClick={() =>
                  setShowAddSeat(false)
                }
                className='bg-[#AAC3AD] p-2 rounded-lg cursor-pointer disabled:opacity-50'
              >

                <X size={20} />

              </button>

            </div>


            <form
              onSubmit={
                handleAddSeat
              }
              className='p-5'
            >


              <label className='block text-sm font-bold text-[#122F21] mb-2'>

                Seat Code *

              </label>


              <input
                type='text'
                maxLength={50}
                value={newSeatCode}
                disabled={addingSeat}
                onChange={event => {

                  setNewSeatCode(
                    event.target.value
                  )

                  setSeatFieldError('')

                }}
                placeholder='Example: A-01'
                className='w-full bg-[#AAC3AD] rounded-xl p-3 outline-none disabled:opacity-60'
              />


              <div className='flex justify-between mt-1'>


                <div>

                  {seatFieldError && (

                    <p className='text-red-700 text-xs'>

                      {seatFieldError}

                    </p>

                  )}

                </div>


                <span className='text-xs text-[#122F21]/50'>

                  {newSeatCode.length}/50

                </span>

              </div>


              <div className='bg-[#A6B37D]/50 rounded-xl p-4 text-sm text-[#122F21] mt-4'>

                The code must be unique. Examples:
                {' '}
                <strong>A-01</strong>,
                {' '}
                <strong>A-02</strong>,
                {' '}
                <strong>B-01</strong>.

              </div>


              <div className='flex justify-end gap-2 mt-5'>


                <button
                  type='button'
                  disabled={addingSeat}
                  onClick={() =>
                    setShowAddSeat(false)
                  }
                  className='bg-gray-300 px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                >

                  Cancel

                </button>


                <button
                  type='submit'
                  disabled={
                    addingSeat ||
                    !newSeatCode.trim()
                  }
                  className='bg-[#122F21] text-white px-5 py-2 rounded-lg flex items-center gap-2 cursor-pointer disabled:opacity-50'
                >

                  {
                    addingSeat

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

                  Add Seat

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
// STATUS BADGE
// =====================================================

const ReservationStatusBadge = ({
  status
}) => {

  const classes = {

    pending:
      'bg-yellow-100 text-yellow-800',

    confirmed:
      'bg-green-100 text-green-700',

    rejected:
      'bg-red-100 text-red-700'

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
// SUMMARY CARD
// =====================================================

const SummaryCard = ({
  label,
  value,
  icon: Icon
}) => {

  return (

    <div className='bg-[#A6B37D] rounded-xl p-4 text-[#122F21] flex items-center justify-between'>

      <div>

        <p className='text-xs opacity-70'>

          {label}

        </p>


        <p className='text-2xl font-bold mt-1'>

          {value}

        </p>

      </div>


      <Icon size={23} />

    </div>

  )

}


// =====================================================
// LOADING
// =====================================================

const LoadingBlock = ({
  text
}) => {

  return (

    <div className='min-h-[300px] flex justify-center items-center gap-3 text-[#122F21]'>

      <RefreshCw
        size={30}
        className='animate-spin'
      />

      {text}

    </div>

  )

}


// =====================================================
// EMPTY
// =====================================================

const EmptyBlock = ({
  icon: Icon,
  text
}) => {

  return (

    <div className='min-h-[280px] flex flex-col justify-center items-center text-center text-[#122F21]/60 p-5'>

      <Icon
        size={44}
        className='mb-3'
      />

      {text}

    </div>

  )

}


// =====================================================
// PAGINATION
// =====================================================

const Pagination = ({
  pagination,
  onPage
}) => {

  return (

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
            onPage(
              pagination.currentPage - 1
            )
          }
          className='bg-[#AAC3AD] p-2 rounded-lg cursor-pointer disabled:opacity-40'
        >

          <ChevronLeft size={20} />

        </button>


        <span className='bg-[#122F21] text-white px-4 py-2 rounded-lg'>

          Page
          {' '}
          {pagination.currentPage}
          {' '}
          /
          {' '}
          {pagination.lastPage}

        </span>


        <button
          type='button'
          disabled={
            pagination.currentPage >=
            pagination.lastPage
          }
          onClick={() =>
            onPage(
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


export default Seats