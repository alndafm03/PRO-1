import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  UserCheck,
  UserRoundCheck,
  X,
  XCircle
} from 'lucide-react'

import {
  getAuthorRequests,
  preApproveAuthorRequest,
  rejectAuthorRequest,
  requestAuthorChanges
} from '../../api/contentEmployeeApi'


// =====================================================
// HELPERS
// =====================================================

const formatDateTime = value => {

  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}


const formatBytes = value => {

  const bytes = Number(value)

  if (
    !Number.isFinite(bytes) ||
    bytes < 0
  ) {
    return '—'
  }

  if (bytes === 0) {
    return '0 B'
  }

  const units = [
    'B',
    'KB',
    'MB',
    'GB'
  ]

  const index = Math.min(
    Math.floor(
      Math.log(bytes) /
      Math.log(1024)
    ),
    units.length - 1
  )

  const result =
    bytes /
    Math.pow(
      1024,
      index
    )

  return `${result.toFixed(
    index === 0 ? 0 : 2
  )} ${units[index]}`
}


const getFileName = path => {

  if (!path) {
    return 'PDF File'
  }

  const parts =
    String(path)
      .split('/')

  return (
    parts[
      parts.length - 1
    ] || path
  )
}


// =====================================================
// COMPONENT
// =====================================================

const AuthorRequests = () => {

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
  // MESSAGE HELPER
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
  // /employee/content/author-requests
  //
  // Returns:
  // pending upgrade requests only
  // paginated
  // with user relation
  // ===================================================

  const loadRequests =
    useCallback(
      async (page = 1) => {

        setLoading(true)
        setMessage('')

        try {

          const res =
            await getAuthorRequests({

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


          setRequests(rows)


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
                rows.length > 0
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
            'Author requests loading error:',
            err
          )

          setRequests([])

          showMessage(
            err.response?.data?.message ||
            'Author requests could not be loaded.',
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

    loadRequests(1)

  }, [loadRequests])


  // ===================================================
  // SEARCH CURRENT PAGE
  //
  // No backend search documented
  // for this endpoint.
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

          const values = [

            request.id,

            request.user_id,

            request.user
              ?.full_name,

            request.user
              ?.username,

            request.user
              ?.email,

            request.user
              ?.phone,

            request.bio,

            request.description,

            request.previous_works

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
  // PRE APPROVE
  //
  // POST
  // /author-requests/{id}/pre-approve
  //
  // NO BODY
  //
  // pending -> pre_approved
  // then Admin makes final decision.
  // ===================================================

  const handlePreApprove =
    async request => {

      const confirmed =
        window.confirm(
          `Pre-approve the author request from "${request.user?.full_name || `User #${request.user_id}`}"?\n\nThe request will move to the Admin for the final decision.`
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
          await preApproveAuthorRequest(
            request.id
          )


        showMessage(
          res.data?.message ||
          'Request pre-approved successfully and sent to Admin.'
        )


        setSelectedRequest(null)


        await reloadAfterRemoval()

      }

      catch (err) {

        console.error(
          'Pre-approve author request:',
          err
        )


        showMessage(
          err.response?.data?.message ||
          'The request could not be pre-approved.',
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
  // /author-requests/{id}/reject
  //
  // NO BODY
  //
  // pending -> rejected_by_employee
  // ===================================================

  const handleReject =
    async request => {

      const confirmed =
        window.confirm(
          `Reject the author upgrade request from "${request.user?.full_name || `User #${request.user_id}`}"?`
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
          await rejectAuthorRequest(
            request.id
          )


        showMessage(
          res.data?.message ||
          'Author request rejected successfully.'
        )


        setSelectedRequest(null)


        await reloadAfterRemoval()

      }

      catch (err) {

        console.error(
          'Reject author request:',
          err
        )


        showMessage(
          err.response?.data?.message ||
          'The request could not be rejected.',
          'error'
        )

      }

      finally {

        setBusyId(null)

      }

    }


  // ===================================================
  // REQUEST CHANGES
  //
  // POST
  // /author-requests/{id}/request-changes
  //
  // NO BODY
  //
  // pending -> changes_requested
  //
  // IMPORTANT:
  // Backend currently provides no field
  // for notes in this action.
  // ===================================================

  const handleRequestChanges =
    async request => {

      const confirmed =
        window.confirm(
          `Request changes for the author application from "${request.user?.full_name || `User #${request.user_id}`}"?\n\nThe current backend endpoint does not accept a notes field.`
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
          await requestAuthorChanges(
            request.id
          )


        showMessage(
          res.data?.message ||
          'Changes were requested successfully.'
        )


        setSelectedRequest(null)


        await reloadAfterRemoval()

      }

      catch (err) {

        console.error(
          'Request author changes:',
          err
        )


        showMessage(
          err.response?.data?.message ||
          'Changes could not be requested.',
          'error'
        )

      }

      finally {

        setBusyId(null)

      }

    }


  // ===================================================
  // RELOAD AFTER DECISION
  //
  // GET endpoint returns only pending requests.
  // After any action the item should disappear.
  // ===================================================

  const reloadAfterRemoval =
    async () => {

      const targetPage =

        requests.length === 1 &&
        pagination.currentPage > 1

          ? pagination.currentPage - 1

          : pagination.currentPage


      await loadRequests(
        targetPage
      )

    }


  // ===================================================
  // PAGINATION
  // ===================================================

  const goToPage = page => {

    if (
      page < 1 ||
      page >
        pagination.lastPage ||
      page ===
        pagination.currentPage
    ) {
      return
    }


    setSearchText('')

    loadRequests(page)

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

            <UserRoundCheck
              size={28}
            />

            Author Applications

          </h1> */}


          <p className='text-sm text-[#122F21]/60 mt-1'>

            Review pending requests from readers who want to become authors.

          </p>

        </div>


        <button
          type='button'
          disabled={loading}
          onClick={() =>
            loadRequests(
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


      {/* =============================================
          SUMMARY
      ============================================== */}

      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>


        <SummaryCard
          label='Pending Requests'
          value={
            pagination.total
          }
          icon={Clock3}
        />


        <SummaryCard
          label='Loaded On Page'
          value={
            requests.length
          }
          icon={User}
        />


        <SummaryCard
          label='Visible After Search'
          value={
            filteredRequests.length
          }
          icon={Search}
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
            placeholder='Search current page by applicant name, email, username or ID...'
            className='w-full bg-[#F6EFC5] rounded-xl py-3 pl-10 pr-4 outline-none'
          />

        </div>

      </div>


      {/* =============================================
          TABLE
      ============================================== */}

      <div className='bg-[#AAC3AD] rounded-2xl shadow-md overflow-hidden'>


        {loading ? (

          <div className='min-h-[340px] flex justify-center items-center gap-3 text-[#122F21]'>

            <RefreshCw
              size={30}
              className='animate-spin'
            />

            Loading author requests...

          </div>

        ) : filteredRequests.length ===
          0 ? (

          <div className='min-h-[300px] flex flex-col justify-center items-center text-[#122F21]/60 p-5 text-center'>

            <UserRoundCheck
              size={45}
              className='mb-3'
            />

            {
              requests.length === 0

                ? 'There are no pending author applications.'

                : 'No request matches the current search.'
            }

          </div>

        ) : (

          <div className='overflow-x-auto h-full'>


            <table className='w-full min-w-[1000px] text-[#122F21]'>


              <thead className='bg-[#A6B37D]'>

                <tr>

                  <th className='p-4 text-center'>
                    Request
                  </th>

                  <th className='p-4 text-left'>
                    Applicant
                  </th>

                  <th className='p-4 text-left'>
                    Contact
                  </th>

                  <th className='p-4 text-center'>
                    PDFs
                  </th>

                  <th className='p-4 text-center'>
                    Submitted
                  </th>

                  <th className='p-4 text-center'>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredRequests.map(
                  request => {

                    const pdfs =
                      Array.isArray(
                        request.work_pdfs
                      )
                        ? request.work_pdfs
                        : []


                    return (

                      <tr
                        key={
                          request.id
                        }
                        className='border-b border-[#122F21]/10 hover:bg-[#6cb474]/30 transition'
                      >


                        <td className='p-4 text-center font-bold'>

                          #{request.id}

                        </td>


                        <td className='p-4'>

                          <p className='font-bold'>

                            {
                              request.user
                                ?.full_name ||
                              `User #${request.user_id}`
                            }

                          </p>


                          <p className='text-xs opacity-60 mt-1'>

                            {
                              request.user
                                ?.username
                                ? `@${request.user.username}`
                                : '—'
                            }

                          </p>

                        </td>


                        <td className='p-4'>

                          <p className='text-sm'>

                            {
                              request.user
                                ?.email ||
                              '—'
                            }

                          </p>


                          <p className='text-xs opacity-60 mt-1'>

                            {
                              request.user
                                ?.phone ||
                              '—'
                            }

                          </p>

                        </td>


                        <td className='p-4 text-center'>

                          <span className='bg-[#F6EFC5] px-3 py-1 rounded-lg text-sm'>

                            {pdfs.length}

                          </span>

                        </td>


                        <td className='p-4 text-center text-sm'>

                          {
                            formatDateTime(
                              request.created_at
                            )
                          }

                        </td>


                        <td className='p-4'>

                          <div className='flex justify-center gap-2 flex-wrap'>


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

                              Details

                            </button>


                            <button
                              type='button'
                              disabled={
                                busyId ===
                                request.id
                              }
                              onClick={() =>
                                handlePreApprove(
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
                                    <UserCheck
                                      size={15}
                                    />
                                  )
                              }

                              Pre-approve

                            </button>


                            <button
                              type='button'
                              disabled={
                                busyId ===
                                request.id
                              }
                              onClick={() =>
                                handleRequestChanges(
                                  request
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
                                request.id
                              }
                              onClick={() =>
                                handleReject(
                                  request
                                )
                              }
                              className='bg-red-700 text-white px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50'
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
        pagination.lastPage >
          1 &&
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


            <div className='flex gap-2 items-center'>


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

      {selectedRequest && (

        <RequestDetailsModal

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

          onPreApprove={() =>
            handlePreApprove(
              selectedRequest
            )
          }

          onChanges={() =>
            handleRequestChanges(
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

const RequestDetailsModal = ({
  request,
  busy,
  onClose,
  onPreApprove,
  onChanges,
  onReject
}) => {

  const pdfs =
    Array.isArray(
      request.work_pdfs
    )
      ? request.work_pdfs
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


        {/* HEADER */}

        <div className='sticky top-0 bg-[#F6EFC5] p-5 border-b border-[#122F21]/10 flex justify-between items-center'>


          <div>

            <h2 className='text-xl font-bold text-[#122F21]'>

              Author Application

            </h2>


            <p className='text-sm text-[#122F21]/60 mt-1'>

              Request #{request.id}

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


          {/* USER */}

          <SectionTitle
            icon={User}
            title='Applicant'
          />


          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>


            <DetailItem
              label='Full Name'
              value={
                request.user
                  ?.full_name ||
                '—'
              }
            />


            <DetailItem
              label='Username'
              value={
                request.user
                  ?.username
                  ? `@${request.user.username}`
                  : '—'
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


            <DetailItem
              label='Phone'
              value={
                request.user
                  ?.phone ||
                '—'
              }
            />


            <DetailItem
              label='Submitted'
              value={
                formatDateTime(
                  request.created_at
                )
              }
            />

          </div>


          {/* BIO */}

          <TextSection
            title='Biography'
            value={
              request.bio
            }
          />


          {/* DESCRIPTION */}

          <TextSection
            title='Application Description'
            value={
              request.description
            }
          />


          {/* WORKS */}

          <TextSection
            title='Previous Works'
            value={
              request.previous_works
            }
          />


          {/* PDFs */}

          <div>


            <SectionTitle
              icon={FileText}
              title='Work PDFs'
            />


            {pdfs.length === 0 ? (

              <div className='bg-[#AAC3AD] rounded-xl p-4 text-sm text-[#122F21]/60 mt-3'>

                No PDF files were attached.

              </div>

            ) : (

              <div className='flex flex-col gap-2 mt-3'>


                {pdfs.map(
                  (
                    pdf,
                    index
                  ) => {

                    const path =
                      typeof pdf ===
                      'string'
                        ? pdf
                        : pdf?.path


                    const size =
                      typeof pdf ===
                      'object'
                        ? pdf?.size
                        : null


                    return (

                      <div
                        key={`${path || 'pdf'}-${index}`}
                        className='bg-[#AAC3AD] rounded-xl p-4 flex items-center gap-3'
                      >

                        <FileText
                          size={22}
                          className='shrink-0'
                        />


                        <div className='min-w-0'>

                          <p className='font-bold text-[#122F21] break-all'>

                            {
                              getFileName(
                                path
                              )
                            }

                          </p>


                          <p className='text-xs text-[#122F21]/60 mt-1'>

                            {
                              size
                                ? formatBytes(
                                    size
                                  )
                                : 'Size not provided'
                            }

                          </p>


                          {path && (

                            <p className='text-xs text-[#122F21]/50 mt-1 break-all'>

                              {path}

                            </p>

                          )}

                        </div>

                      </div>

                    )

                  }
                )}

              </div>

            )}


            <div className='bg-yellow-100 text-yellow-900 rounded-xl p-4 mt-3 text-sm leading-6'>

              The current API contract returns PDF metadata as
              {' '}
              <strong>
                path + size
              </strong>
              , but it does not document a Content Employee endpoint or public URL for downloading these files. Therefore this frontend does not invent a download link.

            </div>

          </div>


          {/* STATE */}

          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>


            <DetailItem
              label='Request Type'
              value={
                request.request_type ||
                'upgrade'
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
              label='Reviewed At'
              value={
                formatDateTime(
                  request.reviewed_at
                )
              }
            />

          </div>


          {/* ACTION NOTE */}

          <div className='bg-[#A6B37D]/50 rounded-xl p-4 text-sm text-[#122F21]'>

            Request Changes and Reject do not accept comments or reasons in the current backend contract. React can only execute the action itself.

          </div>


          {/* ACTIONS */}

          <div className='border-t border-[#122F21]/10 pt-5 flex flex-wrap gap-2'>


            <button
              type='button'
              disabled={busy}
              onClick={
                onPreApprove
              }
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
                    <ShieldCheck
                      size={16}
                    />
                  )
              }

              Pre-approve

            </button>


            <button
              type='button'
              disabled={busy}
              onClick={
                onChanges
              }
              className='bg-yellow-600 text-white px-5 py-2 rounded-lg cursor-pointer disabled:opacity-50'
            >

              Request Changes

            </button>


            <button
              type='button'
              disabled={busy}
              onClick={
                onReject
              }
              className='bg-red-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 cursor-pointer disabled:opacity-50'
            >

              <XCircle size={16} />

              Reject

            </button>

          </div>

        </div>

      </div>

    </div>

  )

}


// =====================================================
// TEXT SECTION
// =====================================================

const TextSection = ({
  title,
  value
}) => {

  return (

    <div>

      <p className='font-bold text-[#122F21] mb-2'>

        {title}

      </p>


      <div className='bg-[#AAC3AD] rounded-xl p-4 text-sm text-[#122F21] whitespace-pre-wrap leading-6'>

        {
          value ||
          'No information provided.'
        }

      </div>

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
// WORKFLOW ITEM
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


export default AuthorRequests