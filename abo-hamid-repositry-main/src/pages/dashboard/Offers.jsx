import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  X
} from 'lucide-react'

import api from '../../api/axios'


// =====================================================
// CONSTANTS
// =====================================================

const EMPTY_FORM = {
  discount_percent: '',
  starts_at: '',
  ends_at: '',
  active: true,
  book_ids: []
}


// =====================================================
// MAIN COMPONENT
// =====================================================

const Offers = () => {

  // ===================================================
  // OFFERS
  // ===================================================

  const [offers, setOffers] = useState([])

  const [loading, setLoading] =
    useState(true)

  const [busyId, setBusyId] =
    useState(null)


  // ===================================================
  // BOOKS
  // ===================================================

  const [books, setBooks] = useState([])

  const [booksLoading, setBooksLoading] =
    useState(false)

  const [bookSearch, setBookSearch] =
    useState('')


  // ===================================================
  // SEARCH
  // ===================================================

  const [searchText, setSearchText] =
    useState('')


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
  // MESSAGE
  // ===================================================

  const [message, setMessage] =
    useState('')

  const [messageType, setMessageType] =
    useState('success')


  // ===================================================
  // ADD
  // ===================================================

  const [showAddModal, setShowAddModal] =
    useState(false)

  const [addForm, setAddForm] =
    useState(EMPTY_FORM)

  const [addErrors, setAddErrors] =
    useState({})

  const [adding, setAdding] =
    useState(false)


  // ===================================================
  // EDIT
  // ===================================================

  const [editingOffer, setEditingOffer] =
    useState(null)

  const [editForm, setEditForm] =
    useState(EMPTY_FORM)

  const [editErrors, setEditErrors] =
    useState({})

  const [savingEdit, setSavingEdit] =
    useState(false)


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


  const toDateInput = (value) => {

    if (!value) {
      return ''
    }


    return String(value)
      .slice(0, 10)

  }


  const getOfferState = (offer) => {

    if (!offer.active) {

      return {
        text: 'Inactive',
        className:
          'bg-gray-200 text-gray-700'
      }

    }


    const now = new Date()

    const startsAt =
      offer.starts_at
        ? new Date(offer.starts_at)
        : null

    const endsAt =
      offer.ends_at
        ? new Date(offer.ends_at)
        : null


    if (
      startsAt &&
      startsAt > now
    ) {

      return {
        text: 'Upcoming',
        className:
          'bg-yellow-100 text-yellow-800'
      }

    }


    if (
      endsAt &&
      endsAt < now
    ) {

      return {
        text: 'Expired',
        className:
          'bg-red-100 text-red-700'
      }

    }


    return {
      text: 'Active',
      className:
        'bg-green-100 text-green-700'
    }

  }


  // ===================================================
  // LOAD OFFERS
  //
  // GET /admin/offers
  // ===================================================

  const loadOffers = useCallback(
    async (page = 1) => {

      setLoading(true)
      setMessage('')


      try {

        const res = await api.get(
          '/admin/offers',
          {
            params: {
              page,
              per_page: 20
            }
          }
        )


        const data =
          res.data?.data


        /*
          Contract says admin offers are paginated.

          Expected:
          {
            data: {
              current_page,
              data: [...]
            }
          }

          نحتفظ أيضًا بدعم Array مباشر
          احتياطًا بدون كسر الصفحة.
        */

        if (Array.isArray(data)) {

          setOffers(data)

          setPagination({
            currentPage: 1,
            lastPage: 1,
            perPage: data.length,
            total: data.length,
            from:
              data.length > 0
                ? 1
                : 0,
            to: data.length
          })

          return
        }


        const paginator =
          data || {}


        const rows =
          Array.isArray(paginator.data)
            ? paginator.data
            : []


        setOffers(rows)


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
          'Offers loading error:',
          err
        )


        setOffers([])


        showMessage(
          err.response?.data?.message ||
          'Offers could not be loaded.',
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
  // LOAD ALL PUBLISHED BOOKS
  //
  // GET /books
  //
  // نستعمل الكتب الفعلية بدل إدخال IDs يدويًا.
  // ===================================================

  const loadBooks = useCallback(
    async () => {

      setBooksLoading(true)


      try {

        let page = 1

        let lastPage = 1

        const allBooks = []


        do {

          const res = await api.get(
            '/books',
            {
              params: {
                page,
                per_page: 100
              }
            }
          )


          const paginator =
            res.data?.data || {}


          const rows =
            Array.isArray(
              paginator.data
            )
              ? paginator.data
              : []


          allBooks.push(...rows)


          lastPage =
            paginator.last_page ?? 1


          page += 1

        }
        while (
          page <= lastPage
        )


        /*
          إزالة أي تكرار احتياطي.
        */

        const uniqueBooks =
          Array.from(
            new Map(
              allBooks.map(book => [
                book.id,
                book
              ])
            ).values()
          )


        setBooks(uniqueBooks)

      }

      catch (err) {

        console.error(
          'Books loading error:',
          err
        )


        showMessage(
          err.response?.data?.message ||
          'Books could not be loaded for offer selection.',
          'error'
        )

      }

      finally {

        setBooksLoading(false)

      }

    },
    []
  )


  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {

    loadOffers(1)
    loadBooks()

  }, [
    loadOffers,
    loadBooks
  ])


  // ===================================================
  // LOCAL OFFER SEARCH
  //
  // Backend does not expose search for admin offers.
  // ===================================================

  const filteredOffers =
    useMemo(() => {

      const query =
        searchText
          .trim()
          .toLowerCase()


      if (!query) {
        return offers
      }


      return offers.filter(
        offer => {

          const idMatch =
            String(
              offer.id ?? ''
            ).includes(query)


          const discountMatch =
            String(
              offer.discount_percent ??
              ''
            ).includes(query)


          const bookMatch =
            Array.isArray(
              offer.books
            ) &&
            offer.books.some(
              book =>
                String(
                  book.title ?? ''
                )
                  .toLowerCase()
                  .includes(query)
            )


          return (
            idMatch ||
            discountMatch ||
            bookMatch
          )

        }
      )

    }, [
      offers,
      searchText
    ])


  // ===================================================
  // FILTER BOOKS IN MODAL
  // ===================================================

  const filteredBooks =
    useMemo(() => {

      const query =
        bookSearch
          .trim()
          .toLowerCase()


      if (!query) {
        return books
      }


      return books.filter(book => {

        const author =
          book.author?.full_name ||
          book.author_name ||
          ''


        return (
          String(book.title ?? '')
            .toLowerCase()
            .includes(query) ||

          String(author)
            .toLowerCase()
            .includes(query) ||

          String(book.id)
            .includes(query)
        )

      })

    }, [
      books,
      bookSearch
    ])


  // ===================================================
  // GENERIC FIELD ERROR
  // ===================================================

  const normalizeErrors = (err) => {

    if (
      err.response?.status === 422 &&
      err.response?.data?.errors
    ) {

      return err.response.data.errors

    }


    return {}

  }


  // ===================================================
  // ADD CHANGE
  // ===================================================

  const handleAddChange = (
    event
  ) => {

    const {
      name,
      value,
      type,
      checked
    } = event.target


    setAddForm(prev => ({
      ...prev,

      [name]:
        type === 'checkbox'
          ? checked
          : value
    }))


    if (addErrors[name]) {

      setAddErrors(prev => ({
        ...prev,
        [name]: undefined
      }))

    }

  }


  // ===================================================
  // EDIT CHANGE
  // ===================================================

  const handleEditChange = (
    event
  ) => {

    const {
      name,
      value,
      type,
      checked
    } = event.target


    setEditForm(prev => ({
      ...prev,

      [name]:
        type === 'checkbox'
          ? checked
          : value
    }))


    if (editErrors[name]) {

      setEditErrors(prev => ({
        ...prev,
        [name]: undefined
      }))

    }

  }


  // ===================================================
  // TOGGLE BOOK
  // ===================================================

  const toggleBook = (
    bookId,
    mode
  ) => {

    if (mode === 'add') {

      setAddForm(prev => {

        const exists =
          prev.book_ids.includes(
            bookId
          )


        return {
          ...prev,

          book_ids:
            exists

              ? prev.book_ids.filter(
                  id => id !== bookId
                )

              : [
                  ...prev.book_ids,
                  bookId
                ]
        }

      })


      setAddErrors(prev => ({
        ...prev,
        book_ids: undefined
      }))

    }

    else {

      setEditForm(prev => {

        const exists =
          prev.book_ids.includes(
            bookId
          )


        return {
          ...prev,

          book_ids:
            exists

              ? prev.book_ids.filter(
                  id => id !== bookId
                )

              : [
                  ...prev.book_ids,
                  bookId
                ]
        }

      })


      setEditErrors(prev => ({
        ...prev,
        book_ids: undefined
      }))

    }

  }


  // ===================================================
  // VALIDATE
  // ===================================================

  const validateForm = (
    form,
    setErrors
  ) => {

    const errors = {}


    const discount =
      Number(
        form.discount_percent
      )


    if (
      !form.discount_percent ||
      Number.isNaN(discount)
    ) {

      errors.discount_percent = [
        'Discount percentage is required.'
      ]

    }

    else if (
      discount < 1 ||
      discount > 100
    ) {

      errors.discount_percent = [
        'Discount percentage must be between 1 and 100.'
      ]

    }


    if (
      form.starts_at &&
      form.ends_at &&
      form.ends_at < form.starts_at
    ) {

      errors.ends_at = [
        'End date must be after or equal to start date.'
      ]

    }


    if (
      !Array.isArray(
        form.book_ids
      ) ||
      form.book_ids.length === 0
    ) {

      errors.book_ids = [
        'Select at least one book.'
      ]

    }


    setErrors(errors)


    return (
      Object.keys(errors).length === 0
    )

  }


  // ===================================================
  // CREATE OFFER
  //
  // POST /admin/offers
  // ===================================================

  const handleCreateOffer = async (
    event
  ) => {

    event.preventDefault()


    if (
      !validateForm(
        addForm,
        setAddErrors
      )
    ) {
      return
    }


    setAdding(true)
    setMessage('')
    setAddErrors({})


    try {

      const payload = {

        discount_percent:
          Number(
            addForm.discount_percent
          ),

        active:
          Boolean(addForm.active),

        book_ids:
          addForm.book_ids

      }


      /*
        starts_at / ends_at optional.
        لا نرسل "".
      */

      if (addForm.starts_at) {

        payload.starts_at =
          addForm.starts_at

      }


      if (addForm.ends_at) {

        payload.ends_at =
          addForm.ends_at

      }


      const res = await api.post(
        '/admin/offers',
        payload
      )


      showMessage(
        res.data?.message ||
        'Offer created successfully.'
      )


      setShowAddModal(false)

      setAddForm(EMPTY_FORM)

      setAddErrors({})

      setBookSearch('')


      /*
        نعيد تحميل البيانات لأن القائمة
        Paginated.
      */

      await loadOffers(1)

    }

    catch (err) {

      console.error(
        'Create offer error:',
        err
      )


      setAddErrors(
        normalizeErrors(err)
      )


      showMessage(
        err.response?.data?.message ||
        'Offer could not be created.',
        'error'
      )

    }

    finally {

      setAdding(false)

    }

  }


  // ===================================================
  // OPEN EDIT
  // ===================================================

  const openEditModal = (offer) => {

    setEditingOffer(offer)

    setEditErrors({})

    setBookSearch('')


    setEditForm({

      discount_percent:
        offer.discount_percent ?? '',

      starts_at:
        toDateInput(
          offer.starts_at
        ),

      ends_at:
        toDateInput(
          offer.ends_at
        ),

      active:
        Boolean(offer.active),

      book_ids:
        Array.isArray(offer.books)
          ? offer.books.map(
              book => book.id
            )
          : []

    })

  }


  // ===================================================
  // UPDATE OFFER
  //
  // PUT /admin/offers/{offer}
  // ===================================================

  const handleUpdateOffer = async (
    event
  ) => {

    event.preventDefault()


    if (!editingOffer?.id) {
      return
    }


    if (
      !validateForm(
        editForm,
        setEditErrors
      )
    ) {
      return
    }


    setSavingEdit(true)

    setMessage('')

    setEditErrors({})


    try {

      const payload = {

        discount_percent:
          Number(
            editForm.discount_percent
          ),

        active:
          Boolean(editForm.active),

        book_ids:
          editForm.book_ids,

        starts_at:
          editForm.starts_at || null,

        ends_at:
          editForm.ends_at || null

      }


      const res = await api.put(
        `/admin/offers/${editingOffer.id}`,
        payload
      )


      showMessage(
        res.data?.message ||
        'Offer updated successfully.'
      )


      setEditingOffer(null)

      setBookSearch('')


      await loadOffers(
        pagination.currentPage
      )

    }

    catch (err) {

      console.error(
        'Update offer error:',
        err
      )


      setEditErrors(
        normalizeErrors(err)
      )


      showMessage(
        err.response?.data?.message ||
        'Offer could not be updated.',
        'error'
      )

    }

    finally {

      setSavingEdit(false)

    }

  }


  // ===================================================
  // DELETE OFFER
  //
  // DELETE /admin/offers/{offer}
  // ===================================================

  const handleDeleteOffer = async (
    offer
  ) => {

    const confirmed =
      window.confirm(
        `Delete offer #${offer.id}?`
      )


    if (!confirmed) {
      return
    }


    setBusyId(offer.id)

    setMessage('')


    try {

      const res = await api.delete(
        `/admin/offers/${offer.id}`
      )


      showMessage(
        res.data?.message ||
        'Offer deleted successfully.'
      )


      const targetPage =

        offers.length === 1 &&
        pagination.currentPage > 1

          ? pagination.currentPage - 1

          : pagination.currentPage


      await loadOffers(
        targetPage
      )

    }

    catch (err) {

      console.error(
        'Delete offer error:',
        err
      )


      showMessage(
        err.response?.data?.message ||
        'Offer could not be deleted.',
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

  const goToPage = (page) => {

    if (
      page < 1 ||
      page > pagination.lastPage ||
      page === pagination.currentPage
    ) {
      return
    }


    loadOffers(page)

  }


  // ===================================================
  // JSX
  // ===================================================

  return (

    <div className='w-full flex flex-col h-screen gap-5 pb-10'>


      {/* =============================================
          HEADER
      ============================================== */}

      <div className='flex flex-col md:flex-row gap-4 md:items-center md:justify-between'>


        <div>

          {/* <h1 className='text-2xl font-bold text-[#122F21] flex items-center gap-2'>

            <Tag size={27} />

            Offers Management

          </h1> */}


          <p className='text-sm text-[#122F21]/60 mt-1'>

            Create and manage book discounts.

          </p>

        </div>


        <div className='flex gap-2'>


          <button
            type='button'
            disabled={loading}
            onClick={() =>
              loadOffers(
                pagination.currentPage
              )
            }
            className='flex items-center gap-2 bg-[#AAC3AD] text-[#122F21] px-4 py-2 rounded-xl cursor-pointer disabled:opacity-50'
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


          <button
            type='button'
            onClick={() => {

              setAddForm(EMPTY_FORM)

              setAddErrors({})

              setBookSearch('')

              setShowAddModal(true)

            }}
            className='flex items-center gap-2 bg-[#122F21] text-white px-4 py-2 rounded-xl cursor-pointer'
          >

            <Plus size={18} />

            Add Offer

          </button>

        </div>

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
          SEARCH
      ============================================== */}

      <div className='bg-[#AAC3AD] p-4 rounded-2xl shadow-md'>


        <div className='relative max-w-xl'>

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
            placeholder='Search by offer ID, discount or book title...'
            className='w-full bg-[#F6EFC5] rounded-xl py-3 pl-10 pr-4 outline-none'
          />

        </div>

      </div>


      {/* =============================================
          SUMMARY
      ============================================== */}

      <div className='flex gap-3 flex-wrap'>


        <SummaryCard
          label='Total Offers'
          value={pagination.total}
        />


        <SummaryCard
          label='Current Page'
          value={offers.length}
        />


        <SummaryCard
          label='Active On Page'
          value={
            offers.filter(
              offer =>
                getOfferState(offer)
                  .text === 'Active'
            ).length
          }
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

            Loading offers...

          </div>

        ) : filteredOffers.length === 0 ? (

          <div className='min-h-[300px] flex flex-col items-center justify-center text-[#122F21]/70'>

            <Tag
              size={45}
              className='mb-3'
            />

            No offers found.

          </div>

        ) : (

          <div className='overflow-x-auto h-full'>

            <table className='w-full min-w-[1050px] text-[#122F21]'>


              <thead className='bg-[#A6B37D]'>

                <tr>

                  <th className='p-4 text-center'>
                    ID
                  </th>

                  <th className='p-4 text-center'>
                    Discount
                  </th>

                  <th className='p-4 text-center'>
                    Starts
                  </th>

                  <th className='p-4 text-center'>
                    Ends
                  </th>

                  <th className='p-4 text-center'>
                    Status
                  </th>

                  <th className='p-4 text-left'>
                    Books
                  </th>

                  <th className='p-4 text-center'>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredOffers.map(
                  offer => {

                    const state =
                      getOfferState(offer)


                    return (

                      <tr
                        key={offer.id}
                        className='border-b border-[#122F21]/10 hover:bg-[#6cb474]/30 transition'
                      >


                        <td className='p-4 text-center font-bold'>

                          #{offer.id}

                        </td>


                        <td className='p-4 text-center'>

                          <span className='inline-flex items-center gap-1 bg-[#F6EFC5] px-3 py-1 rounded-lg font-bold'>

                            <Percent size={15} />

                            {
                              offer.discount_percent
                            }%

                          </span>

                        </td>


                        <td className='p-4 text-center'>

                          {
                            formatDate(
                              offer.starts_at
                            )
                          }

                        </td>


                        <td className='p-4 text-center'>

                          {
                            formatDate(
                              offer.ends_at
                            )
                          }

                        </td>


                        <td className='p-4 text-center'>

                          <span
                            className={`
                              px-3
                              py-1
                              rounded-full
                              text-xs
                              font-bold
                              ${state.className}
                            `}
                          >

                            {state.text}

                          </span>

                        </td>


                        <td className='p-4'>

                          {
                            Array.isArray(
                              offer.books
                            ) &&
                            offer.books.length > 0

                              ? (

                                <div className='flex flex-wrap gap-1'>

                                  {
                                    offer.books.map(
                                      book => (

                                        <span
                                          key={book.id}
                                          className='bg-[#F6EFC5] px-2 py-1 rounded-lg text-xs'
                                        >

                                          {book.title}

                                        </span>

                                      )
                                    )
                                  }

                                </div>

                              )

                              : '—'
                          }

                        </td>


                        <td className='p-4'>

                          <div className='flex justify-center gap-2'>


                            <button
                              type='button'
                              onClick={() =>
                                openEditModal(
                                  offer
                                )
                              }
                              className='flex items-center gap-1 bg-[#122F21] text-white px-3 py-2 rounded-lg cursor-pointer'
                            >

                              <Edit3 size={15} />

                              Edit

                            </button>


                            <button
                              type='button'
                              disabled={
                                busyId ===
                                offer.id
                              }
                              onClick={() =>
                                handleDeleteOffer(
                                  offer
                                )
                              }
                              className='flex items-center gap-1 bg-red-700 text-white px-3 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                            >

                              {
                                busyId ===
                                offer.id

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
              offers

            </div>


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
          ADD MODAL
      ============================================== */}

      {showAddModal && (

        <OfferModal
          title='Create Offer'

          form={addForm}

          errors={addErrors}

          onChange={handleAddChange}

          onToggleBook={
            bookId =>
              toggleBook(
                bookId,
                'add'
              )
          }

          books={filteredBooks}

          booksLoading={booksLoading}

          bookSearch={bookSearch}

          setBookSearch={
            setBookSearch
          }

          busy={adding}

          submitText='Create Offer'

          onSubmit={
            handleCreateOffer
          }

          onClose={() => {

            if (!adding) {
              setShowAddModal(false)
            }

          }}
        />

      )}


      {/* =============================================
          EDIT MODAL
      ============================================== */}

      {editingOffer && (

        <OfferModal
          title={`Edit Offer #${editingOffer.id}`}

          form={editForm}

          errors={editErrors}

          onChange={handleEditChange}

          onToggleBook={
            bookId =>
              toggleBook(
                bookId,
                'edit'
              )
          }

          books={filteredBooks}

          booksLoading={booksLoading}

          bookSearch={bookSearch}

          setBookSearch={
            setBookSearch
          }

          busy={savingEdit}

          submitText='Save Changes'

          onSubmit={
            handleUpdateOffer
          }

          onClose={() => {

            if (!savingEdit) {
              setEditingOffer(null)
            }

          }}
        />

      )}

    </div>

  )

}


// =====================================================
// OFFER MODAL
// =====================================================

const OfferModal = ({
  title,
  form,
  errors,
  onChange,
  onToggleBook,
  books,
  booksLoading,
  bookSearch,
  setBookSearch,
  busy,
  submitText,
  onSubmit,
  onClose
}) => {

  return (

    <div
      className='fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4'
      onClick={onClose}
    >

      <div
        className='bg-[#F6EFC5] rounded-2xl shadow-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto'
        onClick={event =>
          event.stopPropagation()
        }
      >


        {/* HEADER */}

        <div className='sticky top-0 bg-[#F6EFC5] border-b border-[#122F21]/10 p-5 flex justify-between items-center z-10'>

          <h2 className='text-xl font-bold text-[#122F21]'>

            {title}

          </h2>


          <button
            type='button'
            onClick={onClose}
            className='bg-[#AAC3AD] p-2 rounded-lg cursor-pointer'
          >

            <X size={20} />

          </button>

        </div>


        <form
          onSubmit={onSubmit}
          className='p-5 flex flex-col gap-5'
        >


          {/* DISCOUNT */}

          <div>

            <label className='block text-sm font-bold text-[#122F21] mb-1'>

              Discount Percent *

            </label>


            <div className='relative'>

              <Percent
                size={17}
                className='absolute left-3 top-1/2 -translate-y-1/2'
              />


              <input
                type='number'
                name='discount_percent'
                min='1'
                max='100'
                value={
                  form.discount_percent
                }
                onChange={onChange}
                className='w-full bg-[#AAC3AD] rounded-xl p-3 pl-10 outline-none'
                required
              />

            </div>


            <FieldError
              error={
                errors.discount_percent
              }
            />

          </div>


          {/* DATES */}

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>


            <div>

              <label className='block text-sm font-bold text-[#122F21] mb-1'>

                Start Date

              </label>


              <div className='relative'>

                <Calendar
                  size={17}
                  className='absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none'
                />


                <input
                  type='date'
                  name='starts_at'
                  value={form.starts_at}
                  onChange={onChange}
                  className='w-full bg-[#AAC3AD] rounded-xl p-3 pl-10 outline-none'
                />

              </div>


              <FieldError
                error={
                  errors.starts_at
                }
              />

            </div>


            <div>

              <label className='block text-sm font-bold text-[#122F21] mb-1'>

                End Date

              </label>


              <div className='relative'>

                <Calendar
                  size={17}
                  className='absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none'
                />


                <input
                  type='date'
                  name='ends_at'
                  min={
                    form.starts_at ||
                    undefined
                  }
                  value={form.ends_at}
                  onChange={onChange}
                  className='w-full bg-[#AAC3AD] rounded-xl p-3 pl-10 outline-none'
                />

              </div>


              <FieldError
                error={
                  errors.ends_at
                }
              />

            </div>

          </div>


          {/* ACTIVE */}

          <label className='bg-[#AAC3AD] rounded-xl p-4 flex items-center justify-between cursor-pointer'>

            <div>

              <p className='font-bold text-[#122F21]'>

                Active Offer

              </p>


              <p className='text-xs text-[#122F21]/60 mt-1'>

                The offer will only be considered active when this option is enabled and its date range is valid.

              </p>

            </div>


            <input
              type='checkbox'
              name='active'
              checked={
                Boolean(form.active)
              }
              onChange={onChange}
              className='w-5 h-5'
            />

          </label>


          {/* BOOK SELECTION */}

          <div>

            <div className='flex justify-between items-center mb-2'>

              <div>

                <label className='block text-sm font-bold text-[#122F21]'>

                  Books *

                </label>


                <p className='text-xs text-[#122F21]/60'>

                  Selected:
                  {' '}
                  {form.book_ids.length}

                </p>

              </div>

            </div>


            {/* BOOK SEARCH */}

            <div className='relative mb-3'>

              <Search
                size={17}
                className='absolute left-3 top-1/2 -translate-y-1/2'
              />


              <input
                type='text'
                value={bookSearch}
                onChange={event =>
                  setBookSearch(
                    event.target.value
                  )
                }
                placeholder='Search by book title, author or ID...'
                className='w-full bg-[#AAC3AD] rounded-xl py-3 pl-10 pr-4 outline-none'
              />

            </div>


            <FieldError
              error={errors.book_ids}
            />


            <div className='border border-[#122F21]/20 rounded-xl overflow-hidden max-h-72 overflow-y-auto'>


              {booksLoading ? (

                <div className='p-8 flex items-center justify-center gap-2 text-[#122F21]'>

                  <RefreshCw
                    size={18}
                    className='animate-spin'
                  />

                  Loading books...

                </div>

              ) : books.length === 0 ? (

                <div className='p-8 text-center text-[#122F21]/60'>

                  No books found.

                </div>

              ) : (

                books.map(book => {

                  const selected =
                    form.book_ids.includes(
                      book.id
                    )


                  const author =
                    book.author?.full_name ||
                    book.author_name ||
                    'Unknown author'


                  return (

                    <label
                      key={book.id}
                      className={`
                        flex
                        gap-3
                        items-center
                        p-3
                        cursor-pointer
                        border-b
                        border-[#122F21]/10

                        ${
                          selected
                            ? 'bg-[#A6B37D]'
                            : 'bg-[#AAC3AD]'
                        }
                      `}
                    >

                      <input
                        type='checkbox'
                        checked={selected}
                        onChange={() =>
                          onToggleBook(
                            book.id
                          )
                        }
                        className='w-4 h-4'
                      />


                      <div className='flex-1'>

                        <p className='font-bold text-[#122F21]'>

                          {book.title}

                        </p>


                        <p className='text-xs text-[#122F21]/60'>

                          #{book.id}
                          {' • '}
                          {author}

                        </p>

                      </div>

                    </label>

                  )

                })

              )}

            </div>

          </div>


          {/* BUTTONS */}

          <div className='flex justify-end gap-2 pt-2'>


            <button
              type='button'
              disabled={busy}
              onClick={onClose}
              className='bg-gray-300 px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50'
            >

              Cancel

            </button>


            <button
              type='submit'
              disabled={busy}
              className='bg-[#122F21] text-white px-5 py-2 rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-2'
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

              {
                busy
                  ? 'Processing...'
                  : submitText
              }

            </button>

          </div>

        </form>

      </div>

    </div>

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
// FIELD ERROR
// =====================================================

const FieldError = ({
  error
}) => {

  if (!error) {
    return null
  }


  const text =
    Array.isArray(error)
      ? error[0]
      : error


  return (

    <p className='text-red-700 text-xs mt-1'>

      {text}

    </p>

  )

}


export default Offers