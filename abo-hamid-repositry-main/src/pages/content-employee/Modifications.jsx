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
  CheckCircle2,
  Clock3,
  Eye,
  FilePenLine,
  RefreshCw,
  Search,
  User,
  X,
  XCircle
} from 'lucide-react'

import {
  getModificationRequests,
  approveModification,
  rejectModification
} from '../../api/contentEmployeeApi'


// =====================================================
// ALLOWED MODIFICATION FIELDS
// =====================================================

const ALLOWED_FIELDS = [
  'title',
  'description',
  'publisher',
  'publisher_year',
  'language',
  'page_count',
  'price_physical',
  'price_digital'
]


const FIELD_LABELS = {
  title: 'Title',
  description: 'Description',
  publisher: 'Publisher',
  publisher_year: 'Publication Year',
  language: 'Language',
  page_count: 'Page Count',
  price_physical: 'Physical Price',
  price_digital: 'Digital Price'
}


// =====================================================
// HELPERS
// =====================================================

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


const formatValue = value => {

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—'
  }


  if (
    typeof value === 'boolean'
  ) {
    return value
      ? 'Yes'
      : 'No'
  }


  if (
    typeof value === 'object'
  ) {

    try {

      return JSON.stringify(
        value,
        null,
        2
      )

    }

    catch {

      return String(value)

    }

  }


  return String(value)

}


const getAuthorName = request => {

  return (
    request.user?.full_name ||
    request.book?.author?.full_name ||
    request.book?.author_name ||
    (
      request.user_id
        ? `User #${request.user_id}`
        : '—'
    )
  )

}


const normalizeChanges = changes => {

  if (!changes) {
    return {}
  }


  if (
    typeof changes === 'object' &&
    !Array.isArray(changes)
  ) {
    return changes
  }


  if (
    typeof changes === 'string'
  ) {

    try {

      const parsed =
        JSON.parse(changes)


      if (
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed)
      ) {
        return parsed
      }

    }

    catch {
      return {}
    }

  }


  return {}

}


// =====================================================
// COMPONENT
// =====================================================

const Modifications = () => {

  // ===================================================
  // DATA
  // ===================================================

  const [
    requests,
    setRequests
  ] = useState([])

  const [loading, setLoading] =
    useState(true)

  const [busyId, setBusyId] =
    useState(null)


  // ===================================================
  // SEARCH
  // ===================================================

  const [
    searchText,
    setSearchText
  ] = useState('')


  // ===================================================
  // DETAILS
  // ===================================================

  const [
    selectedRequest,
    setSelectedRequest
  ] = useState(null)


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
  // RESPONSE INFORMATION
  //
  // Contract does not explicitly state whether
  // modification-requests is paginated.
  //
  // Therefore this frontend safely supports:
  //
  // { data: [...] }
  //
  // AND
  //
  // { data: { data: [...] } }
  //
  // without inventing pagination query parameters.
  // ===================================================

  const [
    responseMeta,
    setResponseMeta
  ] = useState({
    total: 0,
    isPaginated: false
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
  // LOAD
  //
  // GET
  // /employee/content/modification-requests
  // ===================================================

  const loadRequests =
    useCallback(async () => {

      setLoading(true)

      setMessage('')


      try {

        const res =
          await getModificationRequests()


        const payload =
          res.data?.data


        /*
          Supported response #1:

          {
            data: [...]
          }
        */

        if (
          Array.isArray(payload)
        ) {

          setRequests(payload)


          setResponseMeta({
            total: payload.length,
            isPaginated: false
          })


          return

        }


        /*
          Supported response #2:

          {
            data: {
              data: [...],
              total: ...
            }
          }
        */

        if (
          payload &&
          Array.isArray(
            payload.data
          )
        ) {

          setRequests(
            payload.data
          )


          setResponseMeta({
            total:
              payload.total ??
              payload.data.length,

            isPaginated: true
          })


          return

        }


        setRequests([])


        setResponseMeta({
          total: 0,
          isPaginated: false
        })

      }

      catch (err) {

        console.error(
          'Modification requests loading error:',
          err
        )


        setRequests([])


        showMessage(
          err.response?.data?.message ||
          'Modification requests could not be loaded.',
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

    loadRequests()

  }, [loadRequests])


  // ===================================================
  // SEARCH
  // ===================================================

  const filteredRequests =
    useMemo(() => {

      const query =
        searchText
          .trim()
          .toLowerCase()


      if (!query) {
        return requests
      }


      return requests.filter(
        request => {

          const changes =
            normalizeChanges(
              request.changes
            )


          const values = [

            request.id,

            request.book_id,

            request.user_id,

            request.book?.title,

            getAuthorName(
              request
            ),

            request.user?.email,

            request.status,

            ...Object.keys(changes),

            ...Object.values(changes)
              .map(formatValue)

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
      requests,
      searchText
    ])


  // ===================================================
  // SUMMARY
  // ===================================================

  const summary =
    useMemo(() => {

      let totalChanges = 0

      let priceChanges = 0

      let textChanges = 0


      requests.forEach(
        request => {

          const changes =
            normalizeChanges(
              request.changes
            )


          const fields =
            Object.keys(changes)


          totalChanges +=
            fields.length


          fields.forEach(field => {

            if (
              field ===
                'price_physical' ||
              field ===
                'price_digital'
            ) {

              priceChanges += 1

            }

            else {

              textChanges += 1

            }

          })

        }
      )


      return {
        totalChanges,
        priceChanges,
        textChanges
      }

    }, [requests])


  // ===================================================
  // APPROVE
  //
  // POST
  // /employee/content/modification-requests/{request}/approve
  //
  // NO BODY
  //
  // Backend automatically applies allowed fields
  // from request.changes to the book.
  // ===================================================

  const handleApprove =
    async request => {

      const changes =
        normalizeChanges(
          request.changes
        )


      const validFields =
        Object.keys(changes)
          .filter(field =>
            ALLOWED_FIELDS.includes(
              field
            )
          )


      const confirmed =
        window.confirm(
          `Approve modification request #${request.id}?\n\n${validFields.length} supported change(s) will be applied to the published book by the backend.`
        )


      if (!confirmed) {
        return
      }


      setBusyId(
        request.id
      )

      setMessage('')


      try {

        const res =
          await approveModification(
            request.id
          )


        showMessage(
          res.data?.message ||
          'Modification approved and the book was updated successfully.'
        )


        setSelectedRequest(null)


        /*
          Request is no longer pending,
          so reload backend state.
        */

        await loadRequests()

      }

      catch (err) {

        console.error(
          'Approve modification error:',
          err
        )


        showMessage(
          err.response?.data?.message ||
          'The modification request could not be approved.',
          'error'
        )

      }

      finally {

        setBusyId(null)

      }

    }


  // ===================================================
  // REJECT
  //
  // POST
  // /employee/content/modification-requests/{request}/reject
  //
  // NO BODY
  // ===================================================

  const handleReject =
    async request => {

      const confirmed =
        window.confirm(
          `Reject modification request #${request.id} for "${request.book?.title || `Book #${request.book_id}`}"?\n\nThe current backend endpoint does not accept a rejection reason.`
        )


      if (!confirmed) {
        return
      }


      setBusyId(
        request.id
      )

      setMessage('')


      try {

        const res =
          await rejectModification(
            request.id
          )


        showMessage(
          res.data?.message ||
          'Modification request rejected successfully.'
        )


        setSelectedRequest(null)


        await loadRequests()

      }

      catch (err) {

        console.error(
          'Reject modification error:',
          err
        )


        showMessage(
          err.response?.data?.message ||
          'The modification request could not be rejected.',
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

            <FilePenLine
              size={28}
            />

            Published Book Modifications

          </h1> */}


          <p className='text-sm text-[#122F21]/60 mt-1'>

            Review modification requests submitted by authors for already published books.

          </p>

        </div>


        <button
          type='button'
          disabled={loading}
          onClick={
            loadRequests
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
          WORKFLOW INFORMATION
      ============================================== */}



      {/* =============================================
          SUMMARY
      ============================================== */}

      <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3'>


        <SummaryCard
          label='Pending Requests'
          value={
            responseMeta.total
          }
          icon={Clock3}
        />


        <SummaryCard
          label='Loaded Requests'
          value={
            requests.length
          }
          icon={FilePenLine}
        />


        <SummaryCard
          label='Changes On Loaded Requests'
          value={
            summary.totalChanges
          }
          icon={BookOpen}
        />


        <SummaryCard
          label='Price Changes'
          value={
            summary.priceChanges
          }
          icon={FilePenLine}
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
            value={
              searchText
            }
            onChange={event =>
              setSearchText(
                event.target.value
              )
            }
            placeholder='Search by book, author, request ID or changed field...'
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

            Loading modification requests...

          </div>

        ) : filteredRequests.length ===
          0 ? (

          <div className='min-h-[300px] flex flex-col justify-center items-center text-[#122F21]/60 text-center p-5'>

            <FilePenLine
              size={45}
              className='mb-3'
            />

            {
              requests.length === 0

                ? 'There are no pending modification requests.'

                : 'No modification request matches the current search.'
            }

          </div>

        ) : (

          <div className='overflow-x-auto h-full'>


            <table className='w-full min-w-[1050px] text-[#122F21]'>


              <thead className='bg-[#A6B37D]'>

                <tr>

                  <th className='p-4 text-center'>
                    Request
                  </th>

                  <th className='p-4 text-left'>
                    Book
                  </th>

                  <th className='p-4 text-left'>
                    Author
                  </th>

                  <th className='p-4 text-center'>
                    Changes
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


                {filteredRequests.map(
                  request => {

                    const changes =
                      normalizeChanges(
                        request.changes
                      )


                    const fields =
                      Object.keys(
                        changes
                      )


                    return (

                      <tr
                        key={request.id}
                        className='border-b border-[#122F21]/10 hover:bg-[#6cb474]/30 transition'
                      >


                        {/* REQUEST */}

                        <td className='p-4 text-center font-bold'>

                          #{request.id}

                        </td>


                        {/* BOOK */}

                        <td className='p-4'>

                          <p className='font-bold'>

                            {
                              request.book
                                ?.title ||
                              (
                                request.book_id
                                  ? `Book #${request.book_id}`
                                  : '—'
                              )
                            }

                          </p>


                          {request.book_id && (

                            <p className='text-xs opacity-60 mt-1'>

                              ID #{request.book_id}

                            </p>

                          )}

                        </td>


                        {/* AUTHOR */}

                        <td className='p-4'>

                          <p className='font-medium'>

                            {
                              getAuthorName(
                                request
                              )
                            }

                          </p>


                          {request.user?.email && (

                            <p className='text-xs opacity-60 mt-1'>

                              {
                                request.user.email
                              }

                            </p>

                          )}

                        </td>


                        {/* CHANGES */}

                        <td className='p-4 text-center'>

                          <span className='bg-[#F6EFC5] px-3 py-1 rounded-lg font-bold text-sm'>

                            {fields.length}

                          </span>


                          {fields.length > 0 && (

                            <p className='text-xs opacity-60 mt-2 max-w-[220px] mx-auto'>

                              {
                                fields
                                  .map(
                                    field =>
                                      FIELD_LABELS[field] ||
                                      field
                                  )
                                  .join(', ')
                              }

                            </p>

                          )}

                        </td>


                        {/* DATE */}

                        <td className='p-4 text-center text-sm'>

                          {
                            formatDateTime(
                              request.created_at
                            )
                          }

                        </td>


                        {/* STATUS */}

                        <td className='p-4 text-center'>

                          <StatusBadge
                            status={
                              request.status ||
                              'pending'
                            }
                          />

                        </td>


                        {/* ACTION */}

                        <td className='p-4'>

                          <div className='flex justify-center flex-wrap gap-2'>


                            <button
                              type='button'
                              onClick={() =>
                                setSelectedRequest(
                                  request
                                )
                              }
                              className='bg-[#F6EFC5] px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer'
                            >

                              <Eye size={15} />

                              Review

                            </button>


                            <button
                              type='button'
                              disabled={
                                busyId ===
                                request.id
                              }
                              onClick={() =>
                                handleApprove(
                                  request
                                )
                              }
                              className='bg-green-700 text-white px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50'
                            >

                              {
                                busyId ===
                                request.id

                                  ? (
                                    <RefreshCw
                                      size={15}
                                      className='animate-spin'
                                    />
                                  )

                                  : (
                                    <CheckCircle2
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
                                request.id
                              }
                              onClick={() =>
                                handleReject(
                                  request
                                )
                              }
                              className='bg-red-700 text-white px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50'
                            >

                              <XCircle
                                size={15}
                              />

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
          BACKEND CONTRACT NOTE
      ============================================== */}

    

      {/* =============================================
          DETAILS MODAL
      ============================================== */}

      {selectedRequest && (

        <ModificationDetailsModal

          request={
            selectedRequest
          }

          busy={
            busyId ===
            selectedRequest.id
          }

          onClose={() =>
            setSelectedRequest(
              null
            )
          }

          onApprove={() =>
            handleApprove(
              selectedRequest
            )
          }

          onReject={() =>
            handleReject(
              selectedRequest
            )
          }

        />

      )}

    </div>

  )

}


// =====================================================
// DETAILS MODAL
// =====================================================

const ModificationDetailsModal = ({
  request,
  busy,
  onClose,
  onApprove,
  onReject
}) => {

  const changes =
    normalizeChanges(
      request.changes
    )


  const changeEntries =
    Object.entries(
      changes
    )


  return (

    <div
      className='fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4'
      onClick={onClose}
    >

      <div
        className='bg-[#F6EFC5] rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto'
        onClick={event =>
          event.stopPropagation()
        }
      >


        {/* HEADER */}

        <div className='sticky top-0 z-10 bg-[#F6EFC5] p-5 border-b border-[#122F21]/10 flex justify-between items-center'>


          <div>

            <h2 className='text-xl font-bold text-[#122F21]'>

              Modification Request

            </h2>


            <p className='text-sm text-[#122F21]/60 mt-1'>

              Request #{request.id}

            </p>

          </div>


          <button
            type='button'
            disabled={busy}
            onClick={onClose}
            className='bg-[#AAC3AD] p-2 rounded-lg cursor-pointer disabled:opacity-50'
          >

            <X size={20} />

          </button>

        </div>


        <div className='p-5 flex flex-col gap-6'>


          {/* REQUEST INFORMATION */}

          <div>

            <SectionTitle
              icon={FilePenLine}
              title='Request Information'
            />


            <div className='grid grid-cols-1 md:grid-cols-3 gap-3 mt-3'>


              <DetailItem
                label='Request ID'
                value={
                  `#${request.id}`
                }
              />


              <DetailItem
                label='Status'
                value={
                  request.status ||
                  'pending'
                }
              />


              <DetailItem
                label='Submitted At'
                value={
                  formatDateTime(
                    request.created_at
                  )
                }
              />

            </div>

          </div>


          {/* AUTHOR */}

          <div>

            <SectionTitle
              icon={User}
              title='Author'
            />


            <div className='grid grid-cols-1 md:grid-cols-3 gap-3 mt-3'>


              <DetailItem
                label='Name'
                value={
                  getAuthorName(
                    request
                  )
                }
              />


              <DetailItem
                label='User ID'
                value={
                  request.user_id
                    ? `#${request.user_id}`
                    : '—'
                }
              />


              <DetailItem
                label='Email'
                value={
                  request.user
                    ?.email ||
                  '—'
                }
              />

            </div>

          </div>


          {/* BOOK */}

          <div>

            <SectionTitle
              icon={BookOpen}
              title='Published Book'
            />


            <div className='grid grid-cols-1 md:grid-cols-3 gap-3 mt-3'>


              <DetailItem
                label='Title'
                value={
                  request.book
                    ?.title ||
                  '—'
                }
              />


              <DetailItem
                label='Book ID'
                value={
                  request.book_id
                    ? `#${request.book_id}`
                    : '—'
                }
              />


              <DetailItem
                label='Publish Status'
                value={
                  request.book
                    ?.publish_status ||
                  '—'
                }
              />

            </div>

          </div>


          {/* CHANGES */}

          <div>

            <SectionTitle
              icon={FilePenLine}
              title='Requested Changes'
            />


            {changeEntries.length === 0 ? (

              <div className='bg-yellow-100 text-yellow-900 rounded-xl p-4 mt-3'>

                This request does not contain a readable changes object.

              </div>

            ) : (

              <div className='flex flex-col gap-3 mt-3'>


                {changeEntries.map(
                  ([
                    field,
                    newValue
                  ]) => {

                    const supported =
                      ALLOWED_FIELDS.includes(
                        field
                      )


                    const currentValue =
                      request.book?.[
                        field
                      ]


                    return (

                      <div
                        key={field}
                        className={`
                          rounded-xl
                          p-4

                          ${
                            supported
                              ? 'bg-[#AAC3AD]'
                              : 'bg-yellow-100'
                          }
                        `}
                      >


                        <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3'>


                          <div>

                            <p className='font-bold text-[#122F21]'>

                              {
                                FIELD_LABELS[
                                  field
                                ] ||
                                field
                              }

                            </p>


                            <p className='text-xs text-[#122F21]/60'>

                              Field:
                              {' '}
                              {field}

                            </p>

                          </div>


                          <span
                            className={`
                              text-xs
                              font-bold
                              px-3
                              py-1
                              rounded-full
                              w-fit

                              ${
                                supported
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-200 text-yellow-900'
                              }
                            `}
                          >

                            {
                              supported
                                ? 'Will be applied'
                                : 'Ignored by backend'
                            }

                          </span>

                        </div>


                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>


                          <div className='bg-[#F6EFC5] rounded-lg p-3'>

                            <p className='text-xs opacity-60'>

                              Current Value

                            </p>


                            <pre className='font-medium mt-1 whitespace-pre-wrap break-words font-sans'>

                              {
                                formatValue(
                                  currentValue
                                )
                              }

                            </pre>

                          </div>


                          <div className='bg-[#F6EFC5] rounded-lg p-3'>

                            <p className='text-xs opacity-60'>

                              Requested Value

                            </p>


                            <pre className='font-medium mt-1 whitespace-pre-wrap break-words font-sans'>

                              {
                                formatValue(
                                  newValue
                                )
                              }

                            </pre>

                          </div>

                        </div>

                      </div>

                    )

                  }
                )}

              </div>

            )}

          </div>


          {/* REVIEW INFORMATION */}

          <div>

            <SectionTitle
              icon={Clock3}
              title='Review Information'
            />


            <div className='grid grid-cols-1 md:grid-cols-2 gap-3 mt-3'>


              <DetailItem
                label='Reviewed By'
                value={
                  request.reviewed_by
                    ? `Employee #${request.reviewed_by}`
                    : 'Not reviewed yet'
                }
              />


              <DetailItem
                label='Reviewed At'
                value={
                  formatDateTime(
                    request.reviewed_at
                  )
                }
              />

            </div>

          </div>


          {/* IMPORTANT */}

          <div className='bg-[#A6B37D]/50 rounded-xl p-4 text-sm leading-6 text-[#122F21]'>

            Approve and Reject are both bodyless actions in the current Content Employee API. There is no rejection-reason field for published-book modification requests.

          </div>


          {/* ACTIONS */}

          <div className='border-t border-[#122F21]/10 pt-5 flex flex-wrap gap-2 justify-end'>


            <button
              type='button'
              disabled={busy}
              onClick={onReject}
              className='bg-red-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 cursor-pointer disabled:opacity-50'
            >

              <XCircle size={16} />

              Reject Request

            </button>


            <button
              type='button'
              disabled={busy}
              onClick={onApprove}
              className='bg-green-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 cursor-pointer disabled:opacity-50'
            >

              {
                busy
                  ? (
                    <RefreshCw
                      size={16}
                      className='animate-spin'
                    />
                  )
                  : (
                    <CheckCircle2
                      size={16}
                    />
                  )
              }

              Approve & Apply Changes

            </button>

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

    pending:
      'bg-yellow-100 text-yellow-800',

    approved:
      'bg-green-100 text-green-700',

    rejected_by_employee:
      'bg-red-100 text-red-700',

    changes_requested:
      'bg-blue-100 text-blue-700'

  }


  const labels = {

    pending:
      'Pending',

    approved:
      'Approved',

    rejected_by_employee:
      'Rejected',

    changes_requested:
      'Changes Requested'

  }


  return (

    <span
      className={`
        inline-flex
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
        labels[status] ||
        status ||
        'Unknown'
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
// SECTION TITLE
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
// SUMMARY
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


        <p className='text-2xl font-bold mt-1'>

          {value}

        </p>

      </div>


      <Icon size={23} />

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


export default Modifications