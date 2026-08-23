import React, {
  useMemo,
  useState
} from 'react'

import {
  AlertTriangle,
  CheckCircle,
  Clock3,
  History,
  PackageCheck,
  RefreshCw,
  ScanLine,
  XCircle
} from 'lucide-react'

import {
  markOrderItemReady
} from '../../api/libraryEmployeeApi'


// =====================================================
// COMPONENT
// =====================================================

const OrderItemsReady = () => {

  // ===================================================
  // INPUT
  // ===================================================

  const [
    orderItemId,
    setOrderItemId
  ] = useState('')


  // ===================================================
  // REQUEST STATE
  // ===================================================

  const [busy, setBusy] =
    useState(false)

  const [message, setMessage] =
    useState('')

  const [messageType, setMessageType] =
    useState('success')

  const [fieldError, setFieldError] =
    useState('')


  // ===================================================
  // SESSION HISTORY
  //
  // ملاحظة:
  // ليست بيانات من الباك.
  // فقط العمليات التي نفذها الموظف
  // أثناء فتح هذه الصفحة.
  // ===================================================

  const [history, setHistory] =
    useState([])


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


  // ===================================================
  // VALIDATE ID
  // ===================================================

  const validateOrderItemId = () => {

    const value =
      String(orderItemId)
        .trim()


    if (!value) {

      setFieldError(
        'Order Item ID is required.'
      )

      return null

    }


    const number =
      Number(value)


    if (
      !Number.isInteger(number) ||
      number <= 0
    ) {

      setFieldError(
        'Order Item ID must be a positive integer.'
      )

      return null

    }


    setFieldError('')

    return number

  }


  // ===================================================
  // MARK READY
  //
  // POST
  // /employee/library/order-items/{orderItem}/mark-ready
  //
  // NO BODY
  //
  // Backend requirements:
  // type = physical
  // status = confirmed
  // ===================================================

  const handleMarkReady =
    async event => {

      event.preventDefault()


      const id =
        validateOrderItemId()


      if (!id) {
        return
      }


      const confirmed =
        window.confirm(
          `Mark order item #${id} as ready for pickup?`
        )


      if (!confirmed) {
        return
      }


      setBusy(true)

      setMessage('')


      try {

        const res =
          await markOrderItemReady(
            id
          )


        /*
          الباك قد يرجع العنصر المحدث
          داخل data.

          لا نعتمد عليه بشكل إلزامي
          لأن العقد يضمن العملية أساسًا.
        */

        const returnedItem =
          res.data?.data


        const readyAt =
          returnedItem?.ready_at ||
          new Date().toISOString()


        setHistory(prev => [

          {
            id,
            status:
              returnedItem?.status ||
              'ready',

            ready_at:
              readyAt,

            response:
              returnedItem ||
              null
          },

          ...prev.filter(
            item =>
              item.id !== id
          )

        ])


        showMessage(
          res.data?.message ||
          `Order item #${id} is ready for pickup.`
        )


        setOrderItemId('')

      }

      catch (err) {

        console.error(
          'Mark order item ready error:',
          err
        )


        const status =
          err.response?.status


        const serverMessage =
          err.response
            ?.data
            ?.message


        if (status === 422) {

          showMessage(
            serverMessage ||
            'This item cannot be prepared right now. It must be a confirmed physical item.',
            'error'
          )

        }

        else if (
          status === 404
        ) {

          showMessage(
            serverMessage ||
            'Order item was not found.',
            'error'
          )

        }

        else {

          showMessage(
            serverMessage ||
            'The order item status could not be updated.',
            'error'
          )

        }

      }

      finally {

        setBusy(false)

      }

    }


  // ===================================================
  // CURRENT SESSION STATS
  // ===================================================

  const preparedCount =
    useMemo(
      () => history.length,
      [history]
    )


  // ===================================================
  // JSX
  // ===================================================

  return (

    <div className='w-full flex flex-col gap-6 pb-10'>


      {/* =============================================
          HEADER
      ============================================== */}

      <div>

        {/* <h1 className='text-2xl font-bold text-[#122F21] flex items-center gap-2'>

          <PackageCheck
            size={28}
          />

          Prepare Physical Orders

        </h1> */}


        <p className='text-sm text-[#122F21]/60 mt-1'>

          Mark confirmed physical order items as ready for customer pickup.

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
                <XCircle
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
          MAIN ACTION
      ============================================== */}

      <div className='bg-[#AAC3AD] rounded-2xl shadow-md overflow-hidden'>


        {/* HEADER */}

        <div className='p-5 border-b border-[#122F21]/10'>


          <div className='flex items-center gap-3'>


            <div className='bg-[#F09A79] rounded-xl p-3'>

              <ScanLine
                size={23}
              />

            </div>


            <div>

              <h2 className='text-xl font-bold text-[#122F21]'>

                Mark Item Ready

              </h2>


              <p className='text-sm text-[#122F21]/60 mt-1'>

                Enter the Order Item ID after physically preparing the book copy.

              </p>

            </div>

          </div>

        </div>


        {/* FORM */}

        <form
          onSubmit={
            handleMarkReady
          }
          className='p-5'
        >


          <label className='block text-sm font-bold text-[#122F21] mb-2'>

            Order Item ID

          </label>


          <div className='flex flex-col md:flex-row gap-3'>


            <input
              type='number'
              min='1'
              step='1'
              value={orderItemId}
              disabled={busy}
              placeholder='Example: 42'
              onChange={event => {

                setOrderItemId(
                  event.target.value
                )

                setFieldError('')

                setMessage('')

              }}
              className='flex-1 bg-[#F6EFC5] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#122F21] disabled:opacity-60'
            />


            <button
              type='submit'
              disabled={
                busy ||
                !orderItemId
              }
              className='flex items-center justify-center gap-2 bg-[#122F21] text-white px-6 py-3 rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
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
                    <PackageCheck
                      size={17}
                    />
                  )
              }


              {
                busy
                  ? 'Processing...'
                  : 'Mark Ready'
              }

            </button>

          </div>


          {fieldError && (

            <p className='text-red-700 text-xs mt-2'>

              {fieldError}

            </p>

          )}

        </form>

      </div>


      {/* =============================================
          REQUIREMENTS
      ============================================== */}

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>


        <RequirementCard
          number='1'
          title='Physical Item'
          description='The order item must be a physical book, not a digital purchase.'
        />


        <RequirementCard
          number='2'
          title='Payment Confirmed'
          description='The related payment must already have been approved so the item status is confirmed.'
        />


        <RequirementCard
          number='3'
          title='Prepare the Copy'
          description='After locating and preparing the physical copy, mark the item as ready for pickup.'
        />

      </div>


      {/* =============================================
          BACKEND LIMITATION
      ============================================== */}
{/* 
      <div className='bg-yellow-100 text-yellow-900 rounded-2xl p-5'>


        <div className='flex items-start gap-3'>


          <AlertTriangle
            size={22}
            className='shrink-0 mt-0.5'
          />


          <div>

            <p className='font-bold'>

              Current backend limitation

            </p>


            <p className='text-sm leading-6 mt-1'>

              The backend currently provides the action to mark an Order Item as ready, but it does not provide a Library Employee endpoint that lists all confirmed physical order items waiting to be prepared.

            </p>


            <p className='text-sm leading-6 mt-2'>

              For that reason, this page correctly works by Order Item ID. A real server-backed queue cannot be added from React alone without a new backend listing endpoint.

            </p>

          </div>

        </div>

      </div> */}


      {/* =============================================
          SESSION SUMMARY
      ============================================== */}

      <div className='bg-[#A6B37D] rounded-xl p-4 text-[#122F21] flex items-center justify-between'>


        <div>

          <p className='text-xs opacity-70'>

            Prepared During This Session

          </p>


          <p className='text-2xl font-bold mt-1'>

            {preparedCount}

          </p>

        </div>


        <Clock3 size={25} />

      </div>


      {/* =============================================
          SESSION HISTORY
      ============================================== */}

      {history.length > 0 && (

        <div className='bg-[#AAC3AD] rounded-2xl shadow-md overflow-hidden'>


          <div className='p-5 border-b border-[#122F21]/10 flex items-center gap-2'>

            <History size={20} />


            <div>

              <h2 className='font-bold text-[#122F21]'>

                Session History

              </h2>


              <p className='text-xs text-[#122F21]/60 mt-1'>

                This list exists only in the current browser session and is not a backend history endpoint.

              </p>

            </div>

          </div>


          <div className='overflow-x-auto'>

            <table className='w-full min-w-[600px] text-[#122F21]'>


              <thead className='bg-[#A6B37D]'>

                <tr>

                  <th className='p-4 text-center'>
                    Order Item
                  </th>

                  <th className='p-4 text-center'>
                    Result
                  </th>

                  <th className='p-4 text-center'>
                    Ready At
                  </th>

                </tr>

              </thead>


              <tbody>

                {history.map(item => (

                  <tr
                    key={item.id}
                    className='border-b border-[#122F21]/10 hover:bg-[#6cb474]/30'
                  >

                    <td className='p-4 text-center font-bold'>

                      #{item.id}

                    </td>


                    <td className='p-4 text-center'>

                      <span className='inline-flex items-center gap-1 bg-green-100 text-green-700 rounded-full px-3 py-1 text-xs font-bold'>

                        <CheckCircle
                          size={13}
                        />

                        {item.status}

                      </span>

                    </td>


                    <td className='p-4 text-center'>

                      {
                        formatDateTime(
                          item.ready_at
                        )
                      }

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      )}

    </div>

  )

}


// =====================================================
// REQUIREMENT CARD
// =====================================================

const RequirementCard = ({
  number,
  title,
  description
}) => {

  return (

    <div className='bg-[#AAC3AD] rounded-2xl shadow-sm p-5 text-[#122F21]'>


      <div className='w-9 h-9 bg-[#F09A79] rounded-full flex items-center justify-center font-bold'>

        {number}

      </div>


      <h3 className='font-bold mt-4'>

        {title}

      </h3>


      <p className='text-sm opacity-70 mt-2 leading-6'>

        {description}

      </p>

    </div>

  )

}


export default OrderItemsReady