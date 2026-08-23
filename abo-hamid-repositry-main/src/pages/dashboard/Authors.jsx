import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  AlertTriangle,
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  RefreshCw,
  Search,
  UserPen,
  Users,
  X
} from 'lucide-react'

import api from '../../api/axios'


// =====================================================
// COMPONENT
// =====================================================

const Authors = () => {

  // ===================================================
  // TABS
  // ===================================================

  const [activeTab, setActiveTab] =
    useState('authors')


  // ===================================================
  // AUTHORS
  // ===================================================

  const [authors, setAuthors] =
    useState([])

  const [authorsLoading, setAuthorsLoading] =
    useState(true)

  const [authorBusyId, setAuthorBusyId] =
    useState(null)

  const [searchText, setSearchText] =
    useState('')


  // ===================================================
  // AUTHORS PAGINATION
  // ===================================================

  const [
    authorsPagination,
    setAuthorsPagination
  ] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    from: 0,
    to: 0
  })


  // ===================================================
  // PRE-APPROVED REQUESTS
  // ===================================================

  const [
    requests,
    setRequests
  ] = useState([])

  const [
    requestsLoading,
    setRequestsLoading
  ] = useState(true)

  const [
    requestBusyId,
    setRequestBusyId
  ] = useState(null)

  const [
    selectedRequest,
    setSelectedRequest
  ] = useState(null)


  // ===================================================
  // REQUESTS PAGINATION
  // ===================================================

  const [
    requestsPagination,
    setRequestsPagination
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


  const formatDate = (value) => {

    if (!value) {
      return '—'
    }


    const date = new Date(value)


    if (Number.isNaN(date.getTime())) {
      return value
    }


    return date.toLocaleDateString()

  }


  const formatDateTime = (value) => {

    if (!value) {
      return '—'
    }


    const date = new Date(value)


    if (Number.isNaN(date.getTime())) {
      return value
    }


    return date.toLocaleString()

  }


  const getAuthorId = (author) => {

    return (
      author?.user_id ??
      author?.user?.id ??
      author?.id
    )

  }


  const getAuthorName = (author) => {

    return (
      author?.full_name ??
      author?.user?.full_name ??
      '—'
    )

  }


  const getAuthorEmail = (author) => {

    return (
      author?.email ??
      author?.user?.email ??
      '—'
    )

  }


  const getAuthorUsername = (author) => {

    return (
      author?.username ??
      author?.user?.username ??
      '—'
    )

  }


  const getAuthorStatus = (author) => {

    return (
      author?.status ??
      author?.user?.status ??
      'active'
    )

  }


  // ===================================================
  // AVATAR URL
  // ===================================================

  const getAvatarUrl = (path) => {

    if (!path) {
      return null
    }


    if (
      path.startsWith('http://') ||
      path.startsWith('https://')
    ) {
      return path
    }


    const apiBase =
      api.defaults.baseURL || ''


    const appBase =
      apiBase.replace(/\/api\/?$/, '')


    return (
      `${appBase}/storage/` +
      path.replace(/^\/+/, '')
    )

  }


  // ===================================================
  // NORMALIZE PAGINATION
  // ===================================================

  const normalizePaginatedResponse = (
    response
  ) => {

    const data =
      response?.data?.data


    /*
      حالة Array مباشرة.
    */

    if (Array.isArray(data)) {

      return {
        rows: data,

        pagination: {
          currentPage: 1,
          lastPage: 1,
          total: data.length,
          from:
            data.length > 0
              ? 1
              : 0,
          to: data.length
        }
      }

    }


    /*
      Laravel paginator:

      response.data.data.data
    */

    const paginator =
      data || {}


    const rows =
      Array.isArray(
        paginator.data
      )
        ? paginator.data
        : []


    return {

      rows,

      pagination: {

        currentPage:
          paginator.current_page ?? 1,

        lastPage:
          paginator.last_page ?? 1,

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

      }

    }

  }


  // ===================================================
  // LOAD AUTHORS
  //
  // GET /admin/authors
  //
  // IMPORTANT:
  // لا نرسل search لأن backend الحالي
  // لديه bug معروف فيه.
  // ===================================================

  const loadAuthors = useCallback(
    async (page = 1) => {

      setAuthorsLoading(true)
      setMessage('')


      try {

        const res = await api.get(
          '/admin/authors',
          {
            params: {
              page,
              per_page: 20
            }
          }
        )


        const normalized =
          normalizePaginatedResponse(
            res
          )


        setAuthors(
          normalized.rows
        )


        setAuthorsPagination(
          normalized.pagination
        )

      }

      catch (err) {

        console.error(
          'Authors loading error:',
          err
        )


        setAuthors([])


        showMessage(
          err.response?.data?.message ||
          'Authors could not be loaded.',
          'error'
        )

      }

      finally {

        setAuthorsLoading(false)

      }

    },
    []
  )


  // ===================================================
  // LOAD PRE-APPROVED REQUESTS
  //
  // GET /admin/author-requests/pre-approved
  // ===================================================

  const loadRequests = useCallback(
    async (page = 1) => {

      setRequestsLoading(true)


      try {

        const res = await api.get(
          '/admin/author-requests/pre-approved',
          {
            params: {
              page,
              per_page: 20
            }
          }
        )


        const normalized =
          normalizePaginatedResponse(
            res
          )


        setRequests(
          normalized.rows
        )


        setRequestsPagination(
          normalized.pagination
        )

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

        setRequestsLoading(false)

      }

    },
    []
  )


  // ===================================================
  // FIRST LOAD
  // ===================================================

  useEffect(() => {

    loadAuthors(1)
    loadRequests(1)

  }, [
    loadAuthors,
    loadRequests
  ])


  // ===================================================
  // LOCAL SEARCH
  //
  // Backend search is intentionally NOT used.
  // ===================================================

  const filteredAuthors =
    useMemo(() => {

      const query =
        searchText
          .trim()
          .toLowerCase()


      if (!query) {
        return authors
      }


      return authors.filter(
        author => {

          const id =
            String(
              getAuthorId(author) ?? ''
            )

          const name =
            String(
              getAuthorName(author)
            ).toLowerCase()

          const email =
            String(
              getAuthorEmail(author)
            ).toLowerCase()

          const username =
            String(
              getAuthorUsername(author)
            ).toLowerCase()


          return (
            id.includes(query) ||
            name.includes(query) ||
            email.includes(query) ||
            username.includes(query)
          )

        }
      )

    }, [
      authors,
      searchText
    ])


  // ===================================================
  // TOGGLE AUTHOR
  //
  // POST /admin/authors/{user}/disable
  // POST /admin/authors/{user}/enable
  // ===================================================

  const handleToggleAuthor = async (
    author
  ) => {

    const userId =
      getAuthorId(author)


    if (!userId) {
      return
    }


    const status =
      getAuthorStatus(author)


    if (status === 'active') {

      const confirmed =
        window.confirm(
          `Disable author "${getAuthorName(author)}"?`
        )


      if (!confirmed) {
        return
      }

    }


    setAuthorBusyId(userId)

    setMessage('')


    try {

      const endpoint =

        status === 'active'

          ? `/admin/authors/${userId}/disable`

          : `/admin/authors/${userId}/enable`


      const res =
        await api.post(endpoint)


      const nextStatus =

        status === 'active'
          ? 'disabled'
          : 'active'


      setAuthors(prev =>
        prev.map(item => {

          if (
            getAuthorId(item) !==
            userId
          ) {
            return item
          }


          /*
            ندعم الحالتين:
            author مباشرة User
            أو author.user
          */

          if (item.user) {

            return {
              ...item,

              status:
                item.status !== undefined
                  ? nextStatus
                  : item.status,

              user: {
                ...item.user,
                status: nextStatus
              }
            }

          }


          return {
            ...item,
            status: nextStatus
          }

        })
      )


      showMessage(
        res.data?.message ||
        (
          nextStatus === 'active'
            ? 'Author enabled successfully.'
            : 'Author disabled successfully.'
        )
      )

    }

    catch (err) {

      console.error(
        'Toggle author error:',
        err
      )


      showMessage(
        err.response?.data?.message ||
        'Author status could not be changed.',
        'error'
      )

    }

    finally {

      setAuthorBusyId(null)

    }

  }


  // ===================================================
  // APPROVE PRE-APPROVED REQUEST
  //
  // POST /admin/author-requests/{id}/approve
  // ===================================================

  const handleApproveRequest = async (
    request
  ) => {

    const name =
      request.user?.full_name ||
      'this user'


    const confirmed =
      window.confirm(
        `Approve ${name} as an author?`
      )


    if (!confirmed) {
      return
    }


    setRequestBusyId(
      request.id
    )

    setMessage('')


    try {

      const res = await api.post(
        `/admin/author-requests/${request.id}/approve`
      )


      showMessage(
        res.data?.message ||
        'Author request approved successfully.'
      )


      setSelectedRequest(null)


      /*
        الموافقة تمنح user دور author،
        لذلك نعيد تحميل المؤلفين.
      */

      await Promise.all([
        loadRequests(
          requestsPagination.currentPage
        ),

        loadAuthors(1)
      ])

    }

    catch (err) {

      console.error(
        'Approve author request error:',
        err
      )


      showMessage(
        err.response?.data?.message ||
        'Author request could not be approved.',
        'error'
      )

    }

    finally {

      setRequestBusyId(null)

    }

  }


  // ===================================================
  // REJECT PRE-APPROVED REQUEST
  //
  // POST /admin/author-requests/{id}/reject
  //
  // Backend requires no body.
  // ===================================================

  const handleRejectRequest = async (
    request
  ) => {

    const name =
      request.user?.full_name ||
      'this user'


    const confirmed =
      window.confirm(
        `Reject the author request from ${name}?`
      )


    if (!confirmed) {
      return
    }


    setRequestBusyId(
      request.id
    )

    setMessage('')


    try {

      const res = await api.post(
        `/admin/author-requests/${request.id}/reject`
      )


      showMessage(
        res.data?.message ||
        'Author request rejected.'
      )


      setSelectedRequest(null)


      const targetPage =

        requests.length === 1 &&
        requestsPagination.currentPage > 1

          ? requestsPagination.currentPage - 1

          : requestsPagination.currentPage


      await loadRequests(
        targetPage
      )

    }

    catch (err) {

      console.error(
        'Reject author request error:',
        err
      )


      showMessage(
        err.response?.data?.message ||
        'Author request could not be rejected.',
        'error'
      )

    }

    finally {

      setRequestBusyId(null)

    }

  }


  // ===================================================
  // PAGINATION
  // ===================================================

  const changeAuthorsPage = (
    page
  ) => {

    if (
      page < 1 ||
      page >
        authorsPagination.lastPage ||
      page ===
        authorsPagination.currentPage
    ) {
      return
    }


    setSearchText('')

    loadAuthors(page)

  }


  const changeRequestsPage = (
    page
  ) => {

    if (
      page < 1 ||
      page >
        requestsPagination.lastPage ||
      page ===
        requestsPagination.currentPage
    ) {
      return
    }


    loadRequests(page)

  }


  // ===================================================
  // JSX
  // ===================================================

  return (

    <div className='w-full flex flex-col h-screen gap-5 pb-10'>


      {/* =============================================
          HEADER
      ============================================== */}

      <div>
{/* 
        <h1 className='text-2xl font-bold text-[#122F21] flex items-center gap-2'>

          <UserPen size={28} />

          Authors Management

        </h1> */}


        <p className='text-sm text-[#122F21]/60 mt-1'>

          Manage approved authors and make final decisions on author applications.

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


          <span>
            {message}
          </span>

        </div>

      )}


      {/* =============================================
          TABS
      ============================================== */}

      <div className='flex flex-wrap gap-2'>


        <button
          type='button'
          onClick={() =>
            setActiveTab('authors')
          }
          className={`
            px-5
            py-3
            rounded-xl
            font-medium
            cursor-pointer
            transition

            ${
              activeTab === 'authors'

                ? 'bg-[#122F21] text-white'

                : 'bg-[#AAC3AD] text-[#122F21]'
            }
          `}
        >

          Authors

          <span className='ml-2 opacity-70'>
            ({authorsPagination.total})
          </span>

        </button>


        <button
          type='button'
          onClick={() =>
            setActiveTab('requests')
          }
          className={`
            px-5
            py-3
            rounded-xl
            font-medium
            cursor-pointer
            transition

            ${
              activeTab === 'requests'

                ? 'bg-[#122F21] text-white'

                : 'bg-[#AAC3AD] text-[#122F21]'
            }
          `}
        >

          Pending Final Approval

          <span className='ml-2 opacity-70'>
            ({requestsPagination.total})
          </span>

        </button>

      </div>


      {/* =============================================
          AUTHORS TAB
      ============================================== */}

      {activeTab === 'authors' && (

        <>


          {/* SEARCH / REFRESH */}

          <div className='bg-[#AAC3AD] rounded-2xl shadow-md p-4 flex flex-col md:flex-row gap-4 justify-between'>


            <div className='flex-1 max-w-xl'>

              <label className='block text-xs text-[#122F21]/60 mb-1'>

                Search current page

              </label>


              <div className='relative'>

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
                  placeholder='Name, username, email or ID...'
                  className='w-full bg-[#F6EFC5] rounded-xl py-3 pl-10 pr-4 outline-none'
                />

              </div>


              <p className='text-xs text-[#122F21]/50 mt-1'>

                Search is performed locally because server-side author search is currently broken in the backend.

              </p>

            </div>


            <button
              type='button'
              disabled={authorsLoading}
              onClick={() =>
                loadAuthors(
                  authorsPagination.currentPage
                )
              }
              className='self-end flex items-center justify-center gap-2 bg-[#122F21] text-white px-4 py-3 rounded-xl cursor-pointer disabled:opacity-50'
            >

              <RefreshCw
                size={17}
                className={
                  authorsLoading
                    ? 'animate-spin'
                    : ''
                }
              />

              Refresh

            </button>

          </div>


          {/* SUMMARY */}

          <div className='flex gap-3 flex-wrap'>


            <SummaryCard
              label='Total Authors'
              value={
                authorsPagination.total
              }
            />


            <SummaryCard
              label='Current Page'
              value={authors.length}
            />


            <SummaryCard
              label='Active On Page'
              value={
                authors.filter(
                  author =>
                    getAuthorStatus(
                      author
                    ) === 'active'
                ).length
              }
            />


            <SummaryCard
              label='Disabled On Page'
              value={
                authors.filter(
                  author =>
                    getAuthorStatus(
                      author
                    ) === 'disabled'
                ).length
              }
            />

          </div>


          {/* AUTHORS TABLE */}

          <div className='bg-[#AAC3AD] rounded-2xl shadow-lg overflow-hidden'>


            {authorsLoading ? (

              <LoadingBlock
                text='Loading authors...'
              />

            ) : filteredAuthors.length === 0 ? (

              <EmptyBlock
                icon={Users}
                text='No authors found.'
              />

            ) : (

              <div className='overflow-x-auto h-full'>

                <table className='w-full min-w-[950px] text-[#122F21]'>


                  <thead className='bg-[#A6B37D]'>

                    <tr>

                      <th className='p-4 text-center'>
                        ID
                      </th>

                      <th className='p-4 text-left'>
                        Author
                      </th>

                      <th className='p-4 text-left'>
                        Username
                      </th>

                      <th className='p-4 text-left'>
                        Email
                      </th>

                      <th className='p-4 text-center'>
                        Status
                      </th>

                      <th className='p-4 text-center'>
                        Joined
                      </th>

                      <th className='p-4 text-center'>
                        Action
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {
                      filteredAuthors.map(
                        author => {

                          const id =
                            getAuthorId(
                              author
                            )

                          const status =
                            getAuthorStatus(
                              author
                            )

                          const avatarPath =
                            author.avatar ||
                            author.user?.avatar

                          const avatar =
                            getAvatarUrl(
                              avatarPath
                            )


                          return (

                            <tr
                              key={id}
                              className='border-b border-[#122F21]/10 hover:bg-[#6cb474]/30 transition'
                            >


                              <td className='p-4 text-center'>

                                #{id}

                              </td>


                              <td className='p-4'>

                                <div className='flex items-center gap-3'>


                                  {
                                    avatar

                                      ? (

                                        <img
                                          src={avatar}
                                          alt={
                                            getAuthorName(
                                              author
                                            )
                                          }
                                          className='w-10 h-10 rounded-full object-cover'
                                        />

                                      )

                                      : (

                                        <div className='w-10 h-10 rounded-full bg-[#F6EFC5] flex items-center justify-center'>

                                          <UserPen
                                            size={18}
                                          />

                                        </div>

                                      )
                                  }


                                  <span className='font-bold'>

                                    {
                                      getAuthorName(
                                        author
                                      )
                                    }

                                  </span>

                                </div>

                              </td>


                              <td className='p-4'>

                                {
                                  getAuthorUsername(
                                    author
                                  )
                                }

                              </td>


                              <td className='p-4'>

                                {
                                  getAuthorEmail(
                                    author
                                  )
                                }

                              </td>


                              <td className='p-4 text-center'>

                                <StatusBadge
                                  status={status}
                                />

                              </td>


                              <td className='p-4 text-center'>

                                {
                                  formatDate(
                                    author.created_at ||
                                    author.user?.created_at
                                  )
                                }

                              </td>


                              <td className='p-4 text-center'>

                                <button
                                  type='button'
                                  disabled={
                                    authorBusyId ===
                                    id
                                  }
                                  onClick={() =>
                                    handleToggleAuthor(
                                      author
                                    )
                                  }
                                  className={`
                                    inline-flex
                                    items-center
                                    gap-2
                                    text-white
                                    px-4
                                    py-2
                                    rounded-lg
                                    cursor-pointer
                                    disabled:opacity-50

                                    ${
                                      status === 'active'

                                        ? 'bg-orange-600'

                                        : 'bg-green-700'
                                    }
                                  `}
                                >

                                  {
                                    authorBusyId === id

                                      ? (
                                        <RefreshCw
                                          size={15}
                                          className='animate-spin'
                                        />
                                      )

                                      : status === 'active'

                                        ? (
                                          <Ban
                                            size={15}
                                          />
                                        )

                                        : (
                                          <CheckCircle
                                            size={15}
                                          />
                                        )
                                  }


                                  {
                                    status === 'active'
                                      ? 'Disable'
                                      : 'Enable'
                                  }

                                </button>

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

          </div>


          {/* AUTHORS PAGINATION */}

          <Pagination
            pagination={
              authorsPagination
            }
            loading={
              authorsLoading
            }
            onPageChange={
              changeAuthorsPage
            }
            label='authors'
          />

        </>

      )}


      {/* =============================================
          PRE-APPROVED REQUESTS
      ============================================== */}

      {activeTab === 'requests' && (

        <>


          <div className='flex justify-between items-center'>


            <div>

              <h2 className='text-xl font-bold text-[#122F21]'>

                Requests awaiting final approval

              </h2>


              <p className='text-sm text-[#122F21]/60 mt-1'>

                These requests were already pre-approved by a content employee.

              </p>

            </div>


            <button
              type='button'
              disabled={
                requestsLoading
              }
              onClick={() =>
                loadRequests(
                  requestsPagination.currentPage
                )
              }
              className='flex items-center gap-2 bg-[#122F21] text-white px-4 py-2 rounded-xl cursor-pointer disabled:opacity-50'
            >

              <RefreshCw
                size={17}
                className={
                  requestsLoading
                    ? 'animate-spin'
                    : ''
                }
              />

              Refresh

            </button>

          </div>


          {/* REQUEST TABLE */}

          <div className='bg-[#AAC3AD] rounded-2xl shadow-lg overflow-hidden'>


            {requestsLoading ? (

              <LoadingBlock
                text='Loading author requests...'
              />

            ) : requests.length === 0 ? (

              <EmptyBlock
                icon={FileText}
                text='There are no requests waiting for final approval.'
              />

            ) : (

              <div className='overflow-x-auto h-full'>

                <table className='w-full min-w-[1000px] text-[#122F21]'>


                  <thead className='bg-[#A6B37D]'>

                    <tr>

                      <th className='p-4 text-center'>
                        ID
                      </th>

                      <th className='p-4 text-left'>
                        Applicant
                      </th>

                      <th className='p-4 text-left'>
                        Email
                      </th>

                      <th className='p-4 text-center'>
                        Type
                      </th>

                      <th className='p-4 text-center'>
                        Status
                      </th>

                      <th className='p-4 text-center'>
                        Reviewed At
                      </th>

                      <th className='p-4 text-center'>
                        Actions
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {
                      requests.map(
                        request => (

                          <tr
                            key={request.id}
                            className='border-b border-[#122F21]/10 hover:bg-[#6cb474]/30 transition'
                          >


                            <td className='p-4 text-center'>

                              #{request.id}

                            </td>


                            <td className='p-4 font-bold'>

                              {
                                request.user
                                  ?.full_name ||
                                '—'
                              }

                            </td>


                            <td className='p-4'>

                              {
                                request.user
                                  ?.email ||
                                '—'
                              }

                            </td>


                            <td className='p-4 text-center'>

                              <span className='bg-[#F6EFC5] px-3 py-1 rounded-lg text-xs'>

                                {
                                  request.request_type ||
                                  'upgrade'
                                }

                              </span>

                            </td>


                            <td className='p-4 text-center'>

                              <span className='bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold'>

                                {
                                  request.status ||
                                  'pre_approved'
                                }

                              </span>

                            </td>


                            <td className='p-4 text-center'>

                              {
                                formatDateTime(
                                  request.reviewed_at
                                )
                              }

                            </td>


                            <td className='p-4'>

                              <div className='flex gap-2 justify-center flex-wrap'>


                                {/* DETAILS */}

                                <button
                                  type='button'
                                  onClick={() =>
                                    setSelectedRequest(
                                      request
                                    )
                                  }
                                  className='flex items-center gap-1 bg-[#122F21] text-white px-3 py-2 rounded-lg cursor-pointer'
                                >

                                  <Eye size={15} />

                                  Details

                                </button>


                                {/* APPROVE */}

                                <button
                                  type='button'
                                  disabled={
                                    requestBusyId ===
                                    request.id
                                  }
                                  onClick={() =>
                                    handleApproveRequest(
                                      request
                                    )
                                  }
                                  className='flex items-center gap-1 bg-green-700 text-white px-3 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                                >

                                  {
                                    requestBusyId ===
                                    request.id

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


                                {/* REJECT */}

                                <button
                                  type='button'
                                  disabled={
                                    requestBusyId ===
                                    request.id
                                  }
                                  onClick={() =>
                                    handleRejectRequest(
                                      request
                                    )
                                  }
                                  className='flex items-center gap-1 bg-red-700 text-white px-3 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                                >

                                  <X size={15} />

                                  Reject

                                </button>

                              </div>

                            </td>

                          </tr>

                        )
                      )
                    }

                  </tbody>

                </table>

              </div>

            )}

          </div>


          <Pagination
            pagination={
              requestsPagination
            }
            loading={
              requestsLoading
            }
            onPageChange={
              changeRequestsPage
            }
            label='requests'
          />

        </>

      )}


      {/* =============================================
          REQUEST DETAILS MODAL
      ============================================== */}

      {selectedRequest && (

        <div
          className='fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4'
          onClick={() =>
            setSelectedRequest(null)
          }
        >

          <div
            className='bg-[#F6EFC5] rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'
            onClick={event =>
              event.stopPropagation()
            }
          >


            {/* HEADER */}

            <div className='sticky top-0 z-10 bg-[#F6EFC5] p-5 border-b border-[#122F21]/10 flex justify-between items-center'>

              <div>

                <h2 className='text-xl font-bold text-[#122F21]'>

                  Author Request Details

                </h2>


                <p className='text-sm text-[#122F21]/60'>

                  Request #{selectedRequest.id}

                </p>

              </div>


              <button
                type='button'
                onClick={() =>
                  setSelectedRequest(null)
                }
                className='bg-[#AAC3AD] p-2 rounded-lg cursor-pointer'
              >

                <X size={20} />

              </button>

            </div>


            {/* CONTENT */}

            <div className='p-5 flex flex-col gap-5'>


              {/* USER */}

              <div className='bg-[#AAC3AD] rounded-xl p-4'>

                <p className='text-xs text-[#122F21]/60'>

                  Applicant

                </p>


                <p className='font-bold text-lg text-[#122F21] mt-1'>

                  {
                    selectedRequest.user
                      ?.full_name ||
                    '—'
                  }

                </p>


                <p className='text-sm text-[#122F21]/70'>

                  {
                    selectedRequest.user
                      ?.email ||
                    '—'
                  }

                </p>


                {
                  selectedRequest.user
                    ?.username &&
                  (

                    <p className='text-sm text-[#122F21]/70'>

                      @
                      {
                        selectedRequest
                          .user.username
                      }

                    </p>

                  )
                }

              </div>


              {/* REQUEST METADATA */}

              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>


                <DetailItem
                  label='Request Type'
                  value={
                    selectedRequest.request_type
                  }
                />


                <DetailItem
                  label='Status'
                  value={
                    selectedRequest.status
                  }
                />


                <DetailItem
                  label='Created At'
                  value={
                    formatDateTime(
                      selectedRequest.created_at
                    )
                  }
                />


                <DetailItem
                  label='Reviewed At'
                  value={
                    formatDateTime(
                      selectedRequest.reviewed_at
                    )
                  }
                />

              </div>


              {/* BIO */}

              <TextDetail
                label='Biography'
                value={
                  selectedRequest.bio
                }
              />


              {/* DESCRIPTION */}

              <TextDetail
                label='Description'
                value={
                  selectedRequest.description
                }
              />


              {/* PREVIOUS WORKS */}

              <TextDetail
                label='Previous Works'
                value={
                  selectedRequest.previous_works
                }
              />


              {/* WORK PDFs */}

              <div>

                <h3 className='font-bold text-[#122F21] mb-2'>

                  Submitted Work Files

                </h3>


                {
                  Array.isArray(
                    selectedRequest.work_pdfs
                  ) &&
                  selectedRequest
                    .work_pdfs.length > 0

                    ? (

                      <div className='flex flex-col gap-2'>

                        {
                          selectedRequest
                            .work_pdfs
                            .map(
                              (
                                file,
                                index
                              ) => {

                                const path =
                                  typeof file ===
                                  'string'

                                    ? file

                                    : file?.path


                                const size =
                                  typeof file ===
                                  'object'

                                    ? file?.size

                                    : null


                                return (

                                  <div
                                    key={
                                      `${path}-${index}`
                                    }
                                    className='bg-[#AAC3AD] rounded-xl p-3'
                                  >

                                    <div className='flex items-center gap-2'>

                                      <FileText
                                        size={18}
                                      />


                                      <span className='font-medium break-all'>

                                        {
                                          path ||
                                          `File ${index + 1}`
                                        }

                                      </span>

                                    </div>


                                    {
                                      size &&
                                      (

                                        <p className='text-xs text-[#122F21]/60 mt-1'>

                                          {
                                            (
                                              Number(size) /
                                              1024 /
                                              1024
                                            ).toFixed(2)
                                          }
                                          {' '}
                                          MB

                                        </p>

                                      )
                                    }

                                  </div>

                                )

                              }
                            )
                        }

                      </div>

                    )

                    : (

                      <p className='text-sm text-[#122F21]/60'>

                        No work files were submitted.

                      </p>

                    )
                }

              </div>


              {/* NOTE */}

              <div className='bg-yellow-100 text-yellow-900 p-4 rounded-xl'>

                This request has already been reviewed by a content employee and reached the
                <strong>
                  {' '}pre_approved{' '}
                </strong>
                state. The admin's action here is the final decision.

              </div>


              {/* ACTIONS */}

              <div className='flex justify-end gap-2'>


                <button
                  type='button'
                  disabled={
                    requestBusyId ===
                    selectedRequest.id
                  }
                  onClick={() =>
                    handleRejectRequest(
                      selectedRequest
                    )
                  }
                  className='bg-red-700 text-white px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                >

                  Reject

                </button>


                <button
                  type='button'
                  disabled={
                    requestBusyId ===
                    selectedRequest.id
                  }
                  onClick={() =>
                    handleApproveRequest(
                      selectedRequest
                    )
                  }
                  className='bg-green-700 text-white px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                >

                  {
                    requestBusyId ===
                    selectedRequest.id

                      ? 'Processing...'

                      : 'Final Approval'
                  }

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  )

}


// =====================================================
// STATUS BADGE
// =====================================================

const StatusBadge = ({
  status
}) => {

  const disabled =
    status === 'disabled'


  return (

    <span
      className={`
        inline-flex
        items-center
        gap-1
        px-3
        py-1
        rounded-full
        text-xs
        font-bold

        ${
          disabled

            ? 'bg-red-100 text-red-700'

            : 'bg-green-100 text-green-700'
        }
      `}
    >

      {
        disabled

          ? (
            <Ban size={13} />
          )

          : (
            <CheckCircle
              size={13}
            />
          )
      }

      {status}

    </span>

  )

}


// =====================================================
// SUMMARY CARD
// =====================================================

const SummaryCard = ({
  label,
  value
}) => {

  return (

    <div className='bg-[#A6B37D] text-[#122F21] rounded-xl px-4 py-2'>

      {label}:
      {' '}

      <strong>
        {value}
      </strong>

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


      <p className='font-medium text-[#122F21] mt-1'>

        {value || '—'}

      </p>

    </div>

  )

}


// =====================================================
// TEXT DETAIL
// =====================================================

const TextDetail = ({
  label,
  value
}) => {

  return (

    <div>

      <h3 className='font-bold text-[#122F21] mb-2'>

        {label}

      </h3>


      <div className='bg-[#AAC3AD] rounded-xl p-4 whitespace-pre-wrap text-[#122F21]'>

        {value || '—'}

      </div>

    </div>

  )

}


// =====================================================
// LOADING BLOCK
// =====================================================

const LoadingBlock = ({
  text
}) => {

  return (

    <div className='min-h-[330px] flex flex-col justify-center items-center gap-3 text-[#122F21]'>

      <RefreshCw
        size={32}
        className='animate-spin'
      />

      {text}

    </div>

  )

}


// =====================================================
// EMPTY BLOCK
// =====================================================

const EmptyBlock = ({
  icon: Icon,
  text
}) => {

  return (

    <div className='min-h-[300px] flex flex-col justify-center items-center text-[#122F21]/70'>

      <Icon
        size={45}
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
  loading,
  onPageChange,
  label
}) => {

  if (
    loading ||
    pagination.lastPage <= 1
  ) {
    return null
  }


  return (

    <div className='flex flex-col sm:flex-row justify-between items-center gap-3 text-[#122F21]'>


      <div className='text-sm opacity-70'>

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
        {label}

      </div>


      <div className='flex gap-2 items-center'>


        <button
          type='button'
          disabled={
            pagination.currentPage <= 1
          }
          onClick={() =>
            onPageChange(
              pagination.currentPage - 1
            )
          }
          className='bg-[#AAC3AD] p-2 rounded-lg cursor-pointer disabled:opacity-40'
        >

          <ChevronLeft size={20} />

        </button>


        <div className='bg-[#122F21] text-white px-4 py-2 rounded-lg'>

          Page
          {' '}
          {pagination.currentPage}
          {' '}
          /
          {' '}
          {pagination.lastPage}

        </div>


        <button
          type='button'
          disabled={
            pagination.currentPage >=
            pagination.lastPage
          }
          onClick={() =>
            onPageChange(
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


export default Authors