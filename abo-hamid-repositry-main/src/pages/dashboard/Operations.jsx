import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle,
  Clock3,
  DollarSign,
  RefreshCw,
  RotateCcw,
  ShoppingCart,
  Users
} from 'lucide-react'

import api from '../../api/axios'


const Operations = () => {

  // =====================================================
  // ACTIVE TAB
  // =====================================================

  const [activeTab, setActiveTab] =
    useState('sales')


  // =====================================================
  // SALES
  // =====================================================

  const [sales, setSales] =
    useState([])

  const [salesLoading, setSalesLoading] =
    useState(false)

  const [salesFilter, setSalesFilter] =
    useState({
      from: '',
      to: ''
    })


  // =====================================================
  // BORROWINGS
  // =====================================================

  const [borrowings, setBorrowings] =
    useState({
      by_status: [],
      overdue_count: 0
    })

  const [
    borrowingsLoading,
    setBorrowingsLoading
  ] = useState(false)


  // =====================================================
  // RESERVATIONS
  // =====================================================

  const [reservations, setReservations] =
    useState([])

  const [
    reservationsLoading,
    setReservationsLoading
  ] = useState(false)


  // =====================================================
  // WALK-IN VS REGISTERED
  // =====================================================

  const [
    walkInStats,
    setWalkInStats
  ] = useState({
    sales: {
      walk_in: 0,
      registered: 0
    },

    borrowings: {
      walk_in: 0,
      registered: 0
    },

    reservations: {
      walk_in: 0,
      registered: 0
    }
  })

  const [
    walkInLoading,
    setWalkInLoading
  ] = useState(false)


  // =====================================================
  // PAGE MESSAGE
  // =====================================================

  const [message, setMessage] =
    useState('')

  const [messageType, setMessageType] =
    useState('success')


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


  const formatNumber = value => {

    const number =
      Number(value ?? 0)


    if (Number.isNaN(number)) {
      return '0'
    }


    return number.toLocaleString()

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


  const getPeriodLabel = period => {

    if (period === 'period_1') {
      return '00:00 - 12:00'
    }


    if (period === 'period_2') {
      return '12:00 - 24:00'
    }


    return period || '—'

  }


  const getStatusClass = status => {

    switch (status) {

      case 'active':
      case 'confirmed':
      case 'completed':
      case 'returned':
        return 'bg-green-100 text-green-700'

      case 'pending':
        return 'bg-yellow-100 text-yellow-800'

      case 'rejected':
      case 'expired':
        return 'bg-red-100 text-red-700'

      default:
        return 'bg-gray-100 text-gray-700'

    }

  }


  // =====================================================
  // LOAD SALES
  //
  // GET /admin/stats/sales
  //
  // Optional Query:
  // from=YYYY-MM-DD
  // to=YYYY-MM-DD
  // =====================================================

  const loadSales = useCallback(
    async (filter = salesFilter) => {

      setSalesLoading(true)

      setMessage('')


      try {

        const params = {}


        if (filter.from) {
          params.from = filter.from
        }


        if (filter.to) {
          params.to = filter.to
        }


        const res = await api.get(
          '/admin/stats/sales',
          {
            params
          }
        )


        const data =
          res.data?.data


        setSales(
          Array.isArray(data)
            ? data
            : []
        )

      }

      catch (err) {

        console.error(
          'Sales statistics error:',
          err
        )


        setSales([])


        showMessage(
          err.response?.data?.message ||
          'Sales statistics could not be loaded.',
          'error'
        )

      }

      finally {

        setSalesLoading(false)

      }

    },
    [salesFilter]
  )


  // =====================================================
  // LOAD BORROWINGS
  //
  // GET /admin/stats/borrowings
  //
  // Response:
  //
  // {
  //   by_status: [],
  //   overdue_count: 7
  // }
  // =====================================================

  const loadBorrowings =
    useCallback(async () => {

      setBorrowingsLoading(true)

      setMessage('')


      try {

        const res =
          await api.get(
            '/admin/stats/borrowings'
          )


        const data =
          res.data?.data || {}


        setBorrowings({

          by_status:
            Array.isArray(
              data.by_status
            )
              ? data.by_status
              : [],

          overdue_count:
            Number(
              data.overdue_count ??
              0
            )

        })

      }

      catch (err) {

        console.error(
          'Borrowings statistics error:',
          err
        )


        setBorrowings({
          by_status: [],
          overdue_count: 0
        })


        showMessage(
          err.response?.data?.message ||
          'Borrowing statistics could not be loaded.',
          'error'
        )

      }

      finally {

        setBorrowingsLoading(false)

      }

    }, [])


  // =====================================================
  // LOAD RESERVATIONS
  //
  // GET /admin/stats/reservations
  //
  // Response:
  //
  // [
  //   {
  //     status,
  //     period,
  //     count,
  //     seats
  //   }
  // ]
  // =====================================================

  const loadReservations =
    useCallback(async () => {

      setReservationsLoading(true)

      setMessage('')


      try {

        const res =
          await api.get(
            '/admin/stats/reservations'
          )


        const data =
          res.data?.data


        setReservations(
          Array.isArray(data)
            ? data
            : []
        )

      }

      catch (err) {

        console.error(
          'Reservations statistics error:',
          err
        )


        setReservations([])


        showMessage(
          err.response?.data?.message ||
          'Reservation statistics could not be loaded.',
          'error'
        )

      }

      finally {

        setReservationsLoading(false)

      }

    }, [])


  // =====================================================
  // LOAD WALK-IN VS REGISTERED
  //
  // GET /admin/stats/walk-in-vs-registered
  // =====================================================

  const loadWalkIn =
    useCallback(async () => {

      setWalkInLoading(true)

      setMessage('')


      try {

        const res =
          await api.get(
            '/admin/stats/walk-in-vs-registered'
          )


        const data =
          res.data?.data || {}


        setWalkInStats({

          sales: {

            walk_in:
              Number(
                data.sales
                  ?.walk_in ??
                0
              ),

            registered:
              Number(
                data.sales
                  ?.registered ??
                0
              )

          },

          borrowings: {

            walk_in:
              Number(
                data.borrowings
                  ?.walk_in ??
                0
              ),

            registered:
              Number(
                data.borrowings
                  ?.registered ??
                0
              )

          },

          reservations: {

            walk_in:
              Number(
                data.reservations
                  ?.walk_in ??
                0
              ),

            registered:
              Number(
                data.reservations
                  ?.registered ??
                0
              )

          }

        })

      }

      catch (err) {

        console.error(
          'Walk-in statistics error:',
          err
        )


        showMessage(
          err.response?.data?.message ||
          'Walk-in statistics could not be loaded.',
          'error'
        )

      }

      finally {

        setWalkInLoading(false)

      }

    }, [])


  // =====================================================
  // LOAD ALL
  // =====================================================

  const loadAll =
    useCallback(async () => {

      await Promise.allSettled([

        loadSales(),

        loadBorrowings(),

        loadReservations(),

        loadWalkIn()

      ])

    }, [
      loadSales,
      loadBorrowings,
      loadReservations,
      loadWalkIn
    ])


  // =====================================================
  // FIRST LOAD
  // =====================================================

  useEffect(() => {

    loadAll()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  // =====================================================
  // SALES SUMMARY
  // =====================================================

  const salesSummary =
    useMemo(() => {

      return sales.reduce(
        (
          result,
          item
        ) => {

          const count =
            Number(
              item.items_count ??
              0
            )


          const revenue =
            parseFloat(
              item.revenue ??
              0
            )


          result.items +=
            Number.isNaN(count)
              ? 0
              : count


          result.revenue +=
            Number.isNaN(revenue)
              ? 0
              : revenue


          if (
            item.type ===
            'physical'
          ) {

            result.physical +=
              Number.isNaN(count)
                ? 0
                : count

          }


          if (
            item.type ===
            'digital'
          ) {

            result.digital +=
              Number.isNaN(count)
                ? 0
                : count

          }


          return result

        },
        {
          items: 0,
          revenue: 0,
          physical: 0,
          digital: 0
        }
      )

    }, [sales])


  // =====================================================
  // BORROWINGS SUMMARY
  // =====================================================

  const totalBorrowings =
    useMemo(() => {

      return borrowings.by_status
        .reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.count ?? 0
            ),
          0
        )

    }, [borrowings])


  // =====================================================
  // RESERVATIONS SUMMARY
  // =====================================================

  const reservationsSummary =
    useMemo(() => {

      return reservations.reduce(
        (
          result,
          item
        ) => {

          result.reservations +=
            Number(
              item.count ?? 0
            )


          result.seats +=
            Number(
              item.seats ?? 0
            )


          return result

        },
        {
          reservations: 0,
          seats: 0
        }
      )

    }, [reservations])


  // =====================================================
  // WALK-IN TABLE
  // =====================================================

  const walkInRows =
    useMemo(() => {

      return [

        {
          operation: 'Sales',

          walk_in:
            walkInStats
              .sales
              .walk_in,

          registered:
            walkInStats
              .sales
              .registered
        },

        {
          operation:
            'Borrowings',

          walk_in:
            walkInStats
              .borrowings
              .walk_in,

          registered:
            walkInStats
              .borrowings
              .registered
        },

        {
          operation:
            'Reservations',

          walk_in:
            walkInStats
              .reservations
              .walk_in,

          registered:
            walkInStats
              .reservations
              .registered
        }

      ].map(item => {

        const total =
          item.walk_in +
          item.registered


        return {

          ...item,

          total,

          walkInPercent:
            total > 0
              ? (
                  item.walk_in /
                  total
                ) * 100
              : 0

        }

      })

    }, [walkInStats])


  // =====================================================
  // SALES FILTER
  // =====================================================

  const handleSalesFilter =
    async event => {

      event.preventDefault()


      if (
        salesFilter.from &&
        salesFilter.to &&
        salesFilter.from >
          salesFilter.to
      ) {

        showMessage(
          'The end date must be after or equal to the start date.',
          'error'
        )

        return
      }


      await loadSales(
        salesFilter
      )

  }


  const clearSalesFilter =
    async () => {

      const emptyFilter = {
        from: '',
        to: ''
      }


      setSalesFilter(
        emptyFilter
      )


      await loadSales(
        emptyFilter
      )

  }


  // =====================================================
  // REFRESH CURRENT TAB
  // =====================================================

  const refreshCurrentTab = () => {

    switch (activeTab) {

      case 'sales':
        loadSales()
        break

      case 'borrowings':
        loadBorrowings()
        break

      case 'reservations':
        loadReservations()
        break

      case 'walkin':
        loadWalkIn()
        break

      default:
        break

    }

  }


  // =====================================================
  // CURRENT LOADING
  // =====================================================

  const currentLoading =

    activeTab === 'sales'
      ? salesLoading

      : activeTab ===
        'borrowings'
        ? borrowingsLoading

        : activeTab ===
          'reservations'
          ? reservationsLoading

          : walkInLoading


  // =====================================================
  // TABS
  // =====================================================

  const tabs = [

    {
      key: 'sales',
      label: 'Sales',
      icon: ShoppingCart
    },

    {
      key: 'borrowings',
      label: 'Borrowings',
      icon: BookOpen
    },

    {
      key: 'reservations',
      label: 'Reservations',
      icon: CalendarDays
    },

    {
      key: 'walkin',
      label: 'Walk-in Comparison',
      icon: Users
    }

  ]


  // =====================================================
  // JSX
  // =====================================================

  return (

    <div className='w-full flex flex-col h-screen gap-5 pb-10'>


      {/* =============================================
          HEADER
      ============================================== */}

      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>


        <div>

          {/* <h1 className='text-2xl font-bold text-[#122F21]'>

            Operations Statistics

          </h1> */}


          <p className='text-sm text-[#122F21]/60 mt-1'>

            Monitor sales, borrowings, reservations and walk-in activity.

          </p>

        </div>


        <button
          type='button'
          disabled={currentLoading}
          onClick={
            refreshCurrentTab
          }
          className='flex items-center justify-center gap-2 bg-[#122F21] text-white px-4 py-2 rounded-xl cursor-pointer disabled:opacity-50'
        >

          <RefreshCw
            size={17}
            className={
              currentLoading
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
          TABS
      ============================================== */}

      <div className='flex flex-wrap gap-2'>


        {tabs.map(tab => {

          const Icon =
            tab.icon


          return (

            <button
              key={tab.key}
              type='button'
              onClick={() => {

                setActiveTab(
                  tab.key
                )

                setMessage('')

              }}
              className={`
                flex
                items-center
                gap-2
                px-4
                py-3
                rounded-xl
                cursor-pointer
                transition

                ${
                  activeTab ===
                  tab.key

                    ? 'bg-[#122F21] text-white'

                    : 'bg-[#AAC3AD] text-[#122F21]'
                }
              `}
            >

              <Icon size={17} />

              {tab.label}

            </button>

          )

        })}

      </div>


      {/* =============================================
          SALES TAB
      ============================================== */}

      {activeTab === 'sales' && (

        <div className='flex flex-col gap-5'>


          {/* FILTER */}

          <form
            onSubmit={
              handleSalesFilter
            }
            className='bg-[#AAC3AD] p-4 rounded-2xl shadow-md flex flex-col lg:flex-row gap-4 lg:items-end'
          >


            <div className='flex-1'>

              <label className='block text-xs text-[#122F21]/60 mb-1'>

                From

              </label>


              <input
                type='date'
                value={
                  salesFilter.from
                }
                onChange={event =>
                  setSalesFilter(
                    prev => ({
                      ...prev,

                      from:
                        event.target
                          .value
                    })
                  )
                }
                className='w-full bg-[#F6EFC5] rounded-xl px-4 py-3 outline-none'
              />

            </div>


            <div className='flex-1'>

              <label className='block text-xs text-[#122F21]/60 mb-1'>

                To

              </label>


              <input
                type='date'
                value={
                  salesFilter.to
                }
                min={
                  salesFilter.from ||
                  undefined
                }
                onChange={event =>
                  setSalesFilter(
                    prev => ({
                      ...prev,

                      to:
                        event.target
                          .value
                    })
                  )
                }
                className='w-full bg-[#F6EFC5] rounded-xl px-4 py-3 outline-none'
              />

            </div>


            <button
              type='submit'
              disabled={salesLoading}
              className='bg-[#122F21] text-white px-5 py-3 rounded-xl cursor-pointer disabled:opacity-50'
            >

              Apply Filter

            </button>


            <button
              type='button'
              disabled={salesLoading}
              onClick={
                clearSalesFilter
              }
              className='bg-[#F6EFC5] text-[#122F21] px-5 py-3 rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2'
            >

              <RotateCcw size={16} />

              Clear

            </button>

          </form>


          {/* SUMMARY */}

          <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>

            <StatCard
              title='Items Sold'
              value={
                formatNumber(
                  salesSummary.items
                )
              }
              icon={ShoppingCart}
            />

            <StatCard
              title='Physical Sales'
              value={
                formatNumber(
                  salesSummary.physical
                )
              }
              icon={BookOpen}
            />

            <StatCard
              title='Digital Sales'
              value={
                formatNumber(
                  salesSummary.digital
                )
              }
              icon={BookOpen}
            />

            <StatCard
              title='Sales Revenue'
              value={
                formatMoney(
                  salesSummary.revenue
                )
              }
              icon={DollarSign}
            />

          </div>


          {/* SALES TABLE */}

          <SectionCard
            title='Sales Details'
          >

            {salesLoading ? (

              <LoadingBlock
                text='Loading sales...'
              />

            ) : sales.length === 0 ? (

              <EmptyBlock
                text='There are no sales statistics for the selected period.'
              />

            ) : (

              <div className='overflow-x-auto h-full'>

                <table className='w-full min-w-[650px] text-[#122F21]'>


                  <thead className='bg-[#A6B37D]'>

                    <tr>

                      <th className='p-4 text-center'>
                        Date
                      </th>

                      <th className='p-4 text-center'>
                        Type
                      </th>

                      <th className='p-4 text-center'>
                        Items
                      </th>

                      <th className='p-4 text-center'>
                        Revenue
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {sales.map(
                      (
                        item,
                        index
                      ) => (

                        <tr
                          key={
                            `${item.date}-${item.type}-${index}`
                          }
                          className='border-b border-[#122F21]/10 hover:bg-[#6cb474]/30'
                        >

                          <td className='p-4 text-center'>

                            {
                              formatDate(
                                item.date
                              )
                            }

                          </td>


                          <td className='p-4 text-center'>

                            <span className='bg-[#F6EFC5] px-3 py-1 rounded-lg text-sm capitalize'>

                              {
                                item.type ||
                                '—'
                              }

                            </span>

                          </td>


                          <td className='p-4 text-center font-bold'>

                            {
                              formatNumber(
                                item.items_count
                              )
                            }

                          </td>


                          <td className='p-4 text-center font-bold'>

                            {
                              formatMoney(
                                item.revenue
                              )
                            }

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </SectionCard>

        </div>

      )}


      {/* =============================================
          BORROWINGS TAB
      ============================================== */}

      {activeTab ===
        'borrowings' && (

        <div className='flex flex-col gap-5'>


          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>

            <StatCard
              title='Total Borrowings'
              value={
                formatNumber(
                  totalBorrowings
                )
              }
              icon={BookOpen}
            />


            <StatCard
              title='Overdue Borrowings'
              value={
                formatNumber(
                  borrowings
                    .overdue_count
                )
              }
              icon={Clock3}
              warning={
                borrowings
                  .overdue_count > 0
              }
            />

          </div>


          <SectionCard
            title='Borrowings by Status'
          >

            {borrowingsLoading ? (

              <LoadingBlock
                text='Loading borrowings...'
              />

            ) : borrowings
                .by_status
                .length === 0 ? (

              <EmptyBlock
                text='There are no borrowing statistics.'
              />

            ) : (

              <div className='overflow-x-auto h-full'>

                <table className='w-full min-w-[500px] text-[#122F21]'>


                  <thead className='bg-[#A6B37D]'>

                    <tr>

                      <th className='p-4 text-center'>
                        Status
                      </th>

                      <th className='p-4 text-center'>
                        Count
                      </th>

                      <th className='p-4 text-center'>
                        Percentage
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {
                      borrowings
                        .by_status
                        .map(
                          (
                            item,
                            index
                          ) => {

                            const count =
                              Number(
                                item.count ??
                                0
                              )


                            const percentage =
                              totalBorrowings >
                              0

                                ? (
                                    count /
                                    totalBorrowings
                                  ) * 100

                                : 0


                            return (

                              <tr
                                key={
                                  `${item.status}-${index}`
                                }
                                className='border-b border-[#122F21]/10 hover:bg-[#6cb474]/30'
                              >

                                <td className='p-4 text-center'>

                                  <span
                                    className={`
                                      px-3
                                      py-1
                                      rounded-full
                                      text-xs
                                      font-bold
                                      capitalize

                                      ${
                                        getStatusClass(
                                          item.status
                                        )
                                      }
                                    `}
                                  >

                                    {
                                      item.status ||
                                      'unknown'
                                    }

                                  </span>

                                </td>


                                <td className='p-4 text-center font-bold'>

                                  {
                                    formatNumber(
                                      count
                                    )
                                  }

                                </td>


                                <td className='p-4 text-center'>

                                  {
                                    percentage
                                      .toFixed(1)
                                  }%

                                </td>

                              </tr>

                            )

                          }
                        )
                    }

                  </tbody>

                </table>

              </div>

            )}

          </SectionCard>


          {
            borrowings
              .overdue_count > 0 &&
            (

              <div className='bg-red-100 text-red-800 p-4 rounded-xl flex gap-3 items-center'>

                <AlertTriangle
                  size={21}
                />


                <div>

                  <p className='font-bold'>

                    Overdue borrowings detected

                  </p>


                  <p className='text-sm mt-1'>

                    {
                      borrowings
                        .overdue_count
                    }
                    {' '}
                    active borrowing(s) are currently overdue.

                  </p>

                </div>

              </div>

            )
          }

        </div>

      )}


      {/* =============================================
          RESERVATIONS TAB
      ============================================== */}

      {activeTab ===
        'reservations' && (

        <div className='flex flex-col gap-5'>


          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>

            <StatCard
              title='Reservations'
              value={
                formatNumber(
                  reservationsSummary
                    .reservations
                )
              }
              icon={CalendarDays}
            />


            <StatCard
              title='Reserved Seats'
              value={
                formatNumber(
                  reservationsSummary
                    .seats
                )
              }
              icon={Users}
            />

          </div>


          <SectionCard
            title='Reservation Statistics'
          >

            {reservationsLoading ? (

              <LoadingBlock
                text='Loading reservations...'
              />

            ) : reservations.length ===
              0 ? (

              <EmptyBlock
                text='There are no reservation statistics.'
              />

            ) : (

              <div className='overflow-x-auto h-full'>

                <table className='w-full min-w-[650px] text-[#122F21]'>


                  <thead className='bg-[#A6B37D]'>

                    <tr>

                      <th className='p-4 text-center'>
                        Status
                      </th>

                      <th className='p-4 text-center'>
                        Period
                      </th>

                      <th className='p-4 text-center'>
                        Reservations
                      </th>

                      <th className='p-4 text-center'>
                        Seats
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {
                      reservations.map(
                        (
                          item,
                          index
                        ) => (

                          <tr
                            key={
                              `${item.status}-${item.period}-${index}`
                            }
                            className='border-b border-[#122F21]/10 hover:bg-[#6cb474]/30'
                          >

                            <td className='p-4 text-center'>

                              <span
                                className={`
                                  px-3
                                  py-1
                                  rounded-full
                                  text-xs
                                  font-bold
                                  capitalize

                                  ${
                                    getStatusClass(
                                      item.status
                                    )
                                  }
                                `}
                              >

                                {
                                  item.status ||
                                  'unknown'
                                }

                              </span>

                            </td>


                            <td className='p-4 text-center'>

                              {
                                getPeriodLabel(
                                  item.period
                                )
                              }

                            </td>


                            <td className='p-4 text-center font-bold'>

                              {
                                formatNumber(
                                  item.count
                                )
                              }

                            </td>


                            <td className='p-4 text-center font-bold'>

                              {
                                formatNumber(
                                  item.seats
                                )
                              }

                            </td>

                          </tr>

                        )
                      )
                    }

                  </tbody>

                </table>

              </div>

            )}

          </SectionCard>

        </div>

      )}


      {/* =============================================
          WALK-IN TAB
      ============================================== */}

      {activeTab === 'walkin' && (

        <div className='flex flex-col gap-5'>


          <SectionCard
            title='Walk-in vs Registered Users'
          >

            {walkInLoading ? (

              <LoadingBlock
                text='Loading comparison...'
              />

            ) : (

              <div className='overflow-x-auto h-full'>

                <table className='w-full min-w-[750px] text-[#122F21]'>


                  <thead className='bg-[#A6B37D]'>

                    <tr>

                      <th className='p-4 text-left'>
                        Operation
                      </th>

                      <th className='p-4 text-center'>
                        Walk-in
                      </th>

                      <th className='p-4 text-center'>
                        Registered
                      </th>

                      <th className='p-4 text-center'>
                        Total
                      </th>

                      <th className='p-4 text-center'>
                        Walk-in %
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {
                      walkInRows.map(
                        item => (

                          <tr
                            key={
                              item.operation
                            }
                            className='border-b border-[#122F21]/10 hover:bg-[#6cb474]/30'
                          >

                            <td className='p-4 font-bold'>

                              {
                                item.operation
                              }

                            </td>


                            <td className='p-4 text-center'>

                              {
                                formatNumber(
                                  item.walk_in
                                )
                              }

                            </td>


                            <td className='p-4 text-center'>

                              {
                                formatNumber(
                                  item.registered
                                )
                              }

                            </td>


                            <td className='p-4 text-center font-bold'>

                              {
                                formatNumber(
                                  item.total
                                )
                              }

                            </td>


                            <td className='p-4 text-center'>

                              {
                                item
                                  .walkInPercent
                                  .toFixed(1)
                              }%

                            </td>

                          </tr>

                        )
                      )
                    }

                  </tbody>

                </table>

              </div>

            )}

          </SectionCard>


          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>

            {
              walkInRows.map(
                item => (

                  <div
                    key={
                      item.operation
                    }
                    className='bg-[#AAC3AD] rounded-2xl shadow-md p-5 text-[#122F21]'
                  >

                    <p className='font-bold text-lg'>

                      {
                        item.operation
                      }

                    </p>


                    <div className='mt-4 flex justify-between text-sm'>

                      <span>
                        Walk-in
                      </span>

                      <strong>
                        {
                          formatNumber(
                            item.walk_in
                          )
                        }
                      </strong>

                    </div>


                    <div className='mt-2 flex justify-between text-sm'>

                      <span>
                        Registered
                      </span>

                      <strong>
                        {
                          formatNumber(
                            item.registered
                          )
                        }
                      </strong>

                    </div>


                    <div className='mt-4 pt-3 border-t border-[#122F21]/20 flex justify-between'>

                      <span>
                        Total
                      </span>

                      <strong>
                        {
                          formatNumber(
                            item.total
                          )
                        }
                      </strong>

                    </div>

                  </div>

                )
              )
            }

          </div>

        </div>

      )}

    </div>

  )

}


// =====================================================
// STAT CARD
// =====================================================

const StatCard = ({
  title,
  value,
  icon: Icon,
  warning = false
}) => {

  return (

    <div
      className={`
        rounded-2xl
        shadow-md
        p-5
        flex
        justify-between
        items-center
        text-[#122F21]

        ${
          warning
            ? 'bg-red-100'
            : 'bg-[#AAC3AD]'
        }
      `}
    >

      <div>

        <p className='text-sm opacity-70'>

          {title}

        </p>


        <p className='text-2xl font-bold mt-2'>

          {value}

        </p>

      </div>


      <div
        className={`
          rounded-xl
          p-3

          ${
            warning
              ? 'bg-red-200'
              : 'bg-[#F09A79]'
          }
        `}
      >

        <Icon size={24} />

      </div>

    </div>

  )

}


// =====================================================
// SECTION CARD
// =====================================================

const SectionCard = ({
  title,
  children
}) => {

  return (

    <div className='bg-[#AAC3AD] rounded-2xl shadow-lg overflow-hidden'>

      <div className='p-5 border-b border-[#122F21]/10'>

        <h2 className='text-xl font-bold text-[#122F21]'>

          {title}

        </h2>

      </div>


      {children}

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

    <div className='min-h-[280px] flex flex-col gap-3 justify-center items-center text-[#122F21]'>

      <RefreshCw
        size={31}
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
  text
}) => {

  return (

    <div className='min-h-[250px] flex justify-center items-center text-[#122F21]/60 text-center p-5'>

      {text}

    </div>

  )

}


export default Operations