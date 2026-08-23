import React, {
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  FileText,
  Image,
  Plus,
  RefreshCw,
  Trash2,
  Upload
} from 'lucide-react'

import {
  createManualBook,
  getCategoriesPublic
} from '../../api/libraryEmployeeApi'


// =====================================================
// CONSTANTS
// =====================================================

const MAX_COVER_SIZE =
  5 * 1024 * 1024

const MAX_PDF_SIZE =
  10 * 1024 * 1024

const CURRENT_YEAR =
  new Date().getFullYear()


const BOOK_TYPES = [
  {
    value: 'physical',
    label: 'Physical'
  },
  {
    value: 'digital',
    label: 'Digital'
  },
  {
    value: 'both',
    label: 'Physical + Digital'
  }
]


const createInitialForm = () => ({
  title: '',
  author_name: '',
  description: '',
  publisher: '',
  publisher_year: '',
  language: '',
  page_count: '',
  book_type: 'physical',

  price_physical: '',
  price_digital: '',

  sale_copies_count: '0',
  borrow_copies_count: '0',

  category_ids: [],

  cover_image: null,
  digital_file: null,

  borrow_options: []
})


// =====================================================
// COMPONENT
// =====================================================

const ManualBook = () => {

  // ===================================================
  // FORM
  // ===================================================

  const [form, setForm] =
    useState(
      createInitialForm()
    )

  const [
    formVersion,
    setFormVersion
  ] = useState(0)


  // ===================================================
  // CATEGORIES
  // ===================================================

  const [
    categories,
    setCategories
  ] = useState([])

  const [
    categoriesLoading,
    setCategoriesLoading
  ] = useState(true)


  // ===================================================
  // FILE PREVIEW
  // ===================================================

  const [
    coverPreview,
    setCoverPreview
  ] = useState(null)


  // ===================================================
  // REQUEST
  // ===================================================

  const [busy, setBusy] =
    useState(false)

  const [message, setMessage] =
    useState('')

  const [
    messageType,
    setMessageType
  ] = useState('success')

  const [
    errors,
    setErrors
  ] = useState({})


  // ===================================================
  // BOOK TYPE
  // ===================================================

  const isPhysical =
    form.book_type === 'physical' ||
    form.book_type === 'both'

  const isDigital =
    form.book_type === 'digital' ||
    form.book_type === 'both'


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
  // LOAD CATEGORIES
  //
  // GET /categories
  //
  // Returns active categories only.
  // ===================================================

  const loadCategories =
    async () => {

      setCategoriesLoading(true)


      try {

        const res =
          await getCategoriesPublic()


        const rows =
          res.data?.data


        setCategories(
          Array.isArray(rows)
            ? rows
            : []
        )

      }

      catch (err) {

        console.error(
          'Categories loading error:',
          err
        )


        setCategories([])


        showMessage(
          err.response?.data?.message ||
          'Categories could not be loaded.',
          'error'
        )

      }

      finally {

        setCategoriesLoading(false)

      }

    }


  useEffect(() => {

    loadCategories()

  }, [])


  // ===================================================
  // CLEAN COVER PREVIEW
  // ===================================================

  useEffect(() => {

    return () => {

      if (coverPreview) {

        URL.revokeObjectURL(
          coverPreview
        )

      }

    }

  }, [coverPreview])


  // ===================================================
  // NORMAL CHANGE
  // ===================================================

  const handleChange = event => {

    const {
      name,
      value
    } = event.target


    setForm(prev => ({
      ...prev,
      [name]: value
    }))


    setErrors(prev => ({
      ...prev,
      [name]: undefined
    }))

  }


  // ===================================================
  // BOOK TYPE
  // ===================================================

  const handleBookTypeChange =
    value => {

      setForm(prev => ({

        ...prev,

        book_type: value,

        price_physical:
          value === 'digital'
            ? ''
            : prev.price_physical,

        price_digital:
          value === 'physical'
            ? ''
            : prev.price_digital,

        sale_copies_count:
          value === 'digital'
            ? '0'
            : prev.sale_copies_count,

        borrow_copies_count:
          value === 'digital'
            ? '0'
            : prev.borrow_copies_count,

        digital_file:
          value === 'physical'
            ? null
            : prev.digital_file,

        borrow_options:
          prev.borrow_options.map(
            option => ({

              ...option,

              physical_price:
                value === 'digital'
                  ? ''
                  : option.physical_price,

              digital_price:
                value === 'physical'
                  ? ''
                  : option.digital_price

            })
          )

      }))


      setErrors({})

  }


  // ===================================================
  // COVER
  // ===================================================

  const handleCoverChange =
    event => {

      const file =
        event.target.files?.[0]


      if (!file) {
        return
      }


      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp'
      ]


      if (
        !allowedTypes.includes(
          file.type
        )
      ) {

        setErrors(prev => ({
          ...prev,
          cover_image:
            'Cover must be JPG, JPEG, PNG or WEBP.'
        }))

        return

      }


      if (
        file.size >
        MAX_COVER_SIZE
      ) {

        setErrors(prev => ({
          ...prev,
          cover_image:
            'Cover image must not exceed 5 MB.'
        }))

        return

      }


      if (coverPreview) {

        URL.revokeObjectURL(
          coverPreview
        )

      }


      const preview =
        URL.createObjectURL(file)


      setCoverPreview(preview)


      setForm(prev => ({
        ...prev,
        cover_image: file
      }))


      setErrors(prev => ({
        ...prev,
        cover_image: undefined
      }))

  }


  // ===================================================
  // DIGITAL FILE
  // ===================================================

  const handleDigitalFileChange =
    event => {

      const file =
        event.target.files?.[0]


      if (!file) {
        return
      }


      if (
        file.type !==
        'application/pdf'
      ) {

        setErrors(prev => ({
          ...prev,
          digital_file:
            'Digital file must be PDF.'
        }))

        return

      }


      if (
        file.size >
        MAX_PDF_SIZE
      ) {

        setErrors(prev => ({
          ...prev,
          digital_file:
            'Digital PDF must not exceed 10 MB.'
        }))

        return

      }


      setForm(prev => ({
        ...prev,
        digital_file: file
      }))


      setErrors(prev => ({
        ...prev,
        digital_file: undefined
      }))

  }


  // ===================================================
  // CATEGORY
  // ===================================================

  const toggleCategory =
    categoryId => {

      setForm(prev => {

        const exists =
          prev.category_ids.includes(
            categoryId
          )


        return {

          ...prev,

          category_ids:
            exists

              ? prev.category_ids.filter(
                  id =>
                    id !== categoryId
                )

              : [
                  ...prev.category_ids,
                  categoryId
                ]

        }

      })


      setErrors(prev => ({
        ...prev,
        category_ids: undefined
      }))

  }


  // ===================================================
  // BORROW OPTIONS
  // ===================================================

  const addBorrowOption = () => {

    setForm(prev => ({

      ...prev,

      borrow_options: [
        ...prev.borrow_options,
        {
          duration_days: '',
          physical_price: '',
          digital_price: ''
        }
      ]

    }))

  }


  const updateBorrowOption = (
    index,
    field,
    value
  ) => {

    setForm(prev => ({

      ...prev,

      borrow_options:
        prev.borrow_options.map(
          (
            option,
            optionIndex
          ) =>

            optionIndex === index

              ? {
                  ...option,
                  [field]: value
                }

              : option
        )

    }))

  }


  const removeBorrowOption =
    index => {

      setForm(prev => ({

        ...prev,

        borrow_options:
          prev.borrow_options.filter(
            (
              _,
              optionIndex
            ) =>
              optionIndex !== index
          )

      }))

  }


  // ===================================================
  // CLIENT VALIDATION
  // ===================================================

  const validate = () => {

    const nextErrors = {}


    if (!form.title.trim()) {

      nextErrors.title =
        'Title is required.'

    }


    if (
      form.title.trim().length >
      255
    ) {

      nextErrors.title =
        'Title may not exceed 255 characters.'

    }


    if (
      !form.author_name.trim()
    ) {

      nextErrors.author_name =
        'Author name is required.'

    }


    if (
      form.author_name
        .trim()
        .length > 255
    ) {

      nextErrors.author_name =
        'Author name may not exceed 255 characters.'

    }


    if (
      !form.description.trim()
    ) {

      nextErrors.description =
        'Description is required.'

    }


    if (
      !form.publisher.trim()
    ) {

      nextErrors.publisher =
        'Publisher is required.'

    }


    if (
      form.publisher
        .trim()
        .length > 255
    ) {

      nextErrors.publisher =
        'Publisher may not exceed 255 characters.'

    }


    if (!form.language.trim()) {

      nextErrors.language =
        'Language is required.'

    }


    if (
      form.language
        .trim()
        .length > 50
    ) {

      nextErrors.language =
        'Language may not exceed 50 characters.'

    }


    if (
      form.publisher_year !== ''
    ) {

      const year =
        Number(
          form.publisher_year
        )


      if (
        !Number.isInteger(year) ||
        year < 1400 ||
        year > CURRENT_YEAR + 1
      ) {

        nextErrors.publisher_year =
          `Publication year must be between 1400 and ${CURRENT_YEAR + 1}.`

      }

    }


    if (
      form.page_count !== ''
    ) {

      const pages =
        Number(
          form.page_count
        )


      if (
        !Number.isInteger(pages) ||
        pages < 1
      ) {

        nextErrors.page_count =
          'Page count must be at least 1.'

      }

    }


    if (
      form.category_ids.length ===
      0
    ) {

      nextErrors.category_ids =
        'Select at least one category.'

    }


    if (!form.cover_image) {

      nextErrors.cover_image =
        'Cover image is required.'

    }


    if (
      isPhysical &&
      form.price_physical === ''
    ) {

      nextErrors.price_physical =
        'Physical price is required.'

    }


    if (
      isDigital &&
      form.price_digital === ''
    ) {

      nextErrors.price_digital =
        'Digital price is required.'

    }


    if (
      isDigital &&
      !form.digital_file
    ) {

      nextErrors.digital_file =
        'Digital PDF is required.'

    }


    if (isPhysical) {

      const saleCopies =
        Number(
          form.sale_copies_count
        )

      const borrowCopies =
        Number(
          form.borrow_copies_count
        )


      if (
        !Number.isInteger(
          saleCopies
        ) ||
        saleCopies < 0
      ) {

        nextErrors.sale_copies_count =
          'Sale copies must be a non-negative integer.'

      }


      if (
        !Number.isInteger(
          borrowCopies
        ) ||
        borrowCopies < 0
      ) {

        nextErrors.borrow_copies_count =
          'Borrow copies must be a non-negative integer.'

      }

    }


    form.borrow_options.forEach(
      (
        option,
        index
      ) => {

        const duration =
          Number(
            option.duration_days
          )


        if (
          !Number.isInteger(duration) ||
          duration < 1
        ) {

          nextErrors[
            `borrow_options.${index}.duration_days`
          ] =
            'Duration must be at least 1 day.'

        }

      }
    )


    setErrors(nextErrors)


    return (
      Object.keys(nextErrors)
        .length === 0
    )

  }


  // ===================================================
  // RESET
  // ===================================================

  const resetForm = () => {

    if (coverPreview) {

      URL.revokeObjectURL(
        coverPreview
      )

    }


    setCoverPreview(null)

    setForm(
      createInitialForm()
    )

    setErrors({})


    /*
      Forces native file inputs
      to clear as well.
    */

    setFormVersion(
      previous =>
        previous + 1
    )

  }


  // ===================================================
  // FORM DATA
  // ===================================================

  const buildFormData = () => {

    const data =
      new FormData()


    // Required strings

    data.append(
      'title',
      form.title.trim()
    )

    data.append(
      'author_name',
      form.author_name.trim()
    )

    data.append(
      'description',
      form.description.trim()
    )

    data.append(
      'publisher',
      form.publisher.trim()
    )

    data.append(
      'language',
      form.language.trim()
    )

    data.append(
      'book_type',
      form.book_type
    )


    // Optional values.
    // Do not append empty strings.

    if (
      form.publisher_year !== ''
    ) {

      data.append(
        'publisher_year',
        form.publisher_year
      )

    }


    if (
      form.page_count !== ''
    ) {

      data.append(
        'page_count',
        form.page_count
      )

    }


    // Prices

    if (isPhysical) {

      data.append(
        'price_physical',
        form.price_physical
      )


      data.append(
        'sale_copies_count',
        form.sale_copies_count ||
        '0'
      )


      data.append(
        'borrow_copies_count',
        form.borrow_copies_count ||
        '0'
      )

    }


    if (isDigital) {

      data.append(
        'price_digital',
        form.price_digital
      )

    }


    // Files

    data.append(
      'cover_image',
      form.cover_image
    )


    if (
      isDigital &&
      form.digital_file
    ) {

      data.append(
        'digital_file',
        form.digital_file
      )

    }


    // Categories

    form.category_ids.forEach(
      categoryId => {

        data.append(
          'category_ids[]',
          String(categoryId)
        )

      }
    )


    // Borrow options
    //
    // Exact Laravel FormData structure:
    //
    // borrow_options[0][duration_days]
    // borrow_options[0][physical_price]
    // borrow_options[0][digital_price]

    form.borrow_options.forEach(
      (
        option,
        index
      ) => {

        data.append(
          `borrow_options[${index}][duration_days]`,
          option.duration_days
        )


        if (
          isPhysical &&
          option.physical_price !== ''
        ) {

          data.append(
            `borrow_options[${index}][physical_price]`,
            option.physical_price
          )

        }


        if (
          isDigital &&
          option.digital_price !== ''
        ) {

          data.append(
            `borrow_options[${index}][digital_price]`,
            option.digital_price
          )

        }

      }
    )


    return data

  }


  // ===================================================
  // SUBMIT
  //
  // POST
  // /employee/library/manual-books
  //
  // multipart/form-data
  // ===================================================

  const handleSubmit =
    async event => {

      event.preventDefault()

      setMessage('')


      if (!validate()) {
        return
      }


      const confirmed =
        window.confirm(
          'Publish this manual book immediately? Manual books do not go through the content review workflow.'
        )


      if (!confirmed) {
        return
      }


      setBusy(true)


      try {

        const formData =
          buildFormData()


        const res =
          await createManualBook(
            formData
          )


        const createdBook =
          res.data?.data


        showMessage(
          res.data?.message ||
          (
            createdBook?.id
              ? `Book #${createdBook.id} was published successfully.`
              : 'Manual book was published successfully.'
          )
        )


        resetForm()

      }

      catch (err) {

        console.error(
          'Manual book creation error:',
          err
        )


        const response =
          err.response?.data


        if (
          err.response?.status ===
            422 &&
          response?.errors
        ) {

          setErrors(
            response.errors
          )

        }


        showMessage(
          response?.message ||
          'The manual book could not be published.',
          'error'
        )

      }

      finally {

        setBusy(false)

      }

    }


  // ===================================================
  // SERVER ERROR SUMMARY
  // ===================================================

  const errorMessages =
    useMemo(() => {

      return Object.entries(
        errors
      )
        .flatMap(
          ([field, value]) => {

            if (!value) {
              return []
            }


            if (
              Array.isArray(value)
            ) {

              return value.map(
                message =>
                  `${field}: ${message}`
              )

            }


            return [
              `${field}: ${value}`
            ]

          }
        )

    }, [errors])


  // ===================================================
  // JSX
  // ===================================================

  return (

    <div className='w-full flex flex-col gap-5 pb-10'>


      {/* =============================================
          HEADER
      ============================================== */}

      <div>

        {/* <h1 className='text-2xl font-bold text-[#122F21] flex items-center gap-2'>

          <BookOpen size={28} />

          Add Manual Book

        </h1> */}


        <p className='text-sm text-[#122F21]/60 mt-1'>

          Add a book that is not associated with an author account.

        </p>

      </div>


      {/* =============================================
          IMPORTANT
      ============================================== */}

      {/* <div className='bg-yellow-100 text-yellow-900 rounded-2xl p-5 flex gap-3'>

        <AlertTriangle
          size={21}
          className='shrink-0 mt-0.5'
        />


        <div>

          <p className='font-bold'>

            Manual books are published immediately

          </p>


          <p className='text-sm leading-6 mt-1'>

            This operation does not create a draft and does not enter the content review workflow. The backend publishes the book directly and stores the written author name instead of linking the book to an author account.

          </p>

        </div>

      </div> */}


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
          VALIDATION SUMMARY
      ============================================== */}

      {
        errorMessages.length >
          0 &&
        (

          <div className='bg-red-50 border border-red-200 rounded-2xl p-4'>

            <p className='font-bold text-red-800 mb-2'>

              Please review these fields:

            </p>


            <ul className='list-disc pl-5 text-sm text-red-700 space-y-1'>

              {errorMessages.map(
                (
                  error,
                  index
                ) => (

                  <li key={index}>
                    {error}
                  </li>

                )
              )}

            </ul>

          </div>

        )
      }


      {/* =============================================
          FORM
      ============================================== */}

      <form
        key={formVersion}
        onSubmit={
          handleSubmit
        }
        className='bg-[#AAC3AD] rounded-2xl shadow-md p-5 lg:p-6 flex flex-col gap-7'
      >


        {/* ===========================================
            BASIC INFORMATION
        ============================================ */}

        <Section
          title='Basic Information'
          description='Required identifying information for the book.'
        >


          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>


            <TextField
              label='Book Title'
              required
              name='title'
              value={form.title}
              onChange={handleChange}
              disabled={busy}
              maxLength={255}
              error={errors.title}
            />


            <TextField
              label='Author Name'
              required
              name='author_name'
              value={
                form.author_name
              }
              onChange={handleChange}
              disabled={busy}
              maxLength={255}
              error={
                errors.author_name
              }
            />


            <TextField
              label='Publisher'
              required
              name='publisher'
              value={
                form.publisher
              }
              onChange={handleChange}
              disabled={busy}
              maxLength={255}
              error={
                errors.publisher
              }
            />


            <TextField
              label='Language'
              required
              name='language'
              value={
                form.language
              }
              onChange={handleChange}
              disabled={busy}
              maxLength={50}
              placeholder='Example: Arabic'
              error={
                errors.language
              }
            />


            <NumberField
              label='Publication Year'
              name='publisher_year'
              value={
                form.publisher_year
              }
              onChange={handleChange}
              disabled={busy}
              min={1400}
              max={
                CURRENT_YEAR + 1
              }
              error={
                errors.publisher_year
              }
            />


            <NumberField
              label='Page Count'
              name='page_count'
              value={
                form.page_count
              }
              onChange={handleChange}
              disabled={busy}
              min={1}
              error={
                errors.page_count
              }
            />


            <div className='md:col-span-2'>

              <label className='block text-sm font-bold text-[#122F21] mb-2'>

                Description *

              </label>


              <textarea
                name='description'
                rows={5}
                required
                value={
                  form.description
                }
                disabled={busy}
                onChange={
                  handleChange
                }
                placeholder='Book description...'
                className='w-full bg-[#F6EFC5] rounded-xl p-3 outline-none disabled:opacity-60'
              />


              <FieldError
                error={
                  errors.description
                }
              />

            </div>

          </div>

        </Section>


        {/* ===========================================
            TYPE
        ============================================ */}

        <Section
          title='Book Type'
          description='Choose which formats will be available.'
        >

          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>

            {BOOK_TYPES.map(
              type => (

                <button
                  key={type.value}
                  type='button'
                  disabled={busy}
                  onClick={() =>
                    handleBookTypeChange(
                      type.value
                    )
                  }
                  className={`
                    p-4
                    rounded-xl
                    text-left
                    cursor-pointer
                    disabled:opacity-50

                    ${
                      form.book_type ===
                      type.value
                        ? 'bg-[#122F21] text-white'
                        : 'bg-[#F6EFC5] text-[#122F21]'
                    }
                  `}
                >

                  <p className='font-bold'>

                    {type.label}

                  </p>

                </button>

              )
            )}

          </div>

        </Section>


        {/* ===========================================
            PRICES + PHYSICAL COPIES
        ============================================ */}

        <Section
          title='Pricing & Inventory'
          description='Configure prices and initial physical inventory.'
        >

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>


            {isPhysical && (

              <>

                <NumberField
                  label='Physical Price'
                  required
                  name='price_physical'
                  value={
                    form.price_physical
                  }
                  onChange={
                    handleChange
                  }
                  disabled={busy}
                  step='0.01'
                  error={
                    errors.price_physical
                  }
                />


                <NumberField
                  label='Sale Copies Count'
                  name='sale_copies_count'
                  value={
                    form.sale_copies_count
                  }
                  onChange={
                    handleChange
                  }
                  disabled={busy}
                  min={0}
                  step='1'
                  error={
                    errors.sale_copies_count
                  }
                />


                <NumberField
                  label='Borrow Copies Count'
                  name='borrow_copies_count'
                  value={
                    form.borrow_copies_count
                  }
                  onChange={
                    handleChange
                  }
                  disabled={busy}
                  min={0}
                  step='1'
                  error={
                    errors.borrow_copies_count
                  }
                />

              </>

            )}


            {isDigital && (

              <NumberField
                label='Digital Price'
                required
                name='price_digital'
                value={
                  form.price_digital
                }
                onChange={
                  handleChange
                }
                disabled={busy}
                step='0.01'
                error={
                  errors.price_digital
                }
              />

            )}

          </div>

        </Section>


        {/* ===========================================
            CATEGORIES
        ============================================ */}

        <Section
          title='Categories'
          description='At least one active category must be selected.'
        >

          {categoriesLoading ? (

            <div className='bg-[#F6EFC5] rounded-xl p-5 flex items-center gap-2'>

              <RefreshCw
                size={17}
                className='animate-spin'
              />

              Loading categories...

            </div>

          ) : categories.length ===
            0 ? (

            <div className='bg-yellow-100 text-yellow-900 rounded-xl p-4'>

              No active categories are available. Create or activate a category first.

            </div>

          ) : (

            <div className='flex flex-wrap gap-2'>

              {categories.map(
                category => {

                  const selected =
                    form.category_ids.includes(
                      category.id
                    )


                  return (

                    <button
                      key={category.id}
                      type='button'
                      disabled={busy}
                      onClick={() =>
                        toggleCategory(
                          category.id
                        )
                      }
                      className={`
                        px-4
                        py-2
                        rounded-xl
                        cursor-pointer
                        disabled:opacity-50

                        ${
                          selected
                            ? 'bg-[#122F21] text-white'
                            : 'bg-[#F6EFC5] text-[#122F21]'
                        }
                      `}
                    >

                      {category.name}

                    </button>

                  )

                }
              )}

            </div>

          )}


          <FieldError
            error={
              errors.category_ids
            }
          />

        </Section>


        {/* ===========================================
            FILES
        ============================================ */}

        <Section
          title='Files'
          description='Upload the required book files.'
        >

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>


            {/* COVER */}

            <div>

              <label className='block text-sm font-bold text-[#122F21] mb-2'>

                Cover Image *

              </label>


              <label className='min-h-56 bg-[#F6EFC5] border-2 border-dashed border-[#122F21]/30 rounded-xl cursor-pointer flex flex-col items-center justify-center p-4'>


                {coverPreview ? (

                  <img
                    src={coverPreview}
                    alt='Book cover'
                    className='max-h-48 rounded-lg object-contain'
                  />

                ) : (

                  <>

                    <Image
                      size={38}
                      className='mb-3'
                    />

                    <p className='font-bold'>

                      Select Cover

                    </p>


                    <p className='text-xs opacity-60 mt-1'>

                      JPG, PNG or WEBP — max 5 MB

                    </p>

                  </>

                )}


                <input
                  type='file'
                  accept='image/jpeg,image/png,image/webp'
                  disabled={busy}
                  className='hidden'
                  onChange={
                    handleCoverChange
                  }
                />

              </label>


              {form.cover_image && (

                <p className='text-xs text-[#122F21]/70 mt-2'>

                  {form.cover_image.name}

                </p>

              )}


              <FieldError
                error={
                  errors.cover_image
                }
              />

            </div>


            {/* PDF */}

            {isDigital && (

              <div>

                <label className='block text-sm font-bold text-[#122F21] mb-2'>

                  Digital PDF *

                </label>


                <label className='min-h-56 bg-[#F6EFC5] border-2 border-dashed border-[#122F21]/30 rounded-xl cursor-pointer flex flex-col items-center justify-center p-4'>


                  <FileText
                    size={40}
                    className='mb-3'
                  />


                  <p className='font-bold'>

                    {
                      form.digital_file
                        ? form.digital_file.name
                        : 'Select PDF'
                    }

                  </p>


                  <p className='text-xs opacity-60 mt-1'>

                    PDF — max 10 MB

                  </p>


                  <input
                    type='file'
                    accept='application/pdf,.pdf'
                    disabled={busy}
                    className='hidden'
                    onChange={
                      handleDigitalFileChange
                    }
                  />

                </label>


                <FieldError
                  error={
                    errors.digital_file
                  }
                />

              </div>

            )}

          </div>

        </Section>


        {/* ===========================================
            BORROW OPTIONS
        ============================================ */}

        <Section
          title='Borrowing Options'
          description='Optional. Add the durations and borrowing prices that should be available for this book.'
        >


          <div className='flex justify-end mb-3'>

            <button
              type='button'
              disabled={busy}
              onClick={
                addBorrowOption
              }
              className='bg-[#F6EFC5] text-[#122F21] px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50'
            >

              <Plus size={16} />

              Add Borrow Option

            </button>

          </div>


          {
            form.borrow_options.length ===
              0 ? (

              <div className='bg-[#F6EFC5] rounded-xl p-5 text-sm text-[#122F21]/60 text-center'>

                No borrowing options added.

              </div>

            ) : (

              <div className='flex flex-col gap-3'>

                {form.borrow_options.map(
                  (
                    option,
                    index
                  ) => (

                    <div
                      key={index}
                      className='bg-[#F6EFC5] rounded-xl p-4'
                    >


                      <div className='flex justify-between items-center mb-3'>

                        <p className='font-bold text-[#122F21]'>

                          Option #{index + 1}

                        </p>


                        <button
                          type='button'
                          disabled={busy}
                          onClick={() =>
                            removeBorrowOption(
                              index
                            )
                          }
                          className='text-red-700 cursor-pointer disabled:opacity-50'
                        >

                          <Trash2 size={18} />

                        </button>

                      </div>


                      <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>


                        <div>

                          <label className='block text-xs font-bold mb-1'>

                            Duration Days *

                          </label>


                          <input
                            type='number'
                            min='1'
                            step='1'
                            value={
                              option.duration_days
                            }
                            disabled={busy}
                            onChange={event =>
                              updateBorrowOption(
                                index,
                                'duration_days',
                                event.target.value
                              )
                            }
                            className='w-full bg-[#AAC3AD] rounded-lg p-3 outline-none'
                          />


                          <FieldError
                            error={
                              errors[
                                `borrow_options.${index}.duration_days`
                              ]
                            }
                          />

                        </div>


                        {isPhysical && (

                          <div>

                            <label className='block text-xs font-bold mb-1'>

                              Physical Borrow Price

                            </label>


                            <input
                              type='number'
                              step='0.01'
                              value={
                                option.physical_price
                              }
                              disabled={busy}
                              onChange={event =>
                                updateBorrowOption(
                                  index,
                                  'physical_price',
                                  event.target.value
                                )
                              }
                              className='w-full bg-[#AAC3AD] rounded-lg p-3 outline-none'
                            />

                          </div>

                        )}


                        {isDigital && (

                          <div>

                            <label className='block text-xs font-bold mb-1'>

                              Digital Borrow Price

                            </label>


                            <input
                              type='number'
                              step='0.01'
                              value={
                                option.digital_price
                              }
                              disabled={busy}
                              onChange={event =>
                                updateBorrowOption(
                                  index,
                                  'digital_price',
                                  event.target.value
                                )
                              }
                              className='w-full bg-[#AAC3AD] rounded-lg p-3 outline-none'
                            />

                          </div>

                        )}

                      </div>

                    </div>

                  )
                )}

              </div>

            )
          }


          <div className='bg-[#A6B37D]/50 rounded-xl p-4 text-sm text-[#122F21] mt-4'>

            Borrowing options are optional. Each option requires a duration. Physical and digital borrowing prices may be omitted when that option should not be available for that format.

          </div>

        </Section>


        {/* ===========================================
            SUBMIT
        ============================================ */}

        <div className='border-t border-[#122F21]/10 pt-5 flex flex-col sm:flex-row sm:justify-between gap-3'>


          <p className='text-sm text-[#122F21]/60 max-w-xl'>

            Publishing will create the book immediately. There is no draft, submit-for-review, or content-employee approval step for manual books.

          </p>


          <button
            type='submit'
            disabled={
              busy ||
              categoriesLoading
            }
            className='bg-[#122F21] text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0'
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
                  <Upload size={17} />
                )
            }

            {
              busy
                ? 'Publishing...'
                : 'Publish Manual Book'
            }

          </button>

        </div>

      </form>

    </div>

  )

}


// =====================================================
// SECTION
// =====================================================

const Section = ({
  title,
  description,
  children
}) => {

  return (

    <section>

      <h2 className='text-lg font-bold text-[#122F21]'>

        {title}

      </h2>


      {description && (

        <p className='text-xs text-[#122F21]/60 mt-1 mb-4'>

          {description}

        </p>

      )}


      {!description && (
        <div className='mb-4' />
      )}


      {children}

    </section>

  )

}


// =====================================================
// TEXT FIELD
// =====================================================

const TextField = ({
  label,
  required = false,
  error,
  ...props
}) => {

  return (

    <div>

      <label className='block text-sm font-bold text-[#122F21] mb-2'>

        {label}
        {required ? ' *' : ''}

      </label>


      <input
        type='text'
        {...props}
        className='w-full bg-[#F6EFC5] rounded-xl p-3 outline-none disabled:opacity-60'
      />


      <FieldError
        error={error}
      />

    </div>

  )

}


// =====================================================
// NUMBER FIELD
// =====================================================

const NumberField = ({
  label,
  required = false,
  error,
  ...props
}) => {

  return (

    <div>

      <label className='block text-sm font-bold text-[#122F21] mb-2'>

        {label}
        {required ? ' *' : ''}

      </label>


      <input
        type='number'
        {...props}
        className='w-full bg-[#F6EFC5] rounded-xl p-3 outline-none disabled:opacity-60'
      />


      <FieldError
        error={error}
      />

    </div>

  )

}


// =====================================================
// ERROR
// =====================================================

const FieldError = ({
  error
}) => {

  if (!error) {
    return null
  }


  return (

    <p className='text-red-700 text-xs mt-1'>

      {
        Array.isArray(error)
          ? error[0]
          : error
      }

    </p>

  )

}


export default ManualBook