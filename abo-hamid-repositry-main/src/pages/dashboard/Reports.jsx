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
  CircleDollarSign,
  Coins,
  RefreshCw,
  TrendingUp,
  UserPen,
  Wallet
} from 'lucide-react'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from 'recharts'

import api from '../../api/axios'


// =====================================================
// DEFAULT STATES
// =====================================================

const DEFAULT_DASHBOARD = {

  revenue: {
    sales: 0,
    borrowings: 0,
    reservations: 0,
    total: 0
  }

}


const DEFAULT_FINES = {

  total_fines: 0,
  paid_fines: 0,
  unpaid_fines: 0,
  unpaid_fines_count: 0

}


// =====================================================
// COMPONENT
// =====================================================

const Reports = () => {

  // ===================================================
  // DASHBOARD / REVENUE
  // ===================================================

  const [dashboard, setDashboard] =
    useState(DEFAULT_DASHBOARD)


  // ===================================================
  // FINES
  // ===================================================

  const [fines, setFines] =
    useState(DEFAULT_FINES)


  // ===================================================
  // AUTHORS EARNINGS
  // ===================================================

  const [
    authorEarningsRaw,
    setAuthorEarningsRaw
  ] = useState({
    from_sales: [],
    from_borrowings: []
  })


  // جميع المؤلفين فقط لربط ID بالاسم
  const [authors, setAuthors] =
    useState([])


  // ===================================================
  // LOW ACTIVITY BOOKS
  // ===================================================

  const [
    lowActivityBooks,
    setLowActivityBooks
  ] = useState([])


  const [
    lowActivityPagination,
    setLowActivityPagination
  ] = useState({

    currentPage: 1,
    lastPage: 1,
    total: 0,
    from: 0,
    to: 0

  })


  // ===================================================
  // PAGE STATE
  // ===================================================

  const [loading, setLoading] =
    useState(true)


  const [
    lowActivityLoading,
    setLowActivityLoading
  ] = useState(false)


  const [error, setError] =
    useState('')


  // ===================================================
  // HELPERS
  // ===================================================

  const toNumber = value => {

    const number =
      parseFloat(value ?? 0)


    return Number.isNaN(number)
      ? 0
      : number

  }


  const formatMoney = value => {

    return toNumber(value)
      .toLocaleString(
        undefined,
        {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }
      )

  }


  const formatNumber = value => {

    const number =
      Number(value ?? 0)


    if (Number.isNaN(number)) {
      return '0'
    }


    return number.toLocaleString()

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


  const getAuthorId = author => {

    return (
      author?.user_id ??
      author?.user?.id ??
      author?.id
    )

  }


  const getAuthorName = author => {

    return (
      author?.full_name ??
      author?.user?.full_name ??
      null
    )

  }


  const getBookAuthorName = book => {

    return (
      book?.author?.full_name ??
      book?.author_name ??
      '—'
    )

  }


  // ===================================================
  // LOAD ALL AUTHORS
  //
  // GET /admin/authors
  //
  // Important:
  // NO search param.
  //
  // نستعمل هذه البيانات فقط حتى نربط
  // author_id مع اسم المؤلف.
  // ===================================================

  const loadAllAuthors =
    useCallback(async () => {

      try {

        const collected = []

        let page = 1
        let lastPage = 1


        do {

          const res = await api.get(
            '/admin/authors',
            {
              params: {
                page,
                per_page: 100
              }
            }
          )


          const data =
            res.data?.data


          if (Array.isArray(data)) {

            collected.push(...data)

            lastPage = 1

          }

          else {

            const rows =
              Array.isArray(
                data?.data
              )
                ? data.data
                : []


            collected.push(...rows)


            lastPage =
              Number(
                data?.last_page ?? 1
              )

          }


          page += 1

        }
        while (
          page <= lastPage
        )


        const uniqueAuthors =
          Array.from(
            new Map(
              collected.map(
                author => [
                  getAuthorId(author),
                  author
                ]
              )
            ).values()
          )


        setAuthors(
          uniqueAuthors
        )

      }

      catch (err) {

        console.error(
          'Authors loading error:',
          err
        )


        /*
          فشل أسماء المؤلفين لا يجب أن
          يفشل كامل صفحة التقارير.

          سنعرض Author #ID بدل الاسم.
        */

        setAuthors([])

      }

    }, [])


  // ===================================================
  // LOAD LOW ACTIVITY BOOKS
  //
  // GET /admin/books/low-activity
  // ===================================================

  const loadLowActivityBooks =
    useCallback(
      async (page = 1) => {

        setLowActivityLoading(true)


        try {

          const res = await api.get(
            '/admin/books/low-activity',
            {
              params: {
                page,
                per_page: 10
              }
            }
          )


          const data =
            res.data?.data


          if (Array.isArray(data)) {

            setLowActivityBooks(data)


            setLowActivityPagination({

              currentPage: 1,
              lastPage: 1,
              total: data.length,

              from:
                data.length > 0
                  ? 1
                  : 0,

              to:
                data.length

            })


            return

          }


          const rows =
            Array.isArray(
              data?.data
            )
              ? data.data
              : []


          setLowActivityBooks(
            rows
          )


          setLowActivityPagination({

            currentPage:
              data?.current_page ?? 1,

            lastPage:
              data?.last_page ?? 1,

            total:
              data?.total ??
              rows.length,

            from:
              data?.from ??
              (
                rows.length > 0
                  ? 1
                  : 0
              ),

            to:
              data?.to ??
              rows.length

          })

        }

        catch (err) {

          console.error(
            'Low activity books error:',
            err
          )


          setLowActivityBooks([])

        }

        finally {

          setLowActivityLoading(false)

        }

      },
      []
    )


  // ===================================================
  // LOAD MAIN REPORT DATA
  // ===================================================

  const loadReports =
    useCallback(async () => {

      setLoading(true)
      setError('')


      /*
        نستخدم allSettled لأن فشل تقرير
        واحد لا يجب أن يمنع التقارير الأخرى.
      */

      const results =
        await Promise.allSettled([

          // 0
          api.get(
            '/admin/dashboard'
          ),

          // 1
          api.get(
            '/admin/stats/fines'
          ),

          // 2
          api.get(
            '/admin/stats/authors-earnings'
          ),

          // 3
          loadAllAuthors(),

          // 4
          loadLowActivityBooks(1)

        ])


      // ===============================================
      // DASHBOARD
      // ===============================================

      if (
        results[0].status ===
        'fulfilled'
      ) {

        const data =
          results[0]
            .value
            ?.data
            ?.data || {}


        setDashboard({

          revenue: {

            sales:
              toNumber(
                data.revenue
                  ?.sales
              ),

            borrowings:
              toNumber(
                data.revenue
                  ?.borrowings
              ),

            reservations:
              toNumber(
                data.revenue
                  ?.reservations
              ),

            total:
              toNumber(
                data.revenue
                  ?.total
              )

          }

        })

      }


      // ===============================================
      // FINES
      // ===============================================

      if (
        results[1].status ===
        'fulfilled'
      ) {

        const data =
          results[1]
            .value
            ?.data
            ?.data || {}


        setFines({

          total_fines:
            toNumber(
              data.total_fines
            ),

          paid_fines:
            toNumber(
              data.paid_fines
            ),

          unpaid_fines:
            toNumber(
              data.unpaid_fines
            ),

          unpaid_fines_count:
            Number(
              data.unpaid_fines_count ??
              0
            )

        })

      }


      // ===============================================
      // AUTHOR EARNINGS
      // ===============================================

      if (
        results[2].status ===
        'fulfilled'
      ) {

        const data =
          results[2]
            .value
            ?.data
            ?.data || {}


        setAuthorEarningsRaw({

          from_sales:
            Array.isArray(
              data.from_sales
            )
              ? data.from_sales
              : [],

          from_borrowings:
            Array.isArray(
              data.from_borrowings
            )
              ? data.from_borrowings
              : []

        })

      }


      // ===============================================
      // PARTIAL ERROR
      // ===============================================

      const directRequests =
        results.slice(0, 3)


      const failed =
        directRequests.filter(
          result =>
            result.status ===
            'rejected'
        )


      if (
        failed.length > 0
      ) {

        const reason =
          failed[0]?.reason


        setError(
          reason
            ?.response
            ?.data
            ?.message ||
          'Some report sections could not be loaded.'
        )

      }


      setLoading(false)

    }, [
      loadAllAuthors,
      loadLowActivityBooks
    ])


  // ===================================================
  // FIRST LOAD
  // ===================================================

  useEffect(() => {

    loadReports()

  }, [loadReports])


  // ===================================================
  // AUTHOR MAP
  // ===================================================

  const authorsMap =
    useMemo(() => {

      const map = new Map()


      authors.forEach(
        author => {

          const id =
            getAuthorId(author)


          if (id !== undefined) {

            map.set(
              Number(id),
              getAuthorName(author)
            )

          }

        }
      )


      return map

    }, [authors])


  // ===================================================
  // MERGE AUTHOR EARNINGS
  //
  // Backend:
  //
  // from_sales:
  // {
  //   author_id,
  //   sales_earnings
  // }
  //
  // from_borrowings:
  // {
  //   author_id,
  //   borrowing_earnings
  // }
  // ===================================================

  const authorEarnings =
    useMemo(() => {

      const earningsMap =
        new Map()


      authorEarningsRaw
        .from_sales
        .forEach(item => {

          const id =
            Number(item.author_id)


          if (!earningsMap.has(id)) {

            earningsMap.set(
              id,
              {
                author_id: id,
                sales: 0,
                borrowings: 0,
                total: 0
              }
            )

          }


          const current =
            earningsMap.get(id)


          current.sales +=
            toNumber(
              item.sales_earnings
            )

        })


      authorEarningsRaw
        .from_borrowings
        .forEach(item => {

          const id =
            Number(item.author_id)


          if (!earningsMap.has(id)) {

            earningsMap.set(
              id,
              {
                author_id: id,
                sales: 0,
                borrowings: 0,
                total: 0
              }
            )

          }


          const current =
            earningsMap.get(id)


          current.borrowings +=
            toNumber(
              item.borrowing_earnings
            )

        })


      return Array.from(
        earningsMap.values()
      )
        .map(item => {

          const total =
            item.sales +
            item.borrowings


          return {

            ...item,

            total,

            author_name:
              authorsMap.get(
                item.author_id
              ) ||
              `Author #${item.author_id}`

          }

        })
        .sort(
          (a, b) =>
            b.total - a.total
        )

    }, [
      authorEarningsRaw,
      authorsMap
    ])


  // ===================================================
  // AUTHORS TOTALS
  // ===================================================

  const earningsSummary =
    useMemo(() => {

      return authorEarnings.reduce(
        (
          result,
          author
        ) => {

          result.sales +=
            author.sales


          result.borrowings +=
            author.borrowings


          result.total +=
            author.total


          return result

        },
        {
          sales: 0,
          borrowings: 0,
          total: 0
        }
      )

    }, [authorEarnings])


  // ===================================================
  // REVENUE CHART
  // ===================================================

  const revenueChartData =
    useMemo(() => {

      return [

        {
          name: 'Sales',
          amount:
            dashboard.revenue.sales
        },

        {
          name: 'Borrowings',
          amount:
            dashboard.revenue.borrowings
        },

        {
          name: 'Reservations',
          amount:
            dashboard.revenue.reservations
        }

      ]

    }, [dashboard])


  // ===================================================
  // AUTHOR CHART
  // ===================================================

  const authorChartData =
    useMemo(() => {

      /*
        نعرض أعلى 10 فقط في الرسم
        حتى يبقى قابلًا للقراءة.

        الجدول أدناه يعرض جميع المؤلفين.
      */

      return authorEarnings
        .slice(0, 10)
        .map(author => ({

          name:
            author.author_name,

          sales:
            author.sales,

          borrowings:
            author.borrowings

        }))

    }, [authorEarnings])


  // ===================================================
  // LOW ACTIVITY PAGINATION
  // ===================================================

  const goToLowActivityPage =
    page => {

      if (
        page < 1 ||
        page >
          lowActivityPagination
            .lastPage ||
        page ===
          lowActivityPagination
            .currentPage
      ) {
        return
      }


      loadLowActivityBooks(
        page
      )

    }


  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {

    return (

      <div className='min-h-[65vh] flex flex-col justify-center items-center gap-3 text-[#122F21]'>

        <RefreshCw
          size={36}
          className='animate-spin'
        />

        <p className='font-medium'>

          Loading reports...

        </p>

      </div>

    )

  }


  // ===================================================
  // JSX
  // ===================================================

  return (

    <div className='w-full flex flex-col gap-6 pb-10'>


      {/* =============================================
          HEADER
      ============================================== */}

      <div className='flex flex-col md:flex-row md:justify-between md:items-center gap-4'>


        <div>
{/* 
          <h1 className='text-2xl font-bold text-[#122F21] flex items-center gap-2'>

            <TrendingUp
              size={27}
            />

            Reports

          </h1>

 */}
          <p className='text-sm text-[#122F21]/60 mt-1'>

            Financial reports, author earnings and low activity books.

          </p>

        </div>


        <button
          type='button'
          onClick={loadReports}
          className='flex items-center justify-center gap-2 bg-[#122F21] text-white px-4 py-2 rounded-xl cursor-pointer'
        >

          <RefreshCw size={17} />

          Refresh Reports

        </button>

      </div>


      {/* =============================================
          ERROR
      ============================================== */}

      {error && (

        <div className='bg-red-100 text-red-800 rounded-xl p-4 flex items-center gap-3'>

          <AlertTriangle
            size={20}
          />

          <span>
            {error}
          </span>

        </div>

      )}


      {/* =============================================
          FINANCIAL CARDS
      ============================================== */}

      <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>


        <StatCard
          title='Total Revenue'
          value={
            formatMoney(
              dashboard.revenue.total
            )
          }
          icon={CircleDollarSign}
        />


        <StatCard
          title='Sales Revenue'
          value={
            formatMoney(
              dashboard.revenue.sales
            )
          }
          icon={TrendingUp}
        />


        <StatCard
          title='Borrowing Revenue'
          value={
            formatMoney(
              dashboard.revenue
                .borrowings
            )
          }
          icon={BookOpen}
        />


        <StatCard
          title='Reservation Revenue'
          value={
            formatMoney(
              dashboard.revenue
                .reservations
            )
          }
          icon={Wallet}
        />

      </div>


      {/* =============================================
          FINES CARDS
      ============================================== */}

      <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>


        <StatCard
          title='Total Fines'
          value={
            formatMoney(
              fines.total_fines
            )
          }
          icon={Coins}
        />


        <StatCard
          title='Collected Fines'
          value={
            formatMoney(
              fines.paid_fines
            )
          }
          icon={CircleDollarSign}
        />


        <StatCard
          title='Outstanding Fines'
          value={
            formatMoney(
              fines.unpaid_fines
            )
          }
          icon={AlertTriangle}
          warning={
            fines.unpaid_fines > 0
          }
        />


        <StatCard
          title='Unpaid Fine Records'
          value={
            formatNumber(
              fines.unpaid_fines_count
            )
          }
          icon={AlertTriangle}
          warning={
            fines.unpaid_fines_count >
            0
          }
        />

      </div>


      {/* =============================================
          REVENUE CHART
      ============================================== */}

      <SectionCard
        title='Revenue Distribution'
      >

        <div className='p-4'>

          <ResponsiveContainer
            width='100%'
            height={300}
          >

            <BarChart
              data={
                revenueChartData
              }
            >

              <CartesianGrid
                strokeDasharray='3 3'
              />

              <XAxis
                dataKey='name'
              />

              <YAxis />

              <Tooltip
                formatter={
                  value =>
                    formatMoney(
                      value
                    )
                }
              />

              <Legend />

              <Bar
                dataKey='amount'
                name='Revenue'
                fill='#122F21'
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </SectionCard>


      {/* =============================================
          AUTHOR EARNINGS SUMMARY
      ============================================== */}

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>


        <StatCard
          title='Authors Sales Earnings'
          value={
            formatMoney(
              earningsSummary.sales
            )
          }
          icon={TrendingUp}
        />


        <StatCard
          title='Authors Borrowing Earnings'
          value={
            formatMoney(
              earningsSummary
                .borrowings
            )
          }
          icon={BookOpen}
        />


        <StatCard
          title='Total Authors Earnings'
          value={
            formatMoney(
              earningsSummary.total
            )
          }
          icon={UserPen}
        />

      </div>


      {/* =============================================
          AUTHORS EARNINGS CHART
      ============================================== */}

      <SectionCard
        title='Authors Earnings'
      >

        {authorChartData.length ===
        0 ? (

          <EmptyBlock
            text='There is no author earnings data.'
          />

        ) : (

          <div className='p-4'>

            <ResponsiveContainer
              width='100%'
              height={340}
            >

              <BarChart
                data={
                  authorChartData
                }
              >

                <CartesianGrid
                  strokeDasharray='3 3'
                />

                <XAxis
                  dataKey='name'
                  interval={0}
                  angle={-20}
                  textAnchor='end'
                  height={80}
                />

                <YAxis />

                <Tooltip
                  formatter={
                    value =>
                      formatMoney(
                        value
                      )
                  }
                />

                <Legend />


                <Bar
                  dataKey='sales'
                  name='Sales Earnings'
                  fill='#122F21'
                />


                <Bar
                  dataKey='borrowings'
                  name='Borrowing Earnings'
                  fill='#F09A79'
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        )}

      </SectionCard>


      {/* =============================================
          AUTHOR EARNINGS TABLE
      ============================================== */}

      <SectionCard
        title='Authors Earnings Details'
      >

        {authorEarnings.length ===
        0 ? (

          <EmptyBlock
            text='There is no author earnings data.'
          />

        ) : (

          <div className='overflow-x-auto h-full'>

            <table className='w-full min-w-[750px] text-[#122F21]'>


              <thead className='bg-[#A6B37D]'>

                <tr>

                  <th className='p-4 text-center'>
                    Author ID
                  </th>

                  <th className='p-4 text-left'>
                    Author
                  </th>

                  <th className='p-4 text-center'>
                    Sales Earnings
                  </th>

                  <th className='p-4 text-center'>
                    Borrowing Earnings
                  </th>

                  <th className='p-4 text-center'>
                    Total
                  </th>

                </tr>

              </thead>


              <tbody>

                {authorEarnings.map(
                  author => (

                    <tr
                      key={
                        author.author_id
                      }
                      className='border-b border-[#122F21]/10 hover:bg-[#6cb474]/30 transition'
                    >


                      <td className='p-4 text-center'>

                        #
                        {
                          author.author_id
                        }

                      </td>


                      <td className='p-4 font-bold'>

                        {
                          author.author_name
                        }

                      </td>


                      <td className='p-4 text-center'>

                        {
                          formatMoney(
                            author.sales
                          )
                        }

                      </td>


                      <td className='p-4 text-center'>

                        {
                          formatMoney(
                            author.borrowings
                          )
                        }

                      </td>


                      <td className='p-4 text-center font-bold'>

                        {
                          formatMoney(
                            author.total
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


      {/* =============================================
          LOW ACTIVITY BOOKS
      ============================================== */}

      <SectionCard
        title='Low Activity Books — Last 30 Days'
      >

        {lowActivityLoading ? (

          <div className='min-h-[250px] flex flex-col gap-3 justify-center items-center text-[#122F21]'>

            <RefreshCw
              size={30}
              className='animate-spin'
            />

            Loading books...

          </div>

        ) : lowActivityBooks.length ===
          0 ? (

          <EmptyBlock
            text='There are no low activity books.'
          />

        ) : (

          <div className='overflow-x-auto h-full'>

            <table className='w-full min-w-[850px] text-[#122F21]'>


              <thead className='bg-[#A6B37D]'>

                <tr>

                  <th className='p-4 text-center'>
                    ID
                  </th>

                  <th className='p-4 text-left'>
                    Title
                  </th>

                  <th className='p-4 text-left'>
                    Author
                  </th>

                  <th className='p-4 text-center'>
                    Type
                  </th>

                  <th className='p-4 text-center'>
                    Language
                  </th>

                  <th className='p-4 text-center'>
                    Published At
                  </th>

                </tr>

              </thead>


              <tbody>

                {lowActivityBooks.map(
                  book => (

                    <tr
                      key={book.id}
                      className='border-b border-[#122F21]/10 hover:bg-[#6cb474]/30 transition'
                    >


                      <td className='p-4 text-center'>

                        #{book.id}

                      </td>


                      <td className='p-4 font-bold'>

                        {
                          book.title ||
                          '—'
                        }

                      </td>


                      <td className='p-4'>

                        {
                          getBookAuthorName(
                            book
                          )
                        }

                      </td>


                      <td className='p-4 text-center'>

                        <span className='bg-[#F6EFC5] px-3 py-1 rounded-lg text-xs'>

                          {
                            book.book_type ||
                            '—'
                          }

                        </span>

                      </td>


                      <td className='p-4 text-center'>

                        {
                          book.language ||
                          '—'
                        }

                      </td>


                      <td className='p-4 text-center'>

                        {
                          formatDate(
                            book.published_at
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


        {/* PAGINATION */}

        {
          !lowActivityLoading &&
          lowActivityPagination
            .lastPage > 1 &&
          (

            <div className='p-4 border-t border-[#122F21]/10 flex flex-col sm:flex-row justify-between items-center gap-3'>


              <p className='text-sm text-[#122F21]/60'>

                Showing
                {' '}
                {
                  lowActivityPagination
                    .from
                }
                {' '}
                to
                {' '}
                {
                  lowActivityPagination
                    .to
                }
                {' '}
                of
                {' '}
                {
                  lowActivityPagination
                    .total
                }
                {' '}
                books

              </p>


              <div className='flex gap-2 items-center'>


                <button
                  type='button'
                  disabled={
                    lowActivityPagination
                      .currentPage <= 1
                  }
                  onClick={() =>
                    goToLowActivityPage(
                      lowActivityPagination
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
                    lowActivityPagination
                      .currentPage
                  }
                  {' '}
                  /
                  {' '}
                  {
                    lowActivityPagination
                      .lastPage
                  }

                </span>


                <button
                  type='button'
                  disabled={
                    lowActivityPagination
                      .currentPage >=
                    lowActivityPagination
                      .lastPage
                  }
                  onClick={() =>
                    goToLowActivityPage(
                      lowActivityPagination
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

      </SectionCard>

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
          p-3
          rounded-xl

          ${
            warning
              ? 'bg-red-200'
              : 'bg-[#F09A79]'
          }
        `}
      >

        <Icon size={23} />

      </div>

    </div>

  )

}


// =====================================================
// SECTION
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
// EMPTY
// =====================================================

const EmptyBlock = ({
  text
}) => {

  return (

    <div className='min-h-[220px] flex justify-center items-center text-[#122F21]/60 text-center p-6'>

      {text}

    </div>

  )

}


export default Reports