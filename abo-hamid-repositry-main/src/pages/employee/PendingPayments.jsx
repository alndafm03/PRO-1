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
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Eye,
  RefreshCw,
  Search,
  ShoppingCart,
  User,
  X,
  XCircle
} from 'lucide-react'

import {
  getPendingPayments,
  approvePayment,
  rejectPayment
} from '../../api/libraryEmployeeApi'


// =====================================================
// CONSTANTS
// =====================================================

const PAYMENT_TYPES = {

  'App\\Models\\Order': {
    key: 'order',
    label: 'Book Purchase',
    icon: ShoppingCart
  },

  'App\\Models\\Borrowing': {
    key: 'borrowing',
    label: 'Book Borrowing',
    icon: BookOpen
  },

  'App\\Models\\Reservation': {
    key: 'reservation',
    label: 'Seat Reservation',
    icon: CalendarDays
  }

}


// =====================================================
// COMPONENT
// =====================================================

const PendingPayments = () => {

  // ===================================================
  // DATA
  // ===================================================

  const [payments, setPayments] =
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
    selectedPayment,
    setSelectedPayment
  ] = useState(null)


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
      perPage: 20,
      total: 0,
      from: 0,
      to: 0

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


  const getPaymentType = payment => {

    return (
      PAYMENT_TYPES[
        payment?.payable_type
      ] || {
        key: 'unknown',
        label: 'Unknown Operation',
        icon: CreditCard
      }
    )

  }


  const getCustomerName = payment => {

    return (
      payment?.user?.full_name ||
      payment?.customer_name ||
      (
        payment?.payable?.is_walk_in
          ? 'Walk-in Customer'
          : '—'
      )
    )

  }


  const getCustomerEmail = payment => {

    return (
      payment?.user?.email ||
      '—'
    )

  }


  const getCustomerPhone = payment => {

    return (
      payment?.user?.phone ||
      '—'
    )

  }


  const getPayableId = payment => {

    return (
      payment?.payable?.id ??
      payment?.payable_id ??
      '—'
    )

  }


  // ===================================================
  // LOAD PAYMENTS
  //
  // GET
  // /employee/library/payments/pending
  //
  // Laravel Paginator:
  //
  // res.data.data.data
  // ===================================================

  const loadPayments = useCallback(
    async (page = 1) => {

      setLoading(true)

      setMessage('')


      try {

        const res =
          await getPendingPayments({
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


        setPayments(rows)


        setPagination({

          currentPage:
            paginator.current_page ?? 1,

          lastPage:
            paginator.last_page ?? 1,

          perPage:
            paginator.per_page ?? 20,

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
          'Pending payments error:',
          err
        )


        setPayments([])


        showMessage(
          err.response?.data?.message ||
          'Pending payments could not be loaded.',
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

    loadPayments(1)

  }, [loadPayments])


  // ===================================================
  // LOCAL FILTERING
  //
  // Backend does not expose search/type filters
  // for this endpoint.
  // ===================================================

  const filteredPayments =
    useMemo(() => {

      const query =
        searchText
          .trim()
          .toLowerCase()


      return payments.filter(
        payment => {

          const type =
            getPaymentType(
              payment
            )


          const matchesType =

            typeFilter === 'all' ||
            type.key === typeFilter


          if (!matchesType) {
            return false
          }


          if (!query) {
            return true
          }


          const searchable = [

            payment.id,

            payment.payable_id,

            payment.amount,

            getCustomerName(
              payment
            ),

            getCustomerEmail(
              payment
            ),

            type.label

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
      payments,
      searchText,
      typeFilter
    ])


  // ===================================================
  // APPROVE PAYMENT
  //
  // POST
  // /employee/library/payments/{id}/approve
  //
  // NO BODY
  // ===================================================

  const handleApprove =
    async payment => {

      const confirmed =
        window.confirm(
          `Approve payment #${payment.id} for ${getCustomerName(payment)}?`
        )


      if (!confirmed) {
        return
      }


      setBusyId(
        payment.id
      )

      setMessage('')


      try {

        const res =
          await approvePayment(
            payment.id
          )


        showMessage(
          res.data?.message ||
          'Payment approved successfully.'
        )


        if (
          selectedPayment?.id ===
          payment.id
        ) {
          setSelectedPayment(null)
        }


        /*
          نعيد الجلب لأن الموافقة تغيّر
          payment + payable في الباك.
        */

        const targetPage =

          payments.length === 1 &&
          pagination.currentPage > 1

            ? pagination.currentPage - 1

            : pagination.currentPage


        await loadPayments(
          targetPage
        )

      }

      catch (err) {

        console.error(
          'Approve payment error:',
          err
        )


        showMessage(
          err.response?.data?.message ||
          'Payment could not be approved.',
          'error'
        )

      }

      finally {

        setBusyId(null)

      }

    }


  // ===================================================
  // REJECT PAYMENT
  //
  // POST
  // /employee/library/payments/{id}/reject
  //
  // IMPORTANT:
  // NO BODY
  // NO REJECTION REASON
  // ===================================================

  const handleReject =
    async payment => {

      const type =
        getPaymentType(
          payment
        )


      const confirmed =
        window.confirm(
          `Reject payment #${payment.id} (${type.label})?\n\nThis will also reject the related operation.`
        )


      if (!confirmed) {
        return
      }


      setBusyId(
        payment.id
      )

      setMessage('')


      try {

        const res =
          await rejectPayment(
            payment.id
          )


        showMessage(
          res.data?.message ||
          'Payment rejected successfully.'
        )


        if (
          selectedPayment?.id ===
          payment.id
        ) {
          setSelectedPayment(null)
        }


        const targetPage =

          payments.length === 1 &&
          pagination.currentPage > 1

            ? pagination.currentPage - 1

            : pagination.currentPage


        await loadPayments(
          targetPage
        )

      }

      catch (err) {

        console.error(
          'Reject payment error:',
          err
        )


        /*
          من أخطاء الباك المعروفة:

          422
          هذه العملية ليست بانتظار التحقق
        */

        showMessage(
          err.response?.data?.message ||
          'Payment could not be rejected.',
          'error'
        )

      }

      finally {

        setBusyId(null)

      }

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

    loadPayments(page)

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

            <CreditCard
              size={27}
            />

            Pending Payments

          </h1> */}


          <p className='text-sm text-[#122F21]/60 mt-1'>

            Verify external payments before completing customer operations.

          </p>

        </div>


        <button
          type='button'
          disabled={loading}
          onClick={() =>
            loadPayments(
              pagination.currentPage
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
            p-4
            rounded-xl
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

      <div className='bg-[#AAC3AD] rounded-2xl p-4 shadow-md flex flex-col lg:flex-row gap-4'>


        {/* SEARCH */}

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
            placeholder='Search current page by customer, ID or amount...'
            className='w-full bg-[#F6EFC5] rounded-xl py-3 pl-10 pr-4 outline-none'
          />

        </div>


        {/* TYPE */}

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
            All Operations
          </option>

          <option value='order'>
            Book Purchases
          </option>

          <option value='borrowing'>
            Borrowings
          </option>

          <option value='reservation'>
            Seat Reservations
          </option>

        </select>

      </div>


      {/* =============================================
          SUMMARY
      ============================================== */}

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>


        <SummaryCard
          label='Total Pending'
          value={
            pagination.total
          }
          icon={Clock3}
        />


        <SummaryCard
          label='Purchases On Page'
          value={
            payments.filter(
              payment =>
                getPaymentType(
                  payment
                ).key === 'order'
            ).length
          }
          icon={ShoppingCart}
        />


        <SummaryCard
          label='Borrowings On Page'
          value={
            payments.filter(
              payment =>
                getPaymentType(
                  payment
                ).key ===
                'borrowing'
            ).length
          }
          icon={BookOpen}
        />


        <SummaryCard
          label='Reservations On Page'
          value={
            payments.filter(
              payment =>
                getPaymentType(
                  payment
                ).key ===
                'reservation'
            ).length
          }
          icon={CalendarDays}
        />

      </div>


      {/* =============================================
          TABLE
      ============================================== */}

      <div className='bg-[#AAC3AD] rounded-2xl shadow-lg overflow-hidden'>


        {loading ? (

          <div className='min-h-[350px] flex flex-col items-center justify-center gap-3 text-[#122F21]'>

            <RefreshCw
              size={32}
              className='animate-spin'
            />

            Loading pending payments...

          </div>

        ) : filteredPayments.length === 0 ? (

          <div className='min-h-[300px] flex flex-col justify-center items-center text-[#122F21]/60 text-center p-5'>

            <CreditCard
              size={45}
              className='mb-3'
            />

            {
              payments.length === 0
                ? 'There are no payments awaiting verification.'
                : 'No payments match the current filters.'
            }

          </div>

        ) : (

          <div className='overflow-x-auto h-full'>

            <table className='w-full min-w-[1050px] text-[#122F21]'>


              <thead className='bg-[#A6B37D]'>

                <tr>

                  <th className='p-4 text-center'>
                    Payment
                  </th>

                  <th className='p-4 text-center'>
                    Operation
                  </th>

                  <th className='p-4 text-left'>
                    Customer
                  </th>

                  <th className='p-4 text-center'>
                    Amount
                  </th>

                  <th className='p-4 text-center'>
                    Created
                  </th>

                  <th className='p-4 text-center'>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredPayments.map(
                  payment => {

                    const type =
                      getPaymentType(
                        payment
                      )

                    const Icon =
                      type.icon


                    return (

                      <tr
                        key={payment.id}
                        className='border-b border-[#122F21]/10 hover:bg-[#6cb474]/30 transition'
                      >


                        {/* PAYMENT ID */}

                        <td className='p-4 text-center'>

                          <p className='font-bold'>

                            #{payment.id}

                          </p>


                          <p className='text-xs opacity-60 mt-1'>

                            Operation #
                            {
                              getPayableId(
                                payment
                              )
                            }

                          </p>

                        </td>


                        {/* TYPE */}

                        <td className='p-4'>

                          <div className='flex justify-center'>

                            <span className='inline-flex items-center gap-2 bg-[#F6EFC5] rounded-lg px-3 py-2 text-sm font-medium'>

                              <Icon size={16} />

                              {type.label}

                            </span>

                          </div>

                        </td>


                        {/* CUSTOMER */}

                        <td className='p-4'>

                          <p className='font-bold'>

                            {
                              getCustomerName(
                                payment
                              )
                            }

                          </p>


                          <p className='text-xs opacity-60 mt-1'>

                            {
                              getCustomerEmail(
                                payment
                              )
                            }

                          </p>

                        </td>


                        {/* AMOUNT */}

                        <td className='p-4 text-center font-bold'>

                          {
                            formatMoney(
                              payment.amount
                            )
                          }

                        </td>


                        {/* CREATED */}

                        <td className='p-4 text-center'>

                          {
                            formatDateTime(
                              payment.created_at
                            )
                          }

                        </td>


                        {/* ACTIONS */}

                        <td className='p-4'>

                          <div className='flex justify-center gap-2 flex-wrap'>


                            <button
                              type='button'
                              onClick={() =>
                                setSelectedPayment(
                                  payment
                                )
                              }
                              className='flex items-center gap-1 bg-[#122F21] text-white px-3 py-2 rounded-lg cursor-pointer'
                            >

                              <Eye size={15} />

                              Details

                            </button>


                            <button
                              type='button'
                              disabled={
                                busyId ===
                                payment.id
                              }
                              onClick={() =>
                                handleApprove(
                                  payment
                                )
                              }
                              className='flex items-center gap-1 bg-green-700 text-white px-3 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                            >

                              {
                                busyId ===
                                payment.id

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

                              Approve

                            </button>


                            <button
                              type='button'
                              disabled={
                                busyId ===
                                payment.id
                              }
                              onClick={() =>
                                handleReject(
                                  payment
                                )
                              }
                              className='flex items-center gap-1 bg-red-700 text-white px-3 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                            >

                              <XCircle size={15} />

                              Reject

                            </button>

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
              {' '}
              payments

            </p>


            <div className='flex gap-2 items-center'>


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


      {/* =============================================
          DETAILS MODAL
      ============================================== */}

      {selectedPayment && (

        <PaymentDetailsModal

          payment={
            selectedPayment
          }

          busy={
            busyId ===
            selectedPayment.id
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

          getPaymentType={
            getPaymentType
          }

          getCustomerName={
            getCustomerName
          }

          getCustomerEmail={
            getCustomerEmail
          }

          getCustomerPhone={
            getCustomerPhone
          }

          onApprove={() =>
            handleApprove(
              selectedPayment
            )
          }

          onReject={() =>
            handleReject(
              selectedPayment
            )
          }

          onClose={() =>
            setSelectedPayment(null)
          }

        />

      )}

    </div>

  )

}


// =====================================================
// PAYMENT DETAILS MODAL
// =====================================================

const PaymentDetailsModal = ({
  payment,
  busy,
  formatMoney,
  formatDate,
  formatDateTime,
  getPaymentType,
  getCustomerName,
  getCustomerEmail,
  getCustomerPhone,
  onApprove,
  onReject,
  onClose
}) => {

  const type =
    getPaymentType(
      payment
    )


  const payable =
    payment.payable || {}


  return (

    <div
      className='fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4'
      onClick={onClose}
    >

      <div
        className='bg-[#F6EFC5] w-full max-w-2xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto'
        onClick={event =>
          event.stopPropagation()
        }
      >


        {/* HEADER */}

        <div className='sticky top-0 bg-[#F6EFC5] p-5 border-b border-[#122F21]/10 flex justify-between items-center z-10'>

          <div>

            <h2 className='text-xl font-bold text-[#122F21]'>

              Payment #{payment.id}

            </h2>


            <p className='text-sm text-[#122F21]/60 mt-1'>

              {type.label}

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


          {/* PAYMENT */}

          <div>

            <h3 className='font-bold text-[#122F21] mb-3'>

              Payment Information

            </h3>


            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>

              <DetailItem
                label='Payment ID'
                value={`#${payment.id}`}
              />

              <DetailItem
                label='Status'
                value={
                  payment.status ||
                  'pending'
                }
              />

              <DetailItem
                label='Amount'
                value={
                  formatMoney(
                    payment.amount
                  )
                }
              />

              <DetailItem
                label='Created At'
                value={
                  formatDateTime(
                    payment.created_at
                  )
                }
              />

            </div>

          </div>


          {/* CUSTOMER */}

          <div>

            <h3 className='font-bold text-[#122F21] mb-3 flex items-center gap-2'>

              <User size={18} />

              Customer

            </h3>


            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>

              <DetailItem
                label='Name'
                value={
                  getCustomerName(
                    payment
                  )
                }
              />

              <DetailItem
                label='User ID'
                value={
                  payment.user_id
                    ? `#${payment.user_id}`
                    : '—'
                }
              />

              <DetailItem
                label='Email'
                value={
                  getCustomerEmail(
                    payment
                  )
                }
              />

              <DetailItem
                label='Phone'
                value={
                  getCustomerPhone(
                    payment
                  )
                }
              />

            </div>

          </div>


          {/* OPERATION */}

          <div>

            <h3 className='font-bold text-[#122F21] mb-3'>

              Related Operation

            </h3>


            {
              type.key === 'order' && (

                <OrderDetails
                  payable={payable}
                  formatMoney={
                    formatMoney
                  }
                />

              )
            }


            {
              type.key ===
                'borrowing' && (

                <BorrowingDetails
                  payable={payable}
                  formatMoney={
                    formatMoney
                  }
                  formatDate={
                    formatDate
                  }
                />

              )
            }


            {
              type.key ===
                'reservation' && (

                <ReservationDetails
                  payable={payable}
                  formatMoney={
                    formatMoney
                  }
                  formatDate={
                    formatDate
                  }
                />

              )
            }


            {
              type.key ===
                'unknown' && (

                <div className='bg-[#AAC3AD] rounded-xl p-4'>

                  <p className='text-sm'>

                    Related operation ID:
                    {' '}
                    {
                      payment.payable_id ??
                      payable.id ??
                      '—'
                    }

                  </p>

                </div>

              )
            }

          </div>


          {/* EFFECT NOTICE */}

          <div className='bg-[#A6B37D]/50 rounded-xl p-4 text-[#122F21]'>

            <p className='font-bold'>

              What happens after approval?

            </p>


            <p className='text-sm mt-2 leading-6'>

              {
                type.key === 'order'

                  ? 'The order and its items will be confirmed.'

                  : type.key ===
                    'borrowing'

                    ? 'The borrowing becomes active and its start/end dates are set.'

                    : type.key ===
                      'reservation'

                      ? 'The seat reservation becomes confirmed.'

                      : 'The related operation will be processed by the backend.'
              }

            </p>

          </div>


          {/* ACTIONS */}

          <div className='flex justify-end gap-2'>


            <button
              type='button'
              disabled={busy}
              onClick={onReject}
              className='bg-red-700 text-white px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50'
            >

              Reject

            </button>


            <button
              type='button'
              disabled={busy}
              onClick={onApprove}
              className='bg-green-700 text-white px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-2'
            >

              {
                busy &&
                (
                  <RefreshCw
                    size={16}
                    className='animate-spin'
                  />
                )
              }

              Approve Payment

            </button>

          </div>

        </div>

      </div>

    </div>

  )

}


// =====================================================
// ORDER DETAILS
// =====================================================

const OrderDetails = ({
  payable,
  formatMoney
}) => {

  return (

    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>

      <DetailItem
        label='Order ID'
        value={
          payable.id
            ? `#${payable.id}`
            : '—'
        }
      />

      <DetailItem
        label='Order Status'
        value={
          payable.status ||
          '—'
        }
      />

      <DetailItem
        label='Total Amount'
        value={
          formatMoney(
            payable.total_amount
          )
        }
      />

      <DetailItem
        label='Walk-in'
        value={
          payable.is_walk_in
            ? 'Yes'
            : 'No'
        }
      />

    </div>

  )

}


// =====================================================
// BORROWING DETAILS
// =====================================================

const BorrowingDetails = ({
  payable,
  formatMoney,
  formatDate
}) => {

  return (

    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>

      <DetailItem
        label='Borrowing ID'
        value={
          payable.id
            ? `#${payable.id}`
            : '—'
        }
      />

      <DetailItem
        label='Status'
        value={
          payable.status ||
          '—'
        }
      />

      <DetailItem
        label='Book Type'
        value={
          payable.book_type ||
          '—'
        }
      />

      <DetailItem
        label='Duration'
        value={
          payable.duration_days
            ? `${payable.duration_days} days`
            : '—'
        }
      />

      <DetailItem
        label='Price'
        value={
          formatMoney(
            payable.price
          )
        }
      />

      <DetailItem
        label='Book ID'
        value={
          payable.book_id
            ? `#${payable.book_id}`
            : '—'
        }
      />

      <DetailItem
        label='Start Date'
        value={
          formatDate(
            payable.start_date
          )
        }
      />

      <DetailItem
        label='End Date'
        value={
          formatDate(
            payable.end_date
          )
        }
      />

    </div>

  )

}


// =====================================================
// RESERVATION DETAILS
// =====================================================

const ReservationDetails = ({
  payable,
  formatMoney,
  formatDate
}) => {

  const periodLabel =

    payable.period === 'period_1'
      ? '00:00 - 12:00'

      : payable.period ===
        'period_2'
        ? '12:00 - 24:00'

        : payable.period || '—'


  return (

    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>

      <DetailItem
        label='Reservation ID'
        value={
          payable.id
            ? `#${payable.id}`
            : '—'
        }
      />

      <DetailItem
        label='Status'
        value={
          payable.status ||
          '—'
        }
      />

      <DetailItem
        label='Reservation Date'
        value={
          formatDate(
            payable.reservation_date
          )
        }
      />

      <DetailItem
        label='Period'
        value={periodLabel}
      />

      <DetailItem
        label='Seats'
        value={
          payable.seats_count ??
          '—'
        }
      />

      <DetailItem
        label='Price'
        value={
          formatMoney(
            payable.price
          )
        }
      />

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


      <p className='text-[#122F21] font-medium mt-1 break-words'>

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
  icon: Icon
}) => {

  return (

    <div className='bg-[#A6B37D] rounded-xl p-4 text-[#122F21] flex justify-between items-center'>

      <div>

        <p className='text-xs opacity-70'>

          {label}

        </p>


        <p className='text-xl font-bold mt-1'>

          {value}

        </p>

      </div>


      <Icon size={22} />

    </div>

  )

}


export default PendingPayments