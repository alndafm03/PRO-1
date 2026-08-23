import React, { useEffect, useMemo, useState } from 'react'

import {
  Users,
  PenLine,
  BookOpen,
  TrendingUp,
  Tag,
  DollarSign,
  Library,
  AlertTriangle,
  Layers3,
  RefreshCw
} from 'lucide-react'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'

import api from '../../api/axios'


const Dashboard = () => {

  // =====================================================
  // STATES
  // =====================================================

  const [dashboard, setDashboard] = useState({
    users_count: 0,
    authors_count: 0,
    books_count: 0,
    published_books_count: 0,
    sales_count: 0,
    borrowings_count: 0,
    reservations_count: 0,
    categories_count: 0,

    revenue: {
      sales: 0,
      borrowings: 0,
      reservations: 0,
      total: 0
    },

    fines: {
      collected: 0,
      outstanding: 0
    }
  })


  const [sales, setSales] = useState([])


  const [borrowings, setBorrowings] = useState({
    by_status: [],
    overdue_count: 0
  })


  const [reservations, setReservations] = useState([])


  const [walkInStats, setWalkInStats] = useState({
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


  const [lowActivityBooks, setLowActivityBooks] = useState([])


  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')


  // =====================================================
  // HELPERS
  // =====================================================

  const formatNumber = (value) => {

    const number = Number(value ?? 0)

    if (Number.isNaN(number)) {
      return '0'
    }

    return number.toLocaleString()
  }


  const formatMoney = (value) => {

    const number = parseFloat(value ?? 0)

    if (Number.isNaN(number)) {
      return '0'
    }

    return number.toLocaleString(undefined, {
      maximumFractionDigits: 2
    })
  }


  const extractApiError = (reason) => {

    return (
      reason?.response?.data?.message ||
      reason?.message ||
      'An error occurred while loading dashboard data.'
    )
  }


  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  const loadDashboard = async () => {

    setLoading(true)
    setError('')

    try {

      /*
        نستخدم allSettled بدل Promise.all

        السبب:
        إذا فشل تقرير واحد مثل low activity
        لا نريد أن تختفي كل لوحة التحكم.
      */

      const results = await Promise.allSettled([

        // 0
        api.get('/admin/dashboard'),

        // 1
        api.get('/admin/stats/sales'),

        // 2
        api.get('/admin/stats/borrowings'),

        // 3
        api.get('/admin/stats/reservations'),

        // 4
        api.get('/admin/stats/walk-in-vs-registered'),

        // 5
        api.get('/admin/books/low-activity', {
          params: {
            per_page: 5
          }
        })

      ])


      // =================================================
      // DASHBOARD SUMMARY
      // GET /admin/dashboard
      // =================================================

      if (results[0].status === 'fulfilled') {

        const data =
          results[0].value?.data?.data || {}

        setDashboard({
          users_count: data.users_count ?? 0,

          authors_count:
            data.authors_count ?? 0,

          books_count:
            data.books_count ?? 0,

          published_books_count:
            data.published_books_count ?? 0,

          sales_count:
            data.sales_count ?? 0,

          borrowings_count:
            data.borrowings_count ?? 0,

          reservations_count:
            data.reservations_count ?? 0,

          categories_count:
            data.categories_count ?? 0,

          revenue: {
            sales:
              data.revenue?.sales ?? 0,

            borrowings:
              data.revenue?.borrowings ?? 0,

            reservations:
              data.revenue?.reservations ?? 0,

            total:
              data.revenue?.total ?? 0
          },

          fines: {
            collected:
              data.fines?.collected ?? 0,

            outstanding:
              data.fines?.outstanding ?? 0
          }
        })

      }


      // =================================================
      // SALES
      // GET /admin/stats/sales
      // =================================================

      if (results[1].status === 'fulfilled') {

        const data =
          results[1].value?.data?.data

        setSales(
          Array.isArray(data)
            ? data
            : []
        )

      }


      // =================================================
      // BORROWINGS
      // GET /admin/stats/borrowings
      // =================================================

      if (results[2].status === 'fulfilled') {

        const data =
          results[2].value?.data?.data || {}

        setBorrowings({
          by_status:
            Array.isArray(data.by_status)
              ? data.by_status
              : [],

          overdue_count:
            data.overdue_count ?? 0
        })

      }


      // =================================================
      // RESERVATIONS
      // GET /admin/stats/reservations
      // =================================================

      if (results[3].status === 'fulfilled') {

        const data =
          results[3].value?.data?.data

        setReservations(
          Array.isArray(data)
            ? data
            : []
        )

      }


      // =================================================
      // WALK-IN VS REGISTERED
      // GET /admin/stats/walk-in-vs-registered
      // =================================================

      if (results[4].status === 'fulfilled') {

        const data =
          results[4].value?.data?.data || {}

        setWalkInStats({
          sales: {
            walk_in:
              data.sales?.walk_in ?? 0,

            registered:
              data.sales?.registered ?? 0
          },

          borrowings: {
            walk_in:
              data.borrowings?.walk_in ?? 0,

            registered:
              data.borrowings?.registered ?? 0
          },

          reservations: {
            walk_in:
              data.reservations?.walk_in ?? 0,

            registered:
              data.reservations?.registered ?? 0
          }
        })

      }


      // =================================================
      // LOW ACTIVITY BOOKS
      // GET /admin/books/low-activity
      // Pagination response
      // =================================================

      if (results[5].status === 'fulfilled') {

        const data =
          results[5].value?.data?.data

        /*
          إذا كان endpoint مرقّمًا:
          response.data.data.data

          Axios:
          results[5].value.data.data.data
        */

        if (Array.isArray(data?.data)) {

          setLowActivityBooks(data.data)

        }

        else if (Array.isArray(data)) {

          setLowActivityBooks(data)

        }

        else {

          setLowActivityBooks([])

        }

      }


      // =================================================
      // PARTIAL ERRORS
      // =================================================

      const failedRequests =
        results.filter(
          result => result.status === 'rejected'
        )


      if (failedRequests.length > 0) {

        const firstError =
          extractApiError(
            failedRequests[0].reason
          )

        setError(
          `Some dashboard sections could not be loaded. ${firstError}`
        )

      }

    }

    catch (err) {

      console.error(
        'Dashboard loading error:',
        err
      )

      setError(
        err.response?.data?.message ||
        'Dashboard data could not be loaded.'
      )

    }

    finally {

      setLoading(false)

    }

  }


  useEffect(() => {

    loadDashboard()

  }, [])


  // =====================================================
  // SALES CHART
  //
  // Backend returns:
  //
  // [
  //   {
  //     date,
  //     type,
  //     items_count,
  //     revenue
  //   }
  // ]
  //
  // قد يوجد physical + digital في نفس التاريخ
  // لذلك نجمعهما حسب التاريخ.
  // =====================================================

  const salesChartData = useMemo(() => {

    const grouped = {}


    sales.forEach(item => {

      const date = item.date || 'Unknown'

      if (!grouped[date]) {

        grouped[date] = {
          date,
          physical: 0,
          digital: 0,
          total: 0,
          revenue: 0
        }

      }


      const count =
        Number(item.items_count ?? 0)


      const revenue =
        parseFloat(item.revenue ?? 0)


      grouped[date].total +=
        Number.isNaN(count)
          ? 0
          : count


      grouped[date].revenue +=
        Number.isNaN(revenue)
          ? 0
          : revenue


      if (item.type === 'physical') {

        grouped[date].physical +=
          Number.isNaN(count)
            ? 0
            : count

      }


      if (item.type === 'digital') {

        grouped[date].digital +=
          Number.isNaN(count)
            ? 0
            : count

      }

    })


    return Object.values(grouped)
      .sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      )
      .slice(-14)

  }, [sales])


  // =====================================================
  // RESERVATION CHART
  //
  // Backend groups by:
  // status + period
  //
  // For dashboard we aggregate by status.
  // =====================================================

  const reservationChartData =
    useMemo(() => {

      const grouped = {}


      reservations.forEach(item => {

        const status =
          item.status || 'unknown'


        if (!grouped[status]) {

          grouped[status] = {
            status,
            count: 0,
            seats: 0
          }

        }


        grouped[status].count +=
          Number(item.count ?? 0)


        grouped[status].seats +=
          Number(item.seats ?? 0)

      })


      return Object.values(grouped)

    }, [reservations])


  // =====================================================
  // WALK-IN CHART
  // =====================================================

  const walkInChartData = useMemo(() => {

    return [

      {
        operation: 'Sales',

        walkIn:
          Number(
            walkInStats.sales?.walk_in ?? 0
          ),

        registered:
          Number(
            walkInStats.sales?.registered ?? 0
          )
      },

      {
        operation: 'Borrowings',

        walkIn:
          Number(
            walkInStats.borrowings?.walk_in ?? 0
          ),

        registered:
          Number(
            walkInStats.borrowings?.registered ?? 0
          )
      },

      {
        operation: 'Reservations',

        walkIn:
          Number(
            walkInStats.reservations?.walk_in ?? 0
          ),

        registered:
          Number(
            walkInStats.reservations?.registered ?? 0
          )
      }

    ]

  }, [walkInStats])


  // =====================================================
  // STAT CARDS
  // =====================================================

  const stats = [

    {
      id: 1,
      title: 'Users',
      value: formatNumber(
        dashboard.users_count
      ),
      icon: Users
    },

    {
      id: 2,
      title: 'Authors',
      value: formatNumber(
        dashboard.authors_count
      ),
      icon: PenLine
    },

    {
      id: 3,
      title: 'Books',
      value: formatNumber(
        dashboard.books_count
      ),
      icon: BookOpen
    },

    {
      id: 4,
      title: 'Published Books',
      value: formatNumber(
        dashboard.published_books_count
      ),
      icon: Library
    },

    {
      id: 5,
      title: 'Sales',
      value: formatNumber(
        dashboard.sales_count
      ),
      icon: TrendingUp
    },

    {
      id: 6,
      title: 'Borrowings',
      value: formatNumber(
        dashboard.borrowings_count
      ),
      icon: BookOpen
    },

    {
      id: 7,
      title: 'Reservations',
      value: formatNumber(
        dashboard.reservations_count
      ),
      icon: Tag
    },

    {
      id: 8,
      title: 'Categories',
      value: formatNumber(
        dashboard.categories_count
      ),
      icon: Layers3
    },

    {
      id: 9,
      title: 'Total Revenue',
      value: formatMoney(
        dashboard.revenue.total
      ),
      icon: DollarSign
    },

    {
      id: 10,
      title: 'Collected Fines',
      value: formatMoney(
        dashboard.fines.collected
      ),
      icon: DollarSign
    },

    {
      id: 11,
      title: 'Outstanding Fines',
      value: formatMoney(
        dashboard.fines.outstanding
      ),
      icon: AlertTriangle
    },

    {
      id: 12,
      title: 'Overdue Borrowings',
      value: formatNumber(
        borrowings.overdue_count
      ),
      icon: AlertTriangle
    }

  ]


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <div className='min-h-[70vh] flex flex-col gap-3 justify-center items-center text-[#122F21]'>

        <RefreshCw
          size={36}
          className='animate-spin'
        />

        <p className='font-bold'>
          Loading dashboard...
        </p>

      </div>

    )

  }


  // =====================================================
  // JSX
  // =====================================================

  return (

    <div className='w-full flex flex-col  gap-6 pb-10'>


      {/* ================================================
          HEADER
      ================================================= */}

      <div className='flex justify-between items-center'>

        <div>
{/* 
          <h1 className='text-2xl font-bold text-[#122F21]'>
            Admin Dashboard
          </h1> */}

          <p className='text-sm text-[#122F21]/60 mt-1'>
            Library system overview and statistics
          </p>

        </div>


        <button
          onClick={loadDashboard}
          className='flex items-center gap-2 bg-[#122F21] text-white px-4 py-2 rounded-xl cursor-pointer active:scale-95'
        >

          <RefreshCw size={17} />

          Refresh

        </button>

      </div>


      {/* ================================================
          ERROR
      ================================================= */}

      {error && (

        <div className='bg-red-100 text-red-800 rounded-xl p-4 flex gap-3 items-center'>

          <AlertTriangle size={20} />

          <span>
            {error}
          </span>

        </div>

      )}


      {/* ================================================
          STAT CARDS
      ================================================= */}

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>

        {stats.map(item => {

          const Icon = item.icon

          return (

            <div
              key={item.id}
              className='bg-[#AAC3AD] text-[#122F21] rounded-2xl p-5 shadow-md flex justify-between items-center'
            >

              <div>

                <p className='text-sm opacity-70'>
                  {item.title}
                </p>

                <p className='text-2xl font-bold mt-2'>
                  {item.value}
                </p>

              </div>


              <div className='bg-[#F09A79] rounded-xl p-3'>

                <Icon size={24} />

              </div>

            </div>

          )

        })}

      </div>


      {/* ================================================
          REVENUE DETAILS
      ================================================= */}

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>

        <RevenueCard
          title='Sales Revenue'
          value={formatMoney(
            dashboard.revenue.sales
          )}
        />

        <RevenueCard
          title='Borrowing Revenue'
          value={formatMoney(
            dashboard.revenue.borrowings
          )}
        />

        <RevenueCard
          title='Reservation Revenue'
          value={formatMoney(
            dashboard.revenue.reservations
          )}
        />

        <RevenueCard
          title='Total Revenue'
          value={formatMoney(
            dashboard.revenue.total
          )}
        />

      </div>


      {/* ================================================
          SALES CHART
      ================================================= */}

      <ChartContainer title='Sales Activity'>

        {salesChartData.length === 0 ? (

          <EmptyChart />

        ) : (

          <ResponsiveContainer
            width='100%'
            height={300}
          >

            <BarChart
              data={salesChartData}
            >

              <CartesianGrid
                strokeDasharray='3 3'
              />

              <XAxis
                dataKey='date'
              />

              <YAxis />

              <Tooltip />

              <Legend />

              <Bar
                dataKey='physical'
                name='Physical'
                fill='#122F21'
              />

              <Bar
                dataKey='digital'
                name='Digital'
                fill='#F09A79'
              />

            </BarChart>

          </ResponsiveContainer>

        )}

      </ChartContainer>


      {/* ================================================
          BORROWINGS + RESERVATIONS
      ================================================= */}

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>


        {/* BORROWINGS */}

        <ChartContainer title='Borrowings by Status'>

          {borrowings.by_status.length === 0 ? (

            <EmptyChart />

          ) : (

            <ResponsiveContainer
              width='100%'
              height={270}
            >

              <BarChart
                data={borrowings.by_status}
              >

                <CartesianGrid
                  strokeDasharray='3 3'
                />

                <XAxis
                  dataKey='status'
                />

                <YAxis />

                <Tooltip />

                <Bar
                  dataKey='count'
                  name='Borrowings'
                  fill='#122F21'
                />

              </BarChart>

            </ResponsiveContainer>

          )}

        </ChartContainer>


        {/* RESERVATIONS */}

        <ChartContainer title='Reservations by Status'>

          {reservationChartData.length === 0 ? (

            <EmptyChart />

          ) : (

            <ResponsiveContainer
              width='100%'
              height={270}
            >

              <BarChart
                data={reservationChartData}
              >

                <CartesianGrid
                  strokeDasharray='3 3'
                />

                <XAxis
                  dataKey='status'
                />

                <YAxis />

                <Tooltip />

                <Legend />

                <Bar
                  dataKey='count'
                  name='Reservations'
                  fill='#122F21'
                />

                <Bar
                  dataKey='seats'
                  name='Seats'
                  fill='#F09A79'
                />

              </BarChart>

            </ResponsiveContainer>

          )}

        </ChartContainer>

      </div>


      {/* ================================================
          WALK-IN VS REGISTERED
      ================================================= */}

      <ChartContainer title='Walk-in vs Registered Users'>

        <ResponsiveContainer
          width='100%'
          height={300}
        >

          <BarChart
            data={walkInChartData}
          >

            <CartesianGrid
              strokeDasharray='3 3'
            />

            <XAxis
              dataKey='operation'
            />

            <YAxis />

            <Tooltip />

            <Legend />

            <Bar
              dataKey='walkIn'
              name='Walk-in'
              fill='#F09A79'
            />

            <Bar
              dataKey='registered'
              name='Registered'
              fill='#122F21'
            />

          </BarChart>

        </ResponsiveContainer>

      </ChartContainer>


      {/* ================================================
          LOW ACTIVITY BOOKS
      ================================================= */}

      <div className='bg-[#AAC3AD] rounded-2xl shadow-md overflow-hidden'>

        <div className='p-5 border-b border-[#122F21]/10'>

          <h2 className='font-bold text-xl text-[#122F21]'>
            Low Activity Books
          </h2>

          <p className='text-sm text-[#122F21]/60 mt-1'>
            Books without activity during the last 30 days
          </p>

        </div>


        {lowActivityBooks.length === 0 ? (

          <div className='text-center py-10 text-[#122F21]/70'>

            There are no low activity books.

          </div>

        ) : (

          <div className='overflow-x-auto h-full'>

            <table className='w-full text-[#122F21]'>

              <thead>

                <tr className='bg-[#A6B37D]'>

                  <th className='p-4 text-center'>
                    ID
                  </th>

                  <th className='p-4 text-center'>
                    Title
                  </th>

                  <th className='p-4 text-center'>
                    Author
                  </th>

                  <th className='p-4 text-center'>
                    Type
                  </th>

                  <th className='p-4 text-center'>
                    Published At
                  </th>

                </tr>

              </thead>


              <tbody>

                {lowActivityBooks.map(book => (

                  <tr
                    key={book.id}
                    className='border-b border-[#122F21]/10 hover:bg-[#6cb474] transition'
                  >

                    <td className='p-4 text-center'>
                      {book.id}
                    </td>


                    <td className='p-4 text-center font-medium'>
                      {book.title || '—'}
                    </td>


                    <td className='p-4 text-center'>

                      {
                        book.author?.full_name ||
                        book.author_name ||
                        '—'
                      }

                    </td>


                    <td className='p-4 text-center'>
                      {book.book_type || '—'}
                    </td>


                    <td className='p-4 text-center'>

                      {
                        book.published_at
                          ? new Date(
                              book.published_at
                            ).toLocaleDateString()
                          : '—'
                      }

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>

  )

}


// =====================================================
// REVENUE CARD
// =====================================================

const RevenueCard = ({
  title,
  value
}) => {

  return (

    <div className='bg-[#A6B37D] rounded-2xl p-5 shadow-md text-[#122F21]'>

      <div className='flex justify-between items-center'>

        <div>

          <p className='text-sm opacity-70'>
            {title}
          </p>

          <p className='text-xl font-bold mt-2'>
            {value}
          </p>

        </div>


        <div className='bg-[#F09A79] p-3 rounded-xl'>

          <DollarSign size={21} />

        </div>

      </div>

    </div>

  )

}


// =====================================================
// CHART WRAPPER
// =====================================================

const ChartContainer = ({
  title,
  children
}) => {

  return (

    <div className='bg-[#AAC3AD] rounded-2xl shadow-md p-5'>

      <h2 className='font-bold text-xl mb-5 text-[#122F21]'>
        {title}
      </h2>

      {children}

    </div>

  )

}


// =====================================================
// EMPTY CHART
// =====================================================

const EmptyChart = () => {

  return (

    <div className='h-[270px] flex items-center justify-center text-[#122F21]/60'>

      There is no data available.

    </div>

  )

}


export default Dashboard