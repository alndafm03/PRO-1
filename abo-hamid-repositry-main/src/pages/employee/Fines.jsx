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
  CircleDollarSign,
  Clock3,
  Eye,
  RefreshCw,
  Search,
  User,
  Wallet,
  X
} from 'lucide-react'

import {
  getFines,
  markFinePaid
} from '../../api/libraryEmployeeApi'


// =====================================================
// COMPONENT
// =====================================================

const Fines = () => {

  // ===================================================
  // DATA
  // ===================================================

  const [fines, setFines] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [busyId, setBusyId] =
    useState(null)


  // ===================================================
  // FILTERS
  // ===================================================

  const [searchText, setSearchText] =
    useState('')

  const [typeFilter, setTypeFilter] =
    useState('all')


  // ===================================================
  // DETAILS
  // ===================================================

  const [
    selectedFine,
    setSelectedFine
  ] = useState(null)


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


    return Number.isNaN(number)
      ? '0'
      : number.toLocaleString()

  }


  const getCustomerName = fine => {

    return (
      fine?.user?.full_name ||
      fine?.user?.username ||
      '—'
    )

  }


  const getCustomerEmail = fine => {

    return (
      fine?.user?.email ||
      '—'
    )

  }


  const getBookTitle = fine => {

    return (
      fine?.book?.title ||
      `Book #${fine?.book?.id ?? '—'}`
    )

  }


  // ===================================================
  // LOAD FINES
  //
  // GET /employee/library/fines
  //
  // IMPORTANT:
  // NOT PAGINATED.
  //
  // {
  //   data: [
  //     {
  //       borrowing_id,
  //       user,
  //       book,
  //       amount,
  //       days_late,
  //       is_estimated
  //     }
  //   ]
  // }
  // ===================================================

  const loadFines =
    useCallback(async () => {

      setLoading(true)

      setMessage('')


      try {

        const res =
          await getFines()


        const data =
          res.data?.data


        setFines(
          Array.isArray(data)
            ? data
            : []
        )

      }

      catch (err) {

        console.error(
          'Fines loading error:',
          err
        )


        setFines([])


        showMessage(
          err.response?.data?.message ||
          'Fines could not be loaded.',
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

    loadFines()

  }, [loadFines])


  // ===================================================
  // FILTER
  // ===================================================

  const filteredFines =
    useMemo(() => {

      const query =
        searchText
          .trim()
          .toLowerCase()


      return fines.filter(
        fine => {

          const matchesType =

            typeFilter === 'all' ||

            (
              typeFilter ===
                'estimated' &&
              fine.is_estimated ===
                true
            ) ||

            (
              typeFilter ===
                'final' &&
              fine.is_estimated ===
                false
            )


          if (!matchesType) {
            return false
          }


          if (!query) {
            return true
          }


          const searchable = [

            fine.borrowing_id,

            getCustomerName(fine),

            getCustomerEmail(fine),

            getBookTitle(fine),

            fine.amount,

            fine.days_late

          ]
            .filter(
              value =>
                value !== null &&
                value !== undefined
            )
            .join(' ')
            .toLowerCase()


          return searchable.includes(
            query
          )

        }
      )

    }, [
      fines,
      searchText,
      typeFilter
    ])


  // ===================================================
  // SUMMARY
  // ===================================================

  const summary =
    useMemo(() => {

      return fines.reduce(
        (
          result,
          fine
        ) => {

          const amount =
            toNumber(
              fine.amount
            )


          result.total +=
            amount


          if (
            fine.is_estimated
          ) {

            result.estimated +=
              amount

            result.estimatedCount +=
              1

          }

          else {

            result.final +=
              amount

            result.finalCount +=
              1

          }


          return result

        },
        {
          total: 0,
          estimated: 0,
          final: 0,
          estimatedCount: 0,
          finalCount: 0
        }
      )

    }, [fines])


  // ===================================================
  // MARK FINE PAID
  //
  // POST
  // /employee/library/fines/{borrowing}/mark-paid
  //
  // NO BODY
  //
  // Only final fines should be paid.
  // Estimated fines belong to active overdue
  // borrowings and are not finalized yet.
  // ===================================================

  const handleMarkPaid =
    async fine => {

      if (
        fine.is_estimated
      ) {

        showMessage(
          'This fine is still estimated. Register the book return first so the backend can calculate the final fine.',
          'error'
        )

        return
      }


      const borrowingId =
        fine.borrowing_id


      if (!borrowingId) {

        showMessage(
          'Borrowing ID is missing.',
          'error'
        )

        return
      }


      const confirmed =
        window.confirm(
          `Confirm payment of fine ${formatMoney(fine.amount)} for borrowing #${borrowingId}?`
        )


      if (!confirmed) {
        return
      }


      setBusyId(
        borrowingId
      )

      setMessage('')


      try {

        const res =
          await markFinePaid(
            borrowingId
          )


        showMessage(
          res.data?.message ||
          `Fine for borrowing #${borrowingId} was marked as paid.`
        )


        /*
          نعيد الجلب من الباك.

          لأن GET /fines يعيد فقط
          الغرامات المستحقة، لذلك الغرامة
          المسددة يجب أن تختفي من القائمة.
        */

        setSelectedFine(null)


        await loadFines()

      }

      catch (err) {

        console.error(
          'Mark fine paid error:',
          err
        )


        /*
          Contract:
          422:
          - لا توجد غرامة مستحقة
          - الغرامة مسددة مسبقًا
        */

        showMessage(
          err.response?.data?.message ||
          'The fine could not be marked as paid.',
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
{/* 
          <h1 className='text-2xl font-bold text-[#122F21] flex items-center gap-2'>

            <CircleDollarSign
              size={28}
            />

            Fines

          </h1> */}


          <p className='text-sm text-[#122F21]/60 mt-1'>

            Review overdue borrowing fines and register final fine payments.

          </p>

        </div>


        <button
          type='button'
          disabled={loading}
          onClick={loadFines}
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

          <span>
            {message}
          </span>

        </div>

      )}


      {/* =============================================
          SUMMARY
      ============================================== */}

      <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3'>


        <SummaryCard
          label='Total Outstanding'
          value={
            formatMoney(
              summary.total
            )
          }
          icon={Wallet}
        />


        <SummaryCard
          label='Final Fines'
          value={
            formatMoney(
              summary.final
            )
          }
          secondary={`${summary.finalCount} record(s)`}
          icon={CircleDollarSign}
        />


        <SummaryCard
          label='Estimated Fines'
          value={
            formatMoney(
              summary.estimated
            )
          }
          secondary={`${summary.estimatedCount} active overdue`}
          icon={Clock3}
          warning={
            summary.estimatedCount >
            0
          }
        />


        <SummaryCard
          label='Fine Records'
          value={
            formatNumber(
              fines.length
            )
          }
          icon={BookOpen}
        />

      </div>


      {/* =============================================
          EXPLANATION
      ============================================== */}

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-3'>



      </div>


      {/* =============================================
          FILTERS
      ============================================== */}

      <div className='bg-[#AAC3AD] rounded-2xl p-4 shadow-md flex flex-col lg:flex-row gap-3'>


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
            placeholder='Search by reader, book or borrowing ID...'
            className='w-full bg-[#F6EFC5] rounded-xl py-3 pl-10 pr-4 outline-none'
          />

        </div>


        <select
          value={typeFilter}
          onChange={event =>
            setTypeFilter(
              event.target.value
            )
          }
          className='bg-[#F6EFC5] rounded-xl px-4 py-3 outline-none text-[#122F21]'
        >

          <option value='all'>
            All Fines
          </option>

          <option value='final'>
            Final Fines
          </option>

          <option value='estimated'>
            Estimated Fines
          </option>

        </select>

      </div>


      {/* =============================================
          TABLE
      ============================================== */}

      <div className='bg-[#AAC3AD] rounded-2xl shadow-md overflow-hidden'>


        {loading ? (

          <div className='min-h-[350px] flex justify-center items-center gap-3 text-[#122F21]'>

            <RefreshCw
              size={31}
              className='animate-spin'
            />

            Loading fines...

          </div>

        ) : filteredFines.length ===
          0 ? (

          <div className='min-h-[300px] flex flex-col justify-center items-center text-[#122F21]/60 text-center p-5'>

            <CircleDollarSign
              size={45}
              className='mb-3'
            />

            {
              fines.length === 0

                ? 'There are no outstanding fines.'

                : 'No fines match the current filters.'
            }

          </div>

        ) : (

          <div className='overflow-x-auto h-full'>


            <table className='w-full min-w-[1050px] text-[#122F21]'>


              <thead className='bg-[#A6B37D]'>

                <tr>

                  <th className='p-4 text-center'>
                    Borrowing
                  </th>

                  <th className='p-4 text-left'>
                    Reader
                  </th>

                  <th className='p-4 text-left'>
                    Book
                  </th>

                  <th className='p-4 text-center'>
                    Late Days
                  </th>

                  <th className='p-4 text-center'>
                    Amount
                  </th>

                  <th className='p-4 text-center'>
                    Type
                  </th>

                  <th className='p-4 text-center'>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>


                {filteredFines.map(
                  fine => {

                    const borrowingId =
                      fine.borrowing_id


                    return (

                      <tr
                        key={
                          borrowingId
                        }
                        className='border-b border-[#122F21]/10 hover:bg-[#6cb474]/30 transition'
                      >


                        {/* BORROWING */}

                        <td className='p-4 text-center font-bold'>

                          #
                          {
                            borrowingId ??
                            '—'
                          }

                        </td>


                        {/* USER */}

                        <td className='p-4'>

                          <p className='font-bold'>

                            {
                              getCustomerName(
                                fine
                              )
                            }

                          </p>


                          <p className='text-xs text-[#122F21]/60 mt-1'>

                            {
                              getCustomerEmail(
                                fine
                              )
                            }

                          </p>

                        </td>


                        {/* BOOK */}

                        <td className='p-4'>

                          <p className='font-medium'>

                            {
                              getBookTitle(
                                fine
                              )
                            }

                          </p>


                          {fine.book?.id && (

                            <p className='text-xs text-[#122F21]/60 mt-1'>

                              Book #
                              {fine.book.id}

                            </p>

                          )}

                        </td>


                        {/* DAYS */}

                        <td className='p-4 text-center'>

                          <span
                            className={`
                              inline-flex
                              items-center
                              gap-1
                              rounded-lg
                              px-3
                              py-1
                              text-sm

                              ${
                                fine.days_late > 0

                                  ? 'bg-red-100 text-red-700'

                                  : 'bg-[#F6EFC5]'
                              }
                            `}
                          >

                            <Clock3
                              size={14}
                            />

                            {
                              formatNumber(
                                fine.days_late
                              )
                            }

                          </span>

                        </td>


                        {/* AMOUNT */}

                        <td className='p-4 text-center font-bold'>

                          {
                            formatMoney(
                              fine.amount
                            )
                          }

                        </td>


                        {/* TYPE */}

                        <td className='p-4 text-center'>

                          <FineTypeBadge
                            estimated={
                              fine.is_estimated
                            }
                          />

                        </td>


                        {/* ACTIONS */}

                        <td className='p-4'>


                          <div className='flex justify-center gap-2 flex-wrap'>


                            <button
                              type='button'
                              onClick={() =>
                                setSelectedFine(
                                  fine
                                )
                              }
                              className='bg-[#122F21] text-white px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer'
                            >

                              <Eye size={15} />

                              Details

                            </button>


                            {fine.is_estimated ? (

                              <span className='bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg text-xs flex items-center'>

                                Return book first

                              </span>

                            ) : (

                              <button
                                type='button'
                                disabled={
                                  busyId ===
                                  borrowingId
                                }
                                onClick={() =>
                                  handleMarkPaid(
                                    fine
                                  )
                                }
                                className='bg-green-700 text-white px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50'
                              >

                                {
                                  busyId ===
                                  borrowingId

                                    ? (
                                      <RefreshCw
                                        size={15}
                                        className='animate-spin'
                                      />
                                    )

                                    : (
                                      <CheckCircle
                                        size={15}
                                      />
                                    )
                                }

                                Mark Paid

                              </button>

                            )}

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
          DETAILS MODAL
      ============================================== */}

      {selectedFine && (

        <div
          className='fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4'
          onClick={() =>
            setSelectedFine(null)
          }
        >

          <div
            className='bg-[#F6EFC5] rounded-2xl shadow-xl w-full max-w-xl'
            onClick={event =>
              event.stopPropagation()
            }
          >


            {/* HEADER */}

            <div className='p-5 border-b border-[#122F21]/10 flex justify-between items-center'>


              <div>

                <h2 className='text-xl font-bold text-[#122F21]'>

                  Fine Details

                </h2>


                <p className='text-sm text-[#122F21]/60 mt-1'>

                  Borrowing #
                  {
                    selectedFine
                      .borrowing_id
                  }

                </p>

              </div>


              <button
                type='button'
                onClick={() =>
                  setSelectedFine(
                    null
                  )
                }
                className='bg-[#AAC3AD] p-2 rounded-lg cursor-pointer'
              >

                <X size={20} />

              </button>

            </div>


            {/* CONTENT */}

            <div className='p-5 flex flex-col gap-5'>


              {/* USER */}

              <div>

                <h3 className='font-bold text-[#122F21] flex items-center gap-2 mb-3'>

                  <User size={18} />

                  Reader

                </h3>


                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>


                  <DetailItem
                    label='Name'
                    value={
                      getCustomerName(
                        selectedFine
                      )
                    }
                  />


                  <DetailItem
                    label='Email'
                    value={
                      getCustomerEmail(
                        selectedFine
                      )
                    }
                  />

                </div>

              </div>


              {/* BOOK */}

              <div>

                <h3 className='font-bold text-[#122F21] flex items-center gap-2 mb-3'>

                  <BookOpen size={18} />

                  Book

                </h3>


                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>


                  <DetailItem
                    label='Title'
                    value={
                      getBookTitle(
                        selectedFine
                      )
                    }
                  />


                  <DetailItem
                    label='Book ID'
                    value={
                      selectedFine.book?.id
                        ? `#${selectedFine.book.id}`
                        : '—'
                    }
                  />

                </div>

              </div>


              {/* FINE */}

              <div>

                <h3 className='font-bold text-[#122F21] flex items-center gap-2 mb-3'>

                  <CircleDollarSign
                    size={18}
                  />

                  Fine

                </h3>


                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>


                  <DetailItem
                    label='Amount'
                    value={
                      formatMoney(
                        selectedFine
                          .amount
                      )
                    }
                  />


                  <DetailItem
                    label='Days Late'
                    value={
                      formatNumber(
                        selectedFine
                          .days_late
                      )
                    }
                  />


                  <DetailItem
                    label='Fine Type'
                    value={
                      selectedFine
                        .is_estimated
                        ? 'Estimated'
                        : 'Final'
                    }
                  />


                  <DetailItem
                    label='Borrowing ID'
                    value={
                      `#${selectedFine.borrowing_id}`
                    }
                  />

                </div>

              </div>


              {/* NOTE */}

              {
                selectedFine
                  .is_estimated ? (

                  <div className='bg-yellow-100 text-yellow-900 rounded-xl p-4'>

                    <p className='font-bold'>

                      This is not the final fine yet.

                    </p>


                    <p className='text-sm mt-1 leading-6'>

                      The borrowing is still active and overdue. The final amount is calculated when the physical return is registered.

                    </p>

                  </div>

                ) : (

                  <div className='bg-green-100 text-green-900 rounded-xl p-4'>

                    <p className='font-bold'>

                      Final unpaid fine

                    </p>


                    <p className='text-sm mt-1 leading-6'>

                      The book has already been returned and this amount can now be registered as paid.

                    </p>

                  </div>

                )
              }


              {/* ACTION */}

              {!selectedFine.is_estimated && (

                <div className='flex justify-end'>


                  <button
                    type='button'
                    disabled={
                      busyId ===
                      selectedFine
                        .borrowing_id
                    }
                    onClick={() =>
                      handleMarkPaid(
                        selectedFine
                      )
                    }
                    className='bg-green-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 cursor-pointer disabled:opacity-50'
                  >

                    {
                      busyId ===
                      selectedFine
                        .borrowing_id &&
                      (

                        <RefreshCw
                          size={16}
                          className='animate-spin'
                        />

                      )
                    }

                    Mark Fine Paid

                  </button>

                </div>

              )}

            </div>

          </div>

        </div>

      )}

    </div>

  )

}


// =====================================================
// FINE TYPE BADGE
// =====================================================

const FineTypeBadge = ({
  estimated
}) => {

  return (

    <span
      className={`
        inline-flex
        items-center
        px-3
        py-1
        rounded-full
        text-xs
        font-bold

        ${
          estimated

            ? 'bg-yellow-100 text-yellow-800'

            : 'bg-green-100 text-green-700'
        }
      `}
    >

      {
        estimated
          ? 'Estimated'
          : 'Final'
      }

    </span>

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
// SUMMARY CARD
// =====================================================

const SummaryCard = ({
  label,
  value,
  secondary,
  icon: Icon,
  warning = false
}) => {

  return (

    <div
      className={`
        rounded-xl
        p-4
        text-[#122F21]
        flex
        justify-between
        items-center

        ${
          warning
            ? 'bg-yellow-100'
            : 'bg-[#A6B37D]'
        }
      `}
    >

      <div>

        <p className='text-xs opacity-70'>

          {label}

        </p>


        <p className='text-2xl font-bold mt-1'>

          {value}

        </p>


        {secondary && (

          <p className='text-xs opacity-60 mt-1'>

            {secondary}

          </p>

        )}

      </div>


      <Icon size={23} />

    </div>

  )

}


export default Fines